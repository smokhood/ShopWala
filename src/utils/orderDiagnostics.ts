/**
 * Order Flow Diagnostics
 * Helper utilities to verify order creation and update permissions
 */
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface OrderDiagnostics {
  orderExists: boolean;
  orderData: any;
  hasShopId: boolean;
  hasCustomerId: boolean;
  currentStatus: string | null;
  canDispatch: boolean;
  canComplete: boolean;
  issues: string[];
}

/**
 * Diagnose order document and permissions
 */
export async function diagnoseOrder(
  orderId: string,
  userId: string,
  userShopId: string | null
): Promise<OrderDiagnostics> {
  const issues: string[] = [];
  let orderData: any = null;
  let orderExists = false;

  try {
    // Fetch order document
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      issues.push('Order document does not exist');
      return {
        orderExists: false,
        orderData: null,
        hasShopId: false,
        hasCustomerId: false,
        currentStatus: null,
        canDispatch: false,
        canComplete: false,
        issues,
      };
    }

    orderExists = true;
    orderData = orderSnap.data();

    // Check required fields
    if (!orderData.shopId) {
      issues.push('Order missing shopId field');
    }
    if (!orderData.customerId) {
      issues.push('Order missing customerId field');
    }
    if (!orderData.status) {
      issues.push('Order missing status field');
    }

    // Check if user can dispatch (owner)
    const canDispatch =
      userShopId !== null &&
      orderData.shopId === userShopId &&
      orderData.status === 'pending';

    if (userShopId && orderData.shopId !== userShopId) {
      issues.push(
        `shopId mismatch: order has "${orderData.shopId}", user has "${userShopId}"`
      );
    }

    // Check if user can complete (customer)
    const canComplete =
      orderData.customerId === userId && orderData.status === 'dispatched';

    return {
      orderExists: true,
      orderData: {
        id: orderId,
        shopId: orderData.shopId,
        customerId: orderData.customerId,
        status: orderData.status,
        createdAt: orderData.createdAt,
      },
      hasShopId: !!orderData.shopId,
      hasCustomerId: !!orderData.customerId,
      currentStatus: orderData.status || null,
      canDispatch,
      canComplete,
      issues,
    };
  } catch (error: any) {
    issues.push(`Failed to fetch order: ${error?.message}`);
    return {
      orderExists: false,
      orderData: null,
      hasShopId: false,
      hasCustomerId: false,
      currentStatus: null,
      canDispatch: false,
      canComplete: false,
      issues,
    };
  }
}

/**
 * Diagnose user document and shop ownership
 */
export async function diagnoseUserShop(userId: string): Promise<{
  userExists: boolean;
  hasShopId: boolean;
  shopId: string | null;
  role: string | null;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      issues.push('User document does not exist');
      return {
        userExists: false,
        hasShopId: false,
        shopId: null,
        role: null,
        issues,
      };
    }

    const userData = userSnap.data();

    if (!userData.shopId) {
      issues.push('User document missing shopId field');
    }

    if (userData.role !== 'owner') {
      issues.push(`User role is "${userData.role}", expected "owner"`);
    }

    return {
      userExists: true,
      hasShopId: !!userData.shopId,
      shopId: userData.shopId || null,
      role: userData.role || null,
      issues,
    };
  } catch (error: any) {
    issues.push(`Failed to fetch user: ${error?.message}`);
    return {
      userExists: false,
      hasShopId: false,
      shopId: null,
      role: null,
      issues,
    };
  }
}

/**
 * Print diagnostic report to console
 */
export function logDiagnostics(
  orderDiag: OrderDiagnostics,
  userDiag: ReturnType<typeof diagnoseUserShop> extends Promise<infer T>
    ? T
    : never
): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ORDER DIAGNOSTICS REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n👤 USER DIAGNOSTICS:');
  console.log('  User Exists:', userDiag.userExists);
  console.log('  Has shopId:', userDiag.hasShopId);
  console.log('  Shop ID:', userDiag.shopId);
  console.log('  Role:', userDiag.role);
  if (userDiag.issues.length > 0) {
    console.log('  ⚠️  Issues:', userDiag.issues);
  }

  console.log('\n📦 ORDER DIAGNOSTICS:');
  console.log('  Order Exists:', orderDiag.orderExists);
  console.log('  Has shopId:', orderDiag.hasShopId);
  console.log('  Has customerId:', orderDiag.hasCustomerId);
  console.log('  Current Status:', orderDiag.currentStatus);
  console.log('  Can Dispatch:', orderDiag.canDispatch);
  console.log('  Can Complete:', orderDiag.canComplete);
  if (orderDiag.orderData) {
    console.log('  Order Data:', orderDiag.orderData);
  }
  if (orderDiag.issues.length > 0) {
    console.log('  ⚠️  Issues:', orderDiag.issues);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Query orders accessible to this shop owner
 */
export async function diagnoseAccessibleOrders(
  shopId: string | null,
  targetOrderId: string
): Promise<{
  canQueryOrders: boolean;
  totalOrdersFound: number;
  targetOrderFound: boolean;
  orderIds: string[];
  targetOrderData: any;
  issues: string[];
}> {
  const issues: string[] = [];

  if (!shopId) {
    issues.push('Cannot query orders: shopId is null');
    return {
      canQueryOrders: false,
      totalOrdersFound: 0,
      targetOrderFound: false,
      orderIds: [],
      targetOrderData: null,
      issues,
    };
  }

  try {
    // Query orders for this shop
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('shopId', '==', shopId), limit(50));
    const querySnapshot = await getDocs(q);

    const orderIds: string[] = [];
    let targetOrderData: any = null;
    let targetOrderFound = false;

    querySnapshot.forEach((doc) => {
      orderIds.push(doc.id);
      if (doc.id === targetOrderId) {
        targetOrderFound = true;
        targetOrderData = {
          id: doc.id,
          ...doc.data(),
        };
      }
    });

    if (!targetOrderFound && orderIds.length > 0) {
      issues.push(
        `Order ${targetOrderId} not found in shop's orders. This order may belong to a different shop.`
      );
    }

    if (orderIds.length === 0) {
      issues.push('No orders found for this shop. Shop may not have any orders yet.');
    }

    return {
      canQueryOrders: true,
      totalOrdersFound: querySnapshot.size,
      targetOrderFound,
      orderIds,
      targetOrderData,
      issues,
    };
  } catch (error: any) {
    issues.push(`Failed to query orders: ${error?.message}`);
    return {
      canQueryOrders: false,
      totalOrdersFound: 0,
      targetOrderFound: false,
      orderIds: [],
      targetOrderData: null,
      issues,
    };
  }
}

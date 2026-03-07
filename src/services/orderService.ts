// Order Service for ShopWala
import type { Order } from '@models/Order';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';

const ORDERS_COLLECTION = 'orders';

function normalizeOrderDates(data: any) {
  const toDateOrNull = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  return {
    createdAt: toDateOrNull(data.createdAt) || new Date(),
    dispatchedAt: toDateOrNull(data.dispatchedAt),
    completedAt: toDateOrNull(data.completedAt),
  };
}

/**
 * Create a new order in Firestore
 * @param order Order object
 * @param customerId Customer user ID
 * @returns Order ID
 */
export async function createOrder(
  order: Omit<Order, 'id' | 'status' | 'customerId'>,
  customerId: string
): Promise<string> {
  try {
    // Validate required fields
    if (!order.shopId || typeof order.shopId !== 'string') {
      throw new Error('Invalid order: shopId is required');
    }
    if (!order.shopName || !order.shopWhatsapp) {
      throw new Error('Invalid order: shop details are required');
    }
    if (!order.items || order.items.length === 0) {
      throw new Error('Invalid order: items are required');
    }
    if (!customerId) {
      throw new Error('Invalid order: customerId is required');
    }

    // Defensive: drop any client-side temporary id if it slips through.
    const { id: _ignoredId, ...orderWithoutId } = order as Omit<Order, 'status' | 'customerId'> & {
      id?: string;
    };

    const orderData = {
      ...orderWithoutId,
      customerId,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('[Order Service] Creating order with shopId:', order.shopId);
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
    console.log('[Order Service] Order created successfully:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[Order Service] Create order error:', {
      message: error?.message,
      code: error?.code,
      details: error,
    });
    throw error;
  }
}

/**
 * Get customer's orders
 * @param customerId Customer user ID
 * @returns Array of orders
 */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('customerId', '==', customerId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const dates = normalizeOrderDates(data);

      return {
        ...data,
        ...dates,
        // Always prefer Firestore document id, never persisted payload id.
        id: docSnap.id,
      } as Order;
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    throw error;
  }
}

/**
 * Get shop owner's orders
 * @param shopId Shop ID
 * @returns Array of orders
 */
export async function getShopOrders(shopId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('shopId', '==', shopId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const dates = normalizeOrderDates(data);

      return {
        ...data,
        ...dates,
        // Always prefer Firestore document id, never persisted payload id.
        id: docSnap.id,
      } as Order;
    });
  } catch (error) {
    console.error('Get shop orders error:', error);
    throw error;
  }
}

/**
 * Mark order as dispatched (owner action)
 * @param orderId Order ID
 * @returns void
 */
export async function markOrderDispatched(orderId: string): Promise<void> {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const { getDoc } = await import('firebase/firestore');
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    // Verify order exists and get current state
    console.log('[Order Service] Fetching order for dispatch:', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderSnap.data();
    console.log('[Order Service] Order data:', {
      id: orderId,
      status: orderData.status,
      shopId: orderData.shopId,
      customerId: orderData.customerId,
    });

    if (!orderData.shopId) {
      throw new Error('Order missing shopId field');
    }

    if (orderData.status !== 'pending') {
      throw new Error(`Order cannot be dispatched. Current status: ${orderData.status}`);
    }

    console.log('[Order Service] Updating order status to dispatched');
    await updateDoc(orderRef, {
      status: 'dispatched',
      dispatchedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[Order Service] Order dispatched successfully');
  } catch (error: any) {
    console.error('[Order Service] Mark order dispatched error:', {
      orderId,
      message: error?.message,
      code: error?.code,
      details: error,
    });
    
    // Enhance error message for permission denied
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. Verify you own this shop and the order shopId matches your shop.');
    }
    
    throw error;
  }
}

/**
 * Mark order as completed/received (customer action)
 * @param orderId Order ID
 * @returns void
 */
export async function markOrderCompleted(orderId: string): Promise<void> {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const { getDoc } = await import('firebase/firestore');
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    // Verify order exists and is in correct state
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderSnap.data();
    if (orderData.status !== 'dispatched') {
      throw new Error(`Order cannot be completed. Current status: ${orderData.status}`);
    }

    await updateDoc(orderRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[Order Service] Order completed successfully:', orderId);
  } catch (error: any) {
    console.error('[Order Service] Mark order completed error:', {
      orderId,
      message: error?.message,
      code: error?.code,
    });
    
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. You can only complete your own orders that have been dispatched.');
    }
    
    throw error;
  }
}

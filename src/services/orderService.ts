// Order Service for ShopWala
import type { Order, OrderStatus } from '@models/Order';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';

const ORDERS_COLLECTION = 'orders';

/**
 * Create a new order in Firestore
 * @param order Order object
 * @param customerId Customer user ID
 * @returns Order ID
 */
export async function createOrder(
  order: Omit<Order, 'id' | 'status' | 'customerId' | 'createdAt' | 'updatedAt' | 'dispatchedAt' | 'completedAt'>,
  customerId: string
): Promise<string> {
  try {
    const orderData = {
      ...order,
      customerId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
    return docRef.id;
  } catch (error) {
    console.error('Create order error:', error);
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
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Order[];
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
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Order[];
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
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status: 'dispatched',
      dispatchedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Mark order dispatched error:', error);
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
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Mark order completed error:', error);
    throw error;
  }
}

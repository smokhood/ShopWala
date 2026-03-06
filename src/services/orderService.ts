// Order Service for DukandaR
import type { Order } from '@models/Order';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from './firebase';

const ORDERS_COLLECTION = 'orders';

/**
 * Create a new order in Firestore
 * @param order Order object
 * @param customerId Customer user ID
 * @returns Order ID
 */
export async function createOrder(order: Omit<Order, 'id'>, customerId: string): Promise<string> {
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

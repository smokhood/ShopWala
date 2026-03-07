// Order Data Models for ShopWala

/**
 * Order status lifecycle
 */
export type OrderStatus = 'pending' | 'dispatched' | 'completed';

/**
 * Single item in shopping cart
 */
export interface CartItem {
  /** Product ID */
  productId: string;
  /** Product name in English */
  productName: string;
  /** Product name in Urdu */
  productNameUrdu: string | null;
  /** Price per unit in PKR */
  price: number;
  /** Quantity of items */
  quantity: number;
  /** Unit of measurement */
  unit: string;
  /** Shop ID where product is from */
  shopId: string;
  /** Shop name */
  shopName: string;
  /** Shop WhatsApp number */
  shopWhatsapp: string;
}

/**
 * Order model (sent via WhatsApp)
 */
export interface Order {
  /** Unique order ID */
  id: string;
  /** Order status - optional for temporary orders before Firestore persistence */
  status?: OrderStatus;
  /** Items in the order */
  items: CartItem[];
  /** Shop ID */
  shopId: string;
  /** Shop name */
  shopName: string;
  /** Shop WhatsApp number */
  shopWhatsapp: string;
  /** Customer ID - optional for temporary orders before Firestore persistence */
  customerId?: string;
  /** Customer name */
  customerName?: string;
  /** Order subtotal in PKR */
  subtotal: number;
  /** Customer note/special instructions */
  note: string | null;
  /** Order creation timestamp */
  createdAt: Date;
  /** When owner dispatched the order */
  dispatchedAt?: Date | null;
  /** When customer marked as received */
  completedAt?: Date | null;
}

/**
 * Shopping cart state
 */
export interface CartState {
  /** Items currently in cart */
  items: CartItem[];
  /** Shop ID (all items must be from same shop) */
  shopId: string | null;
  /** Shop name */
  shopName: string;
  /** Shop WhatsApp number */
  shopWhatsapp: string;
  /** Customer note for the order */
  note: string;
}

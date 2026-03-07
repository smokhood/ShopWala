/**
 * Order ViewModel - Business logic for order builder
 */
import type { CartItem } from '@models/Order';
import type { ProductWithShop } from '@models/Product';
import * as orderService from '@services/orderService';
import * as shopService from '@services/shopService';
import * as whatsappService from '@services/whatsappService';
import { useAuthStore } from '@store/authStore';
import { useCartStore } from '@store/cartStore';
import { useState } from 'react';
import { Alert } from 'react-native';

interface UseOrderViewModelReturn {
  // Cart state
  items: CartItem[];
  shopId: string | null;
  shopName: string;
  shopWhatsapp: string;
  note: string;
  
  // Computed
  totalItems: number;
  totalPrice: number;
  isEmpty: boolean;
  
  // Actions
  addToCart: (product: ProductWithShop) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  setNote: (note: string) => void;
  clearCart: () => void;
  sendOrderViaWhatsApp: () => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export function useOrderViewModel(): UseOrderViewModelReturn {
  const {
    items,
    shopId,
    shopName,
    shopWhatsapp,
    note,
    addItem,
    removeItem,
    updateQuantity,
    setNote,
    clearCart,
  } = useCartStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Computed values
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const isEmpty = items.length === 0;
  
  /**
   * Add product to cart with shop change confirmation
   */
  const addToCart = (product: ProductWithShop): void => {
    const cartShopId = useCartStore.getState().shopId;
    
    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      productNameUrdu: product.nameUrdu,
      price: product.price,
      quantity: 1,
      unit: product.unit,
      shopId: product.shopId,
      shopName: product.shop.name,
      shopWhatsapp: product.shop.whatsapp,
    };
    
    // Check if different shop
    if (cartShopId && cartShopId !== product.shopId) {
      Alert.alert(
        'نئی دکان سے آرڈر شروع کریں؟',
        'پرانا آرڈر ختم ہو جائے گا',
        [
          { text: 'نہیں', style: 'cancel' },
          {
            text: 'ہاں',
            onPress: () => {
              clearCart();
              addItem(cartItem);
            },
          },
        ]
      );
    } else {
      addItem(cartItem);
    }
  };
  
  /**
   * Build WhatsApp message from cart
   */
  const buildWhatsAppMessage = (): string => {
    let message = 'Assalam o Alaikum! 🛒\n\n';
    message += 'Mera Order (ShopWala se):\n';
    message += '─────────────────────\n';
    
    items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      message += `• ${item.productName} x${item.quantity} — Rs.${itemTotal}\n`;
    });
    
    message += '─────────────────────\n';
    message += `Total: Rs.${totalPrice}\n`;
    
    if (note) {
      message += `\nNote: ${note}\n`;
    }
    
    message += '\n📱 ShopWala App se bheja gaya';
    
    return message;
  };
  
  /**
   * Format order for display
   */
  const formatOrderForDisplay = () => {
    return {
      items,
      subtotal: totalPrice,
      itemCount: totalItems,
      shopName,
    };
  };
  
  /**
   * Send order via WhatsApp
   */
  const sendOrderViaWhatsApp = async (): Promise<void> => {
    const { user } = useAuthStore.getState();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate cart
      if (isEmpty) {
        throw new Error('آرڈر خالی ہے');
      }
      
      if (!shopId || !shopWhatsapp) {
        throw new Error('Shop کی تفصیلات نہیں ملیں');
      }
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Validate required shop data
      if (!shopId) {
        throw new Error('Shop ID missing from cart');
      }
      if (!shopName) {
        throw new Error('Shop name missing from cart');
      }
      if (!shopWhatsapp) {
        throw new Error('Shop WhatsApp missing from cart');
      }

      // Build order object
      const order = {
        items,
        shopId,
        shopName,
        shopWhatsapp,
        customerName: user.name || 'Customer',
        subtotal: totalPrice,
        note: note || null,
        createdAt: new Date(),
      };
      
      console.log('[Order ViewModel] Placing order:', {
        shopId: order.shopId,
        shopName: order.shopName,
        itemCount: order.items.length,
        total: order.subtotal,
      });
      
      // Save order to Firestore FIRST
      const createdOrderId = await orderService.createOrder(order, user.id);

      const whatsappOrder = {
        ...order,
        id: createdOrderId,
        status: 'pending' as const,
        customerId: user.id,
      };
      
      // Then open WhatsApp with order
      await whatsappService.openWhatsAppOrder(whatsappOrder);
      
      // Track WhatsApp click
      if (shopId) {
        await shopService.incrementShopStat(shopId, 'whatsappClicks');
      }
      
      // Success feedback
      Alert.alert(
        'آرڈر بھیج دیا گیا! ✅',
        'دکاندار کو آپ کا آرڈر واٹس ایپ پر مل گیا ہے',
        [
          {
            text: 'ٹھیک ہے',
            onPress: () => {
              // Clear cart after successful order
              clearCart();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Send order error:', err);
      const errorMessage = err.message || 'آرڈر بھیجنے میں خرابی';
      setError(errorMessage);
      Alert.alert('خرابی', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    // Cart state
    items,
    shopId,
    shopName,
    shopWhatsapp,
    note,
    
    // Computed
    totalItems,
    totalPrice,
    isEmpty,
    
    // Actions
    addToCart,
    removeItem,
    updateQuantity,
    setNote,
    clearCart,
    sendOrderViaWhatsApp,
    
    // State
    isLoading,
    error,
  };
}

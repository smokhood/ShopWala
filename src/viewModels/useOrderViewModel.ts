/**
 * Order ViewModel - Business logic for order builder
 */
import type { CartItem } from '@models/Order';
import type { ProductWithShop } from '@models/Product';
import * as shopService from '@services/shopService';
import * as whatsappService from '@services/whatsappService';
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
    message += 'Mera Order (DukandaR se):\n';
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
    
    message += '\n📱 DukandaR App se bheja gaya';
    
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
      
      // Build order object
      const order = {
        id: Date.now().toString(),
        items,
        shopId,
        shopName,
        shopWhatsapp,
        subtotal: totalPrice,
        note,
        createdAt: new Date(),
      };
      
      // Open WhatsApp with order
      await whatsappService.openWhatsAppOrder(order);
      
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

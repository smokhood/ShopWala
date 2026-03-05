/**
 * Cart Store - Shopping cart state management
 * Uses Zustand with AsyncStorage persistence
 */
import type { CartItem } from '@models/Order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  shopId: string | null;
  shopName: string;
  shopWhatsapp: string;
  note: string;
}

interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  setNote: (note: string) => void;
  clearCart: () => void;
  setShop: (shopId: string, shopName: string, shopWhatsapp: string) => void;
}

type CartStore = CartState & CartActions;

const initialState: CartState = {
  items: [],
  shopId: null,
  shopName: '',
  shopWhatsapp: '',
  note: '',
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Add item to cart or increment quantity if exists
       * If different shop, clear cart first
       */
      addItem: (item: CartItem) => {
        const currentShopId = get().shopId;

        // If different shop, clear cart first
        if (currentShopId && currentShopId !== item.shopId) {
          set({
            items: [item],
            shopId: item.shopId,
            shopName: item.shopName,
            shopWhatsapp: item.shopWhatsapp,
            note: '',
          });
          return;
        }

        // Same shop or first item
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.productId === item.productId
        );

        if (existingIndex >= 0) {
          // Increment quantity
          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + 1,
          };
          set({ items: updatedItems });
        } else {
          // Add new item
          set({
            items: [...currentItems, item],
            shopId: item.shopId,
            shopName: item.shopName,
            shopWhatsapp: item.shopWhatsapp,
          });
        }
      },

      /**
       * Remove item from cart
       */
      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      /**
       * Update item quantity
       * If qty <= 0, remove item
       */
      updateQuantity: (productId: string, qty: number) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity: qty } : item
          ),
        }));
      },

      /**
       * Set order note
       */
      setNote: (note: string) => {
        set({ note });
      },

      /**
       * Clear cart completely
       */
      clearCart: () => {
        set(initialState);
      },

      /**
       * Set shop details (used when switching shops)
       */
      setShop: (shopId: string, shopName: string, shopWhatsapp: string) => {
        set({ shopId, shopName, shopWhatsapp });
      },
    }),
    {
      name: 'dukandar-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Selector: Check if product is in cart
 */
export const useIsInCart = (productId: string): boolean => {
  return useCartStore((state) =>
    state.items.some((item) => item.productId === productId)
  );
};

/**
 * Selector: Get total items count
 */
export const useTotalItems = (): number => {
  return useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
};

/**
 * Selector: Get total price
 */
export const useTotalPrice = (): number => {
  return useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
};

/**
 * Selector: Check if cart is empty
 */
export const useIsCartEmpty = (): boolean => {
  return useCartStore((state) => state.items.length === 0);
};

/**
 * useCatalogViewModel
 * Business logic for owner's catalog management
 * Handles: Template filtering, item selection, bulk product submission
 */

import type { TemplateItem } from '@models/Product';
import type { Shop } from '@models/Shop';
import { createDeal } from '@services/dealService';
import { bulkAddProducts } from '@services/productService';
import { useMutation } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface CatalogSelection {
  templateItems: TemplateItem[];
  customizedItems: Record<string, Partial<TemplateItem>>;
}

interface BulkProductPayload {
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
}

const bulkProductSchema = z.object({
  name: z.string().min(2, 'Product name required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().nonnegative('Stock cannot be negative'),
  unit: z.string().min(1, 'Unit required'),
  category: z.string().min(1, 'Category required'),
});

export function useCatalogViewModel(shop: Shop | null) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem[]>([]);
  const [customizations, setCustomizations] = useState<Record<string, Partial<TemplateItem>>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter template items by search or category
  const filteredItems = useCallback(
    (items: TemplateItem[]): TemplateItem[] => {
      return items.filter((item) => {
        const matchesSearch =
          searchQuery === '' ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.nameUrdu.includes(searchQuery);

        const matchesCategory =
          selectedCategory === null || item.category === selectedCategory;

        return matchesSearch && matchesCategory;
      });
    },
    [searchQuery, selectedCategory]
  );

  // Toggle item selection
  const toggleItemSelection = useCallback(
    (item: TemplateItem) => {
      setSelectedTemplate((prev) =>
        prev.some((i) => i.id === item.id)
          ? prev.filter((i) => i.id !== item.id)
          : [...prev, item]
      );
    },
    []
  );

  // Update single item customization (price, stock, etc.)
  const customizeItem = useCallback(
    (itemId: string, updates: Partial<TemplateItem>) => {
      setCustomizations((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], ...updates },
      }));
    },
    []
  );

  // Get final version of item (customized or template)
  const getFinalItem = useCallback(
    (item: TemplateItem): TemplateItem => {
      const customization = customizations[item.id];
      return customization
        ? {
            ...item,
            ...customization,
            id: item.id, // Preserve ID
          }
        : item;
    },
    [customizations]
  );

  // Bulk submit selected items as products
  const mutation = useMutation({
    mutationFn: async (items: TemplateItem[]) => {
      if (!shop) throw new Error('Shop not found');

      const products = items.map((item) => {
        const finalItem = getFinalItem(item);
        return {
          name: finalItem.name,
          nameUrdu: finalItem.nameUrdu,
          description: '',
          descriptionUrdu: '',
          price: finalItem.suggestedPrice,
          unit: finalItem.unit,
          category: finalItem.category,
          stock: 10, // Default stock for template items
          shopId: shop.id,
          images: [],
          isActive: true,
        };
      });

      const productsToSubmit = products.map((p) => ({
        name: p.name,
        nameUrdu: p.nameUrdu || p.name,
        description: 'Product from template',
        descriptionUrdu: 'سانچہ سے پروڈکٹ',
        price: p.price,
        unit: p.unit,
        category: p.category,
        inStock: true,
        stockStatus: 'in_stock' as const,
        stockVerifiedAt: Timestamp.now(),
        isActive: true,
        images: [] as string[],
      }));

      await bulkAddProducts(shop.id, productsToSubmit);
      return items.length;
    },
    onSuccess: () => {
      // Clear selections after successful submit
      setSelectedTemplate([]);
      setCustomizations({});
    },
  });

  // Get selected items with customizations applied
  const getSelectedItemsWithCustomizations = useCallback((): TemplateItem[] => {
    return selectedTemplate.map(getFinalItem);
  }, [selectedTemplate, getFinalItem]);

  // Get total price of selected items
  const getTotalValue = useCallback((): number => {
    return getSelectedItemsWithCustomizations().reduce(
      (sum, item) => sum + item.suggestedPrice,
      0
    );
  }, [getSelectedItemsWithCustomizations]);

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedTemplate([]);
    setCustomizations({});
    setSearchQuery('');
    setSelectedCategory(null);
  }, []);

  // Create bulk deal from selected items
  const submitBulkDeal = useCallback(
    async (dealDiscount: number, dealTitle: string) => {
      if (!shop) throw new Error('Shop not found');

      const items = getSelectedItemsWithCustomizations();
      const dealEndDate = new Date();
      dealEndDate.setDate(dealEndDate.getDate() + 1); // Deal expires tomorrow

      for (const item of items) {
        const discountedPrice = Math.round(
          item.suggestedPrice * (1 - dealDiscount / 100)
        );

        await createDeal(shop.id, {
          shopId: shop.id,
          shopName: shop.name,
          productId: null,
          productName: item.name,
          originalPrice: item.suggestedPrice,
          dealPrice: discountedPrice,
          note: dealTitle,
          expiresAt: dealEndDate.toISOString() as any,
          isActive: true,
        });
      }

      clearSelections();
    },
    [shop, getSelectedItemsWithCustomizations, clearSelections]
  );

  return {
    // State
    selectedTemplate,
    customizations,
    searchQuery,
    selectedCategory,

    // Template management
    filteredItems,
    toggleItemSelection,
    customizeItem,
    getFinalItem,
    getSelectedItemsWithCustomizations,

    // Selection operations
    getTotalValue,
    clearSelections,

    // Mutations
    submitBulkProducts: mutation.mutate,
    submitBulkProductsAsync: mutation.mutateAsync,
    isSubmittingProducts: mutation.isPending,
    productSubmissionError: mutation.error,

    // Bulk deals
    submitBulkDeal,

    // Filters
    setSearchQuery,
    setSelectedCategory,
  };
}

/**
 * Shop Detail ViewModel - Business logic for shop detail page
 */
import type { Deal } from '@models/Deal';
import type { Product } from '@models/Product';
import type { Shop } from '@models/Shop';
import * as dealService from '@services/dealService';
import * as productService from '@services/productService';
import * as shopService from '@services/shopService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isShopOpen } from '@utils/formatters';
import { useEffect, useMemo, useState } from 'react';

interface UseShopViewModelParams {
  shopId: string;
}

interface UseShopViewModelReturn {
  // Data
  shop: Shop | null | undefined;
  products: Product[];
  deals: Deal[];
  groupedProducts: Record<string, Product[]>;
  categoryList: string[];
  filteredProducts: Product[];
  isCurrentlyOpen: boolean;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  rateShop: (rating: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  flagProduct: (productId: string) => Promise<void>;
  searchInShop: (query: string) => void;
  incrementView: () => void;

  // Search state
  searchQuery: string;
}

export function useShopViewModel({
  shopId,
}: UseShopViewModelParams): UseShopViewModelReturn {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch shop data
  const {
    data: shop,
    isLoading: isShopLoading,
    error: shopError,
  } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => shopService.getShopById(shopId),
    enabled: !!shopId,
  });

  // Fetch products
  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => productService.getProductsByShop(shopId),
    enabled: !!shopId,
  });

  // Fetch deals
  const {
    data: deals = [],
    isLoading: isDealsLoading,
    error: dealsError,
  } = useQuery({
    queryKey: ['deals', shopId],
    queryFn: () => dealService.getActiveDeals(shopId),
    enabled: !!shopId,
  });

  // Increment view count once on mount
  useEffect(() => {
    if (shopId) {
      shopService.incrementShopStat(shopId, 'todayViews');
    }
  }, [shopId]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const grouped: Record<string, Product[]> = {};

    products.forEach((product) => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });

    return grouped;
  }, [products]);

  // Get category list sorted by product count (most first)
  const categoryList = useMemo(() => {
    return Object.keys(groupedProducts).sort(
      (a, b) => groupedProducts[b].length - groupedProducts[a].length
    );
  }, [groupedProducts]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.nameUrdu?.includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Check if shop is currently open
  const isCurrentlyOpen = useMemo(() => {
    if (!shop) return false;
    return isShopOpen(shop.hours, shop.isOpen);
  }, [shop]);

  // Rate shop mutation
  const rateShopMutation = useMutation({
    mutationFn: (rating: number) => shopService.rateShop(shopId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });

  // Flag product out of stock mutation
  const flagProductMutation = useMutation({
    mutationFn: (productId: string) =>
      productService.flagProductOutOfStock(productId, shopId, 'customer'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
    },
  });

  // Rate shop action
  const rateShop = async (rating: 1 | 2 | 3 | 4 | 5): Promise<void> => {
    try {
      await rateShopMutation.mutateAsync(rating);
    } catch (error) {
      console.error('Rate shop error:', error);
      throw error;
    }
  };

  // Flag product action
  const flagProduct = async (productId: string): Promise<void> => {
    try {
      await flagProductMutation.mutateAsync(productId);
    } catch (error) {
      console.error('Flag product error:', error);
      throw error;
    }
  };

  // Search in shop
  const searchInShop = (query: string): void => {
    setSearchQuery(query);
  };

  // Increment view (called once on mount)
  const incrementView = (): void => {
    if (shopId) {
      shopService.incrementShopStat(shopId, 'todayViews');
    }
  };

  const isLoading = isShopLoading || isProductsLoading || isDealsLoading;
  const error =
    shopError?.message || productsError?.message || dealsError?.message || null;

  return {
    // Data
    shop,
    products,
    deals,
    groupedProducts,
    categoryList,
    filteredProducts,
    isCurrentlyOpen,

    // State
    isLoading,
    error,

    // Actions
    rateShop,
    flagProduct,
    searchInShop,
    incrementView,

    // Search state
    searchQuery,
  };
}

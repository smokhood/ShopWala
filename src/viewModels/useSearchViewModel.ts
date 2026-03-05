/**
 * Search ViewModel - Business logic for product search
 */
import type { ProductWithShop } from '@models/Product';
import type { Shop } from '@models/Shop';
import {
    getRecentSearches as getRecentSearchesFromDB,
    removeRecentSearch as removeRecentSearchFromDB,
    upsertRecentSearch,
} from '@services/offlineService';
import { searchProductsNearby } from '@services/productService';
import * as shopService from '@services/shopService';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocationStore } from '../store/locationStore';

type FilterType = 'nearest' | 'cheapest' | 'best_rated';

interface ShopWithProducts extends Shop {
  products: ProductWithShop[];
  matchedCount: number;
  distanceKm?: number;
}

const MAX_RECENT_SEARCHES = 5;

const TRENDING_SEARCHES = [
  'Lux Soap',
  'Atta 10kg',
  'Panadol',
  'Eggs',
  'Doodh',
  'Dettol',
  'Surf Excel',
  'Cooking Oil',
  'Sugar',
  'Chawal',
];

export function useSearchViewModel() {
  const { location, radius } = useLocationStore();

  const [query, setQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithShop[]>([]);
  const [groupedByShop, setGroupedByShop] = useState<ShopWithProducts[]>([]);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('nearest');
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  /**
   * Load recent searches from SQLite cache
   */
  const loadRecentSearches = () => {
    const searches = getRecentSearchesFromDB(MAX_RECENT_SEARCHES);
    setRecentSearches(searches);
  };

  /**
   * Set query with debounce for auto-search
   */
  const setQuery = (text: string) => {
    setQueryState(text);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Auto-search if >= 2 chars
    if (text.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        search(text);
      }, 400);
    } else if (text.trim().length === 0) {
      clearSearch();
    }
  };

  /**
   * Perform product search
   */
  const search = async (searchQuery?: string): Promise<void> => {
    const queryToSearch = searchQuery || query;
    
    if (!queryToSearch.trim() || !location) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      const results = await searchProductsNearby(
        queryToSearch.trim(),
        location.lat,
        location.lng,
        radius
      );

      // Filter by open status if enabled
      let filteredResults = results;
      if (showOpenOnly) {
        filteredResults = results.filter((p) => p.shop?.isOpen);
      }

      setSearchResults(filteredResults);
      
      // Group by shop
      groupResultsByShop(filteredResults);

      // Sort by active filter
      sortResults(activeFilter, filteredResults);

      // Add to recent searches
      addRecentSearch(queryToSearch);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'تلاش میں خرابی');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Group search results by shop
   */
  const groupResultsByShop = (results: ProductWithShop[]) => {
    const shopMap = new Map<string, ShopWithProducts>();

    results.forEach((product) => {
      const shopId = product.shopId;
      if (!shopMap.has(shopId)) {
        shopMap.set(shopId, {
          ...product.shop!,
          products: [],
          matchedCount: 0,
          distanceKm: product.shop?.distanceKm,
        });
      }

      const shop = shopMap.get(shopId)!;
      shop.products.push(product);
      shop.matchedCount++;
    });

    setGroupedByShop(Array.from(shopMap.values()));
  };

  /**
   * Sort results by filter type
   */
  const sortResults = (filter: FilterType, results?: ProductWithShop[]) => {
    const resultsToSort = results || searchResults;
    let sorted = [...resultsToSort];

    switch (filter) {
      case 'nearest':
        sorted.sort((a, b) => (a.shop?.distanceKm || 0) - (b.shop?.distanceKm || 0));
        break;
      case 'cheapest':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'best_rated':
        sorted.sort((a, b) => (b.shop?.rating || 0) - (a.shop?.rating || 0));
        break;
    }

    setSearchResults(sorted);
    setActiveFilter(filter);
  };

  /**
   * Add to recent searches
   */
  const addRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    let updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)];
    updated = updated.slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    upsertRecentSearch(trimmed, MAX_RECENT_SEARCHES);
  };

  /**
   * Remove from recent searches
   */
  const removeRecentSearch = (searchQuery: string) => {
    const updated = recentSearches.filter((s) => s !== searchQuery);
    setRecentSearches(updated);
    removeRecentSearchFromDB(searchQuery);
  };

  /**
   * Clear search state
   */
  const clearSearch = () => {
    setQueryState('');
    setSearchResults([]);
    setGroupedByShop([]);
    setHasSearched(false);
    setError(null);
  };

  /**
   * Toggle show open only filter
   */
  const toggleShowOpenOnly = () => {
    setShowOpenOnly(!showOpenOnly);
    
    // Re-filter results
    if (hasSearched) {
      search();
    }
  };

  /**
   * Get nearby shops (no product filter)
   */
  const fetchShopsNearby = useCallback(async (): Promise<void> => {
    if (!location) return;

    try {
      setIsLoading(true);
      setError(null);

      const shops = await shopService.getShopsNearby(location.lat, location.lng, radius);
      setNearbyShops(shops);
    } catch (err: any) {
      console.error('Get shops nearby error:', err);
      setError(err.message || 'دکانیں لوڈ کرنے میں خرابی');
    } finally {
      setIsLoading(false);
    }
  }, [location, radius]);

  // Load nearby shops when location changes
  useEffect(() => {
    if (location && !hasSearched) {
      fetchShopsNearby();
    }
  }, [location, radius, hasSearched, fetchShopsNearby]);

  return {
    // State
    query,
    searchResults,
    groupedByShop,
    nearbyShops,
    isLoading,
    error,
    hasSearched,
    recentSearches,
    trendingSearches: TRENDING_SEARCHES,
    activeFilter,
    showOpenOnly,

    // Functions
    setQuery,
    search,
    sortResults,
    clearSearch,
    removeRecentSearch,
    toggleShowOpenOnly,
    refreshShops: fetchShopsNearby,
  };
}

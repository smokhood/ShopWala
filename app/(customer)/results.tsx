import { Ionicons } from '@expo/vector-icons';
import type { CartItem, Order } from '@models/Order';
import type { ProductWithShop } from '@models/Product';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { flagProductOutOfStock } from '@services/productService';
import { openWhatsAppOrder } from '@services/whatsappService';
import { FlashList } from '@shopify/flash-list';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingFooter } from '../../src/components/LoadingFooter';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { ProductItem } from '../../src/components/ProductItem';
import { SearchBar } from '../../src/components/SearchBar';
import { ShopCard } from '../../src/components/ShopCard';
import { ProductItemSkeleton } from '../../src/components/SkeletonLoader';
import { useLanguage } from '../../src/hooks/useLanguage';
import { usePaginatedSearchResults } from '../../src/hooks/usePaginatedSearchResults';
import { useAuthStore } from '../../src/store/authStore';
import { useLocationViewModel } from '../../src/viewModels/useLocationViewModel';
import { useSearchViewModel } from '../../src/viewModels/useSearchViewModel';

type ViewMode = 'product' | 'shop';
type SortType = 'nearest' | 'cheapest' | 'best_rated';

type GroupedShop = {
  id: string;
  name: string;
  category: string;
  photoUrl: string | null;
  rating: number;
  isOpen: boolean;
  hours: { closeTime: string };
  products: ProductWithShop[];
  matchedCount: number;
  distanceKm?: number;
};

type MultiSearchShop = GroupedShop & {
  hasAllItems: boolean;
  totalItems: number;
  availableItems: number;
  missingItems: string[];
  estimatedTotal: number;
};

type ProductListItem =
  | { type: 'shop'; key: string; shop: GroupedShop }
  | { type: 'product'; key: string; product: ProductWithShop };

const CACHE_KEY = 'dukandar-results-cache';

export default function ResultsScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { query: queryParam, fromMultiSearch } = useLocalSearchParams<{
    query?: string;
    fromMultiSearch?: string;
  }>();

  const initialQuery = (queryParam || '').toString().trim();
  const isMultiSearch = fromMultiSearch === 'true';

  const { location, radius, updateRadius } = useLocationViewModel();
  const { user } = useAuthStore();

  const {
    query,
    setQuery,
    search,
    searchResults,
    isLoading,
    error,
    sortResults,
    activeFilter,
    showOpenOnly,
    toggleShowOpenOnly,
    clearSearch,
  } = useSearchViewModel();

  const [viewMode, setViewMode] = useState<ViewMode>('product');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, ProductWithShop>>(new Map());
  const [isOffline, setIsOffline] = useState(false);
  const [cachedResults, setCachedResults] = useState<ProductWithShop[]>([]);
  const [isFlagging, setIsFlagging] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery) {
      search(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(!!offline);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const persistCache = async () => {
      if (!query || searchResults.length === 0) {
        return;
      }

      const payload = {
        query,
        results: searchResults,
        updatedAt: Date.now(),
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    };

    persistCache();
  }, [query, searchResults]);

  useEffect(() => {
    const loadCache = async () => {
      if (!isOffline) {
        return;
      }

      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) {
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        if (parsed?.query === query && Array.isArray(parsed?.results)) {
          setCachedResults(parsed.results as ProductWithShop[]);
        }
      } catch (cacheError) {
        console.error('Cache parse error:', cacheError);
      }
    };

    loadCache();
  }, [isOffline, query]);

  const {
    products: paginatedProducts,
    isLoading: isPaginatedLoading,
    fetchNextPage: fetchNextProductsPage,
    hasNextPage: hasNextProductsPage,
    isFetchingNextPage: isFetchingNextProductsPage,
  } = usePaginatedSearchResults({
    query: query.trim(),
    lat: location?.lat || 0,
    lng: location?.lng || 0,
    radiusKm: radius,
    pageSize: 15,
    enabled: !!query.trim() && !!location && !isOffline,
  });

  const shouldUsePaginated = !!query.trim() && !!location && !isOffline;
  const baseResults = shouldUsePaginated
    ? paginatedProducts
    : (searchResults.length > 0 ? searchResults : cachedResults);

  const displayedResults = useMemo(() => {
    const results = [...baseResults];

    const filtered = showOpenOnly
      ? results.filter((p) => p.shop?.isCurrentlyOpen ?? p.shop?.isOpen)
      : results;

    switch (activeFilter) {
      case 'cheapest':
        return filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'best_rated':
        return filtered.sort((a, b) => (b.shop?.rating || 0) - (a.shop?.rating || 0));
      case 'nearest':
      default:
        return filtered.sort((a, b) => (a.shop?.distanceKm || 0) - (b.shop?.distanceKm || 0));
    }
  }, [baseResults, showOpenOnly, activeFilter]);

  const displayedGrouped = useMemo<GroupedShop[]>(() => {
    const shopMap = new Map<string, GroupedShop>();

    displayedResults.forEach((product) => {
      if (!shopMap.has(product.shopId)) {
        shopMap.set(product.shopId, {
          id: product.shopId,
          name: product.shop?.name || 'Unknown',
          category: product.shop?.category || 'other',
          photoUrl: (product.shop as any)?.photoUrl || null,
          rating: product.shop?.rating || 0,
          isOpen: product.shop?.isOpen ?? true,
          hours: product.shop?.hours || { closeTime: '' },
          products: [],
          matchedCount: 0,
          distanceKm: product.shop?.distanceKm,
        });
      }

      const shop = shopMap.get(product.shopId)!;
      shop.products.push(product);
      shop.matchedCount += 1;
    });

    return Array.from(shopMap.values());
  }, [displayedResults]);

  const parsedQueryItems = useMemo(() => {
    if (!isMultiSearch) {
      return [query].filter(Boolean);
    }
    return query
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [query, isMultiSearch]);

  const productListData = useMemo<ProductListItem[]>(() => {
    const items: ProductListItem[] = [];

    displayedGrouped.forEach((shop) => {
      items.push({ type: 'shop', key: `shop-${shop.id}`, shop });
      shop.products.forEach((product) => {
        items.push({ type: 'product', key: `product-${product.id}-${shop.id}`, product });
      });
    });

    return items;
  }, [displayedGrouped]);

  const shopsForMultiSearch = useMemo<MultiSearchShop[]>(() => {
    if (!isMultiSearch) {
      return displayedGrouped.map((shop) => ({
        ...shop,
        hasAllItems: true,
        totalItems: 1,
        availableItems: shop.matchedCount,
        missingItems: [],
        estimatedTotal: shop.products.reduce((sum, product) => sum + product.price, 0),
      }));
    }

    const mapped = displayedGrouped.map((shop) => {
      const queryItemsLower = parsedQueryItems.map((q) => q.toLowerCase());

      const matchedByItem = queryItemsLower.filter((needle) =>
        shop.products.some((p) => p.name.toLowerCase().includes(needle))
      );

      const missing = queryItemsLower
        .filter((needle) => !matchedByItem.includes(needle))
        .map((needle) => parsedQueryItems[queryItemsLower.indexOf(needle)] || needle);

      const estimatedTotal = shop.products
        .filter((p) => matchedByItem.some((needle) => p.name.toLowerCase().includes(needle)))
        .reduce((sum, p) => sum + p.price, 0);

      return {
        ...shop,
        hasAllItems: missing.length === 0,
        totalItems: parsedQueryItems.length,
        availableItems: matchedByItem.length,
        missingItems: missing,
        estimatedTotal,
      } as MultiSearchShop;
    });

    return mapped.sort((a, b) => {
      if (a.hasAllItems && !b.hasAllItems) return -1;
      if (!a.hasAllItems && b.hasAllItems) return 1;
      return a.estimatedTotal - b.estimatedTotal;
    });
  }, [displayedGrouped, parsedQueryItems, isMultiSearch]);

  const selectedProducts = useMemo(() => Array.from(selectedItems.values()), [selectedItems]);

  const selectedShopId = selectedProducts.length > 0 ? selectedProducts[0].shopId : null;
  const selectedSubtotal = selectedProducts.reduce((sum, product) => sum + product.price, 0);

  const handleAddToOrder = useCallback((product: ProductWithShop) => {
    if (selectedShopId && selectedShopId !== product.shopId) {
      Alert.alert(
        t('customer.different_shop'),
        t('customer.one_shop_at_a_time')
      );
      return;
    }

    setSelectedItems((previous) => {
      const updated = new Map(previous);
      updated.set(product.id, product);
      return updated;
    });
  }, [selectedShopId, t]);

  const handleRemoveFromOrder = useCallback((productId: string) => {
    setSelectedItems((previous) => {
      const updated = new Map(previous);
      updated.delete(productId);
      return updated;
    });
  }, []);

  const handleSendWhatsAppOrder = async () => {
    if (selectedProducts.length === 0) {
      return;
    }

    const firstProduct = selectedProducts[0];
    const items: CartItem[] = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      productNameUrdu: product.nameUrdu,
      price: product.price,
      quantity: 1,
      unit: product.unit,
      shopId: product.shopId,
      shopName: product.shop.name,
      shopWhatsapp: product.shop.whatsapp,
    }));

    const order: Order = {
      id: `temp-${Date.now()}`,
      items,
      shopId: firstProduct.shopId,
      shopName: firstProduct.shop.name,
      shopWhatsapp: firstProduct.shop.whatsapp,
      subtotal: selectedSubtotal,
      note: null,
      createdAt: new Date(),
    };

    try {
      await openWhatsAppOrder(order);
    } catch (whatsappError: any) {
      Alert.alert(t('customer.error'), whatsappError?.message || t('customer.whatsapp_open_failed'));
    }
  };

  const handleShopPress = (shopId: string) => {
    router.push(`/(customer)/shop/${shopId}` as any);
  };

  const handleShopWhatsApp = async (shop: any) => {
    try {
      const phone = String(shop?.whatsapp || '').replace(/[+\s]/g, '');
      if (!phone) {
        Alert.alert(t('customer.error'), t('customer.whatsapp_not_available'));
        return;
      }

      const message = encodeURIComponent(
        `${t('customer.whatsapp_greeting')} ${shop.name} ${t('customer.from_dukandar_app')}`
      );
      const nativeUrl = `whatsapp://send?phone=${phone}&text=${message}`;
      const webUrl = `https://wa.me/${phone}?text=${message}`;

      const canOpenNative = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(canOpenNative ? nativeUrl : webUrl);
    } catch (error) {
      Alert.alert(t('customer.error'), t('customer.whatsapp_open_failed'));
    }
  };

  const handleFlagStock = async (productId: string, shopId: string) => {
    if (!user?.id) {
      Alert.alert(t('customer.error'), t('customer.please_login_first'));
      return;
    }

    const flagKey = `${productId}-${shopId}`;
    if (isFlagging === flagKey) return;

    setIsFlagging(flagKey);
    try {
      await flagProductOutOfStock(shopId, productId, user.id);
      Alert.alert(t('customer.thank_you'), t('customer.stock_report_saved'));
    } catch (flagError: any) {
      Alert.alert(t('customer.error'), flagError?.message || t('customer.report_save_failed'));
    } finally {
      setIsFlagging(null);
    }
  };

  const handleDistancePress = () => {
    if (Platform.OS !== 'android') {
      Alert.alert(t('customer.select_distance'), t('customer.select_search_range'), [
        { text: '1 km', onPress: () => updateRadius(1) },
        { text: '2 km', onPress: () => updateRadius(2) },
        { text: '5 km', onPress: () => updateRadius(5) },
        { text: '10 km', onPress: () => updateRadius(10) },
        { text: '20 km', onPress: () => updateRadius(20) },
        { text: '30 km', onPress: () => updateRadius(30) },
        { text: '50 km', onPress: () => updateRadius(50) },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
      return;
    }

    Alert.alert(t('customer.select_distance'), t('customer.select_search_range'), [
      {
        text: '1-5 km',
        onPress: () =>
          Alert.alert(t('customer.select_distance'), '', [
            { text: '1 km', onPress: () => updateRadius(1) },
            { text: '2 km', onPress: () => updateRadius(2) },
            { text: '5 km', onPress: () => updateRadius(5) },
          ]),
      },
      {
        text: '10-50 km',
        onPress: () =>
          Alert.alert(t('customer.select_distance'), '', [
            { text: '10 km', onPress: () => updateRadius(10) },
            { text: '20 km', onPress: () => updateRadius(20) },
            { text: '50 km', onPress: () => updateRadius(50) },
          ]),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleRetry = () => {
    if (query.trim()) {
      search(query.trim());
    }
  };

  const renderSortPill = (value: SortType, label: string) => {
    const selected = activeFilter === value;
    return (
      <Pressable
        key={value}
        onPress={() => sortResults(value)}
        className={`rounded-full px-4 py-2 mr-2 border ${
          selected ? 'bg-primary border-primary' : 'bg-white border-gray-300'
        }`}
      >
        <Text className={`${selected ? 'text-white' : 'text-gray-700'} text-sm font-medium`}>
          {label}{selected ? ' ✓' : ''}
        </Text>
      </Pressable>
    );
  };

  const shouldShowLoading =
    isLoading || (shouldUsePaginated && isPaginatedLoading && paginatedProducts.length === 0);

  return (
    <View className="flex-1 bg-gray-50">
      <OfflineBanner />

      <View className="bg-white px-4 pt-12 pb-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3 p-2 -ml-2">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>

          <View className="flex-1">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              onSubmit={(text) => search(text.trim())}
              onClear={clearSearch}
              placeholder={t('customer.what_are_you_looking_for')}
            />
          </View>

          <Pressable onPress={() => setShowFilterSheet(true)} className="ml-3 p-2">
            <Ionicons name="options-outline" size={22} color="#111827" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        className="max-h-[58px]"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
      >
        {renderSortPill('nearest', t('customer.nearest'))}
        {renderSortPill('cheapest', t('customer.cheapest_nearby'))}
        {renderSortPill('best_rated', t('customer.best_rated'))}

        <Pressable
          onPress={toggleShowOpenOnly}
          className={`rounded-full px-4 py-2 mr-2 border ${
            showOpenOnly ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={`${showOpenOnly ? 'text-white' : 'text-gray-700'} text-sm font-medium`}>
            {t('customer.open_now_only')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDistancePress}
          className="rounded-full px-4 py-2 mr-2 border border-gray-300 bg-white"
        >
          <Text className="text-gray-700 text-sm font-medium">{radius} km ▼</Text>
        </Pressable>
      </ScrollView>

      <View className="px-4 pb-2">
        <View className="bg-white rounded-xl p-1 flex-row">
          <Pressable
            onPress={() => setViewMode('product')}
            className={`flex-1 rounded-lg py-2 items-center ${
              viewMode === 'product' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text className={`${viewMode === 'product' ? 'text-white' : 'text-gray-700'} font-medium`}>
              {t('customer.view_mode_products')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('shop')}
            className={`flex-1 rounded-lg py-2 items-center ${
              viewMode === 'shop' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text className={`${viewMode === 'shop' ? 'text-white' : 'text-gray-700'} font-medium`}>
              {t('customer.view_mode_shops')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="px-4 pb-2">
        <Text className="text-sm text-gray-700">
          {t('customer.found_in_shops', {
            count: displayedGrouped.length,
            query: query || initialQuery,
          })}
        </Text>
      </View>

      {shouldShowLoading ? (
        <View className="px-4">
          <ProductItemSkeleton />
          <ProductItemSkeleton />
          <ProductItemSkeleton />
          <ProductItemSkeleton />
          <ProductItemSkeleton />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 text-center mb-4">{error}</Text>
          <Pressable onPress={handleRetry} className="bg-primary rounded-xl px-5 py-3">
            <Text className="text-white font-semibold">{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : displayedResults.length === 0 && isOffline ? (
        <EmptyState variant="offline" />
      ) : displayedResults.length === 0 ? (
        <EmptyState variant="no_results" />
      ) : viewMode === 'product' ? (
        <FlashList
          data={productListData}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            if (item.type === 'shop') {
              return (
                <View className="mt-2 mb-1">
                  <ShopCard
                    variant="compact"
                    shop={{
                      ...(item.shop as any),
                      distance: item.shop.distanceKm,
                    }}
                    onPress={() => handleShopPress(item.shop.id)}
                    onWhatsAppPress={() => handleShopWhatsApp(item.shop)}
                  />
                </View>
              );
            }

            return (
              <ProductItem
                product={item.product}
                onAddToOrder={handleAddToOrder}
                onShopPress={handleShopPress}
                onFlagStock={handleFlagStock}
                isInCart={selectedItems.has(item.product.id)}
              />
            );
          }}
          onEndReached={() => {
            if (hasNextProductsPage && !isFetchingNextProductsPage) {
              fetchNextProductsPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <LoadingFooter
              isLoading={isFetchingNextProductsPage}
              text={language === 'ur' ? 'مزید پروڈکٹس لوڈ ہو رہی ہیں...' : 'Loading more products...'}
            />
          }
        />
      ) : (
        <FlashList
          data={shopsForMultiSearch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const totalItems = isMultiSearch ? item.totalItems : 1;
            const availableItems = isMultiSearch ? item.availableItems : item.matchedCount;
            const missingItems = isMultiSearch
              ? item.missingItems
              : parsedQueryItems.filter(
                  (token) =>
                    !item.products.some((p) =>
                      p.name.toLowerCase().includes(token.toLowerCase())
                    )
                );

            return (
              <View className="mb-3">
                <ShopCard
                  shop={{ ...(item as any), distance: item.distanceKm }}
                  onPress={() => handleShopPress(item.id)}
                  onWhatsAppPress={() => handleShopWhatsApp(item)}
                />

                <View className="bg-white rounded-xl mt-2 p-3 border border-gray-100">
                  {isMultiSearch ? (
                    item.hasAllItems ? (
                      <Text className="text-green-700 font-semibold">
                        ✅ {t('customer.all_items_available', { availableItems })}
                      </Text>
                    ) : (
                      <Text className="text-orange-700 font-semibold">
                        ⚠️ {t('customer.items_available_ratio', { availableItems, totalItems })}
                      </Text>
                    )
                  ) : (
                    <Text className="text-gray-700 font-medium">
                      {t('customer.items_available_ratio', { availableItems, totalItems })}
                    </Text>
                  )}

                  <Text className="text-gray-700 mt-2">
                    {item.products
                      .slice(0, 3)
                      .map((p) => p.name)
                      .join(language === 'ur' ? '، ' : ', ')}
                    {item.products.length > 3
                      ? ` ${t('customer.and_more', {
                          count: item.products.length - 3,
                        })}`
                      : ''}
                  </Text>

                  {missingItems.length > 0 && (
                    <Text className="text-gray-400 line-through mt-1">
                      {missingItems.join(language === 'ur' ? '، ' : ', ')}
                    </Text>
                  )}

                  {isMultiSearch && (
                    <Text className="text-gray-900 font-semibold mt-2">
                      {t('customer.estimated_total', {
                        total: item.estimatedTotal,
                      })}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          onEndReached={() => {
            if (hasNextProductsPage && !isFetchingNextProductsPage) {
              fetchNextProductsPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <LoadingFooter
              isLoading={isFetchingNextProductsPage}
              text={language === 'ur' ? 'مزید نتائج لوڈ ہو رہے ہیں...' : 'Loading more results...'}
            />
          }
        />
      )}

      {showFilterSheet && (
        <Pressable
          onPress={() => setShowFilterSheet(false)}
          className="absolute inset-0 bg-black/30 justify-end"
        >
          <Pressable className="bg-white rounded-t-3xl p-5 pb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">{t('customer.filters')}</Text>

            <Text className="text-sm text-gray-600 mb-2">{t('common.sort')}</Text>
            <View className="flex-row flex-wrap mb-4">
              {renderSortPill('nearest', t('customer.nearest'))}
              {renderSortPill('cheapest', t('customer.cheapest_nearby'))}
              {renderSortPill('best_rated', t('customer.best_rated'))}
            </View>

            <Pressable
              onPress={toggleShowOpenOnly}
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-base text-gray-900">{t('customer.open_shops_only')}</Text>
              <Ionicons
                name={showOpenOnly ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={showOpenOnly ? '#16a34a' : '#9ca3af'}
              />
            </Pressable>

            <Pressable onPress={handleDistancePress} className="flex-row items-center justify-between py-3">
              <Text className="text-base text-gray-900">Distance</Text>
              <Text className="text-base text-gray-700">{radius} km</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowFilterSheet(false)}
              className="bg-primary rounded-xl py-3 mt-3"
            >
              <Text className="text-white text-center font-semibold">{t('customer.apply_filters')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {selectedProducts.length > 0 && (
        <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-700">
              {t('customer.selected_items_total', {
                count: selectedProducts.length,
                subtotal: selectedSubtotal,
              })}
            </Text>
            <Pressable
              onPress={() => {
                const last = selectedProducts[selectedProducts.length - 1];
                if (last) {
                  handleRemoveFromOrder(last.id);
                }
              }}
            >
              <Text className="text-sm text-red-600">{t('customer.remove_one')}</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleSendWhatsAppOrder}
            className="bg-green-600 rounded-xl py-3 flex-row items-center justify-center"
          >
            <Ionicons name="logo-whatsapp" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">{t('customer.send_whatsapp_order')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

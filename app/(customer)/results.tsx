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
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { ProductItem } from '../../src/components/ProductItem';
import { SearchBar } from '../../src/components/SearchBar';
import { ShopCard } from '../../src/components/ShopCard';
import { ProductItemSkeleton } from '../../src/components/SkeletonLoader';
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
  const router = useRouter();
  const { query: queryParam, fromMultiSearch } = useLocalSearchParams<{
    query?: string;
    fromMultiSearch?: string;
  }>();

  const initialQuery = (queryParam || '').toString().trim();
  const isMultiSearch = fromMultiSearch === 'true';

  const { radius, updateRadius } = useLocationViewModel();
  const { user } = useAuthStore();

  const {
    query,
    setQuery,
    search,
    searchResults,
    groupedByShop,
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

  const displayedResults = searchResults.length > 0 ? searchResults : cachedResults;
  const displayedGrouped = (groupedByShop as unknown as GroupedShop[]) || [];

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

  const handleAddToOrder = (product: ProductWithShop) => {
    if (selectedShopId && selectedShopId !== product.shopId) {
      Alert.alert(
        'الگ دکان',
        'ایک وقت میں صرف ایک دکان کا آرڈر بھیج سکتے ہیں۔ پہلے موجودہ آئٹمز ہٹائیں۔'
      );
      return;
    }

    setSelectedItems((previous) => {
      const updated = new Map(previous);
      updated.set(product.id, product);
      return updated;
    });
  };

  const handleRemoveFromOrder = (productId: string) => {
    setSelectedItems((previous) => {
      const updated = new Map(previous);
      updated.delete(productId);
      return updated;
    });
  };

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
      Alert.alert('خرابی', whatsappError?.message || 'WhatsApp نہیں کھل سکا');
    }
  };

  const handleShopPress = (shopId: string) => {
    router.push(`/(customer)/shop/${shopId}` as any);
  };

  const handleShopWhatsApp = async (shop: any) => {
    try {
      const phone = String(shop?.whatsapp || '').replace(/[+\s]/g, '');
      if (!phone) {
        Alert.alert('خرابی', 'WhatsApp نمبر دستیاب نہیں ہے');
        return;
      }

      const message = encodeURIComponent(
        `السلام علیکم! میں ${shop.name} سے رابطہ کرنا چاہتا/چاہتی ہوں۔\nDukandaR app سے`
      );
      const nativeUrl = `whatsapp://send?phone=${phone}&text=${message}`;
      const webUrl = `https://wa.me/${phone}?text=${message}`;

      const canOpenNative = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(canOpenNative ? nativeUrl : webUrl);
    } catch (error) {
      Alert.alert('خرابی', 'WhatsApp کھولنے میں ناکام');
    }
  };

  const handleFlagStock = async (productId: string, shopId: string) => {
    if (!user?.id) {
      Alert.alert('خرابی', 'پہلے لاگ اِن کریں');
      return;
    }

    const flagKey = `${productId}-${shopId}`;
    if (isFlagging === flagKey) return;

    setIsFlagging(flagKey);
    try {
      await flagProductOutOfStock(shopId, productId, user.id);
      Alert.alert('شکریہ', 'اسٹاک رپورٹ محفوظ ہو گئی');
    } catch (flagError: any) {
      Alert.alert('خرابی', flagError?.message || 'رپورٹ محفوظ نہیں ہو سکی');
    } finally {
      setIsFlagging(null);
    }
  };

  const handleDistancePress = () => {
    Alert.alert('فاصلہ منتخب کریں', 'سرچ رینج منتخب کریں', [
      { text: '1 km', onPress: () => updateRadius(1) },
      { text: '2 km', onPress: () => updateRadius(2) },
      { text: '5 km', onPress: () => updateRadius(5) },
      { text: '10 km', onPress: () => updateRadius(10) },
      { text: 'منسوخ', style: 'cancel' },
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
              placeholder="کیا ڈھونڈ رہے ہیں؟"
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
        {renderSortPill('nearest', 'قریب ترین')}
        {renderSortPill('cheapest', 'سستا')}
        {renderSortPill('best_rated', 'بہترین')}

        <Pressable
          onPress={toggleShowOpenOnly}
          className={`rounded-full px-4 py-2 mr-2 border ${
            showOpenOnly ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={`${showOpenOnly ? 'text-white' : 'text-gray-700'} text-sm font-medium`}>
            ابھی کھلا ●
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
              📦 پروڈکٹ
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('shop')}
            className={`flex-1 rounded-lg py-2 items-center ${
              viewMode === 'shop' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text className={`${viewMode === 'shop' ? 'text-white' : 'text-gray-700'} font-medium`}>
              🏪 دکان
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="px-4 pb-2">
        <Text className="text-sm text-gray-700">
          {displayedGrouped.length} دکانوں میں '{query || initialQuery}' ملا
        </Text>
      </View>

      {isLoading ? (
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
            <Text className="text-white font-semibold">دوبارہ کوشش کریں</Text>
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
                        ✅ تمام {availableItems} چیزیں موجود
                      </Text>
                    ) : (
                      <Text className="text-orange-700 font-semibold">
                        ⚠️ {availableItems}/{totalItems} چیزیں موجود
                      </Text>
                    )
                  ) : (
                    <Text className="text-gray-700 font-medium">
                      {availableItems}/{totalItems} items available
                    </Text>
                  )}

                  <Text className="text-gray-700 mt-2">
                    {item.products.slice(0, 3).map((p) => p.name).join('، ')}
                    {item.products.length > 3 ? ` اور ${item.products.length - 3} مزید` : ''}
                  </Text>

                  {missingItems.length > 0 && (
                    <Text className="text-gray-400 line-through mt-1">
                      {missingItems.join('، ')}
                    </Text>
                  )}

                  {isMultiSearch && (
                    <Text className="text-gray-900 font-semibold mt-2">
                      تخمینی کل: Rs. {item.estimatedTotal}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {showFilterSheet && (
        <Pressable
          onPress={() => setShowFilterSheet(false)}
          className="absolute inset-0 bg-black/30 justify-end"
        >
          <Pressable className="bg-white rounded-t-3xl p-5 pb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">فلٹرز</Text>

            <Text className="text-sm text-gray-600 mb-2">Sort</Text>
            <View className="flex-row flex-wrap mb-4">
              {renderSortPill('nearest', 'قریب ترین')}
              {renderSortPill('cheapest', 'سستا')}
              {renderSortPill('best_rated', 'بہترین')}
            </View>

            <Pressable
              onPress={toggleShowOpenOnly}
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-base text-gray-900">صرف کھلی دکانیں</Text>
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
              <Text className="text-white text-center font-semibold">لاگو کریں</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {selectedProducts.length > 0 && (
        <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-700">
              {selectedProducts.length} آئٹمز • Rs. {selectedSubtotal}
            </Text>
            <Pressable
              onPress={() => {
                const last = selectedProducts[selectedProducts.length - 1];
                if (last) {
                  handleRemoveFromOrder(last.id);
                }
              }}
            >
              <Text className="text-sm text-red-600">ایک کم کریں</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleSendWhatsAppOrder}
            className="bg-green-600 rounded-xl py-3 flex-row items-center justify-center"
          >
            <Ionicons name="logo-whatsapp" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">WhatsApp آرڈر بھیجیں</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

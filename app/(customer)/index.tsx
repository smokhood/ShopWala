/**
 * Customer Home Screen - Main search and discovery
 */
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from 'react-native';
// MapView requires native modules - only available in development builds, not in Expo Go
// To use MapView, create a development build: npx eas build --platform android --profile preview
const MapView: any = null;
const Marker: any = null;
const Callout: any = null;

import * as Linking from 'expo-linking';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingFooter } from '../../src/components/LoadingFooter';
import { SearchBar } from '../../src/components/SearchBar';
import { ShopCard } from '../../src/components/ShopCard';
import { ShopCardSkeleton } from '../../src/components/SkeletonLoader';
import { useLanguage } from '../../src/hooks/useLanguage';
import { usePaginatedShops } from '../../src/hooks/usePaginatedShops';
import { useLocationViewModel } from '../../src/viewModels/useLocationViewModel';
import { useSearchViewModel } from '../../src/viewModels/useSearchViewModel';

export default function CustomerHome() {
  const { t, toggleLanguage, language } = useLanguage();
  const router = useRouter();
  const {
    location,
    area,
    city,
    radius,
    permissionStatus,
    isLocating,
    hasLocation,
    requestPermission,
    refreshLocation,
    updateRadius,
  } = useLocationViewModel();

  const {
    query,
    isLoading,
    hasSearched,
    recentSearches,
    trendingSearches,
    setQuery,
    search,
    clearSearch,
    refreshShops,
    removeRecentSearch,
  } = useSearchViewModel();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [refreshing, setRefreshing] = useState(false);

  const {
    shops: paginatedShops,
    isLoading: isPaginatedLoading,
    fetchNextPage: fetchNextShopsPage,
    hasNextPage: hasNextShopsPage,
    isFetchingNextPage: isFetchingNextShopsPage,
    refetch: refetchPaginatedShops,
  } = usePaginatedShops({
    lat: location?.lat || 0,
    lng: location?.lng || 0,
    radiusKm: radius,
    pageSize: 10,
    enabled: hasLocation && !hasSearched,
  });

  const showRadiusSelector = useCallback(() => {
    if (Platform.OS !== 'android') {
      Alert.alert(t('customer.select_search_range'), '', [
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

    // Android Alert supports only up to 3 buttons, so show grouped options.
    Alert.alert(t('customer.select_search_range'), 'Choose distance group', [
      {
        text: '1-5 km',
        onPress: () =>
          Alert.alert(t('customer.select_search_range'), '', [
            { text: '1 km', onPress: () => updateRadius(1) },
            { text: '2 km', onPress: () => updateRadius(2) },
            { text: '5 km', onPress: () => updateRadius(5) },
          ]),
      },
      {
        text: '10-50 km',
        onPress: () =>
          Alert.alert(t('customer.select_search_range'), '', [
            { text: '10 km', onPress: () => updateRadius(10) },
            { text: '20 km', onPress: () => updateRadius(20) },
            { text: '50 km', onPress: () => updateRadius(50) },
          ]),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [t, updateRadius]);

  // Handle search submit
  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(customer)/results' as any,
        params: { query: searchQuery.trim() },
      });
    }
  }, [router]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    // Category filtering is done in the filteredShops computed value below
  }, []);

  // Handle trending search tap
  const handleTrendingSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  }, [setQuery, handleSearch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLocation();
      await refreshShops();
      await refetchPaginatedShops();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshLocation, refreshShops, refetchPaginatedShops]);

  // Handle shop press
  const handleShopPress = useCallback((shopId: string) => {
    router.push(`/(customer)/shop/${shopId}` as any);
  }, [router]);

  // Handle WhatsApp press
  const handleWhatsAppPress = useCallback((shop: any) => {
    Alert.alert(
      'WhatsApp',
      `${shop.name} ${t('customer.contact_shop')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: async () => {
            try {
              const message = `${t('customer.whatsapp_greeting')} ${shop.name} ${t('customer.from_dukandar_app')}`;
              const encodedMessage = encodeURIComponent(message);
              const phoneNumber = shop.whatsapp.replace(/[+\s]/g, '');
              const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
              await Linking.openURL(whatsappUrl);
            } catch (error) {
              Alert.alert(t('common.error'), t('customer.whatsapp_error'));
            }
          },
        },
      ]
    );
  }, [t, router]);

  // Display location text
  const locationText = useMemo(() => {
    return area && city ? `${area}, ${city}` : area || t('customer.location_select');
  }, [area, city, t]);

  // Filter shops by category
  const filteredShops = useMemo(
    () =>
      selectedCategory === 'all'
        ? paginatedShops
        : paginatedShops.filter((shop) => shop.category === selectedCategory),
    [selectedCategory, paginatedShops]
  );

  // Render permission denied state
  if (permissionStatus === 'denied' || permissionStatus === 'blocked') {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-primary px-6 pt-12 pb-6">
          <Text className="text-white text-2xl font-bold">{t('common.app_name')}</Text>
        </View>
        <EmptyState
          variant="permission_denied"
          actionLabel={t('customer.allow_permission')}
          onAction={requestPermission}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => {
              refreshLocation();
            }}
            className="flex-row items-center flex-1"
          >
            <Ionicons name="location" size={20} color="white" />
            <Text className="text-white text-base font-medium ml-2" numberOfLines={1}>
              {locationText}
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" className="ml-1" />
          </Pressable>

          <Pressable
            onPress={() => {
              console.log('[Customer Home] Language button pressed');
              toggleLanguage();
            }}
            className="ml-4"
          >
            <Ionicons name="language" size={24} color="white" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={handleSearch}
          onClear={clearSearch}
        />

        {/* Radius Selector */}
        <Pressable
          onPress={showRadiusSelector}
          className="flex-row items-center self-end mt-2"
        >
          <Text className="text-white text-sm">{radius} km</Text>
          <Ionicons name="chevron-down" size={14} color="white" className="ml-1" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Trending Searches */}
        {!hasSearched && (
          <View className="bg-white px-6 py-4 mb-2">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              🔥 {t('customer.trending_today')}
            </Text>
            <View className="flex-row flex-wrap">
              {trendingSearches.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleTrendingSearch(item)}
                  className="bg-gray-100 rounded-full px-4 py-2 mr-2 mb-2"
                >
                  <Text className="text-gray-700 text-sm">{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Recent Searches */}
        {!hasSearched && recentSearches.length > 0 && (
          <View className="bg-white px-6 py-4 mb-2">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              {t('customer.recent_searches')}
            </Text>
            {recentSearches.map((item, index) => (
              <View key={index} className="flex-row items-center py-2">
                <Pressable
                  onPress={() => handleTrendingSearch(item)}
                  className="flex-1 flex-row items-center"
                >
                  <Ionicons name="time" size={16} color="#9ca3af" />
                  <Text className="flex-1 text-gray-700 ml-3">{item}</Text>
                  <Ionicons name="arrow-up-outline" size={16} color="#9ca3af" />
                </Pressable>
                <Pressable
                  onPress={() => removeRecentSearch(item)}
                  className="ml-3 p-1"
                >
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Categories */}
        {!hasSearched && (
          <View className="bg-white py-4 mb-2">
            <Text className="text-lg font-bold text-gray-900 px-6 mb-2">
              {t('customer.shop_categories')}
            </Text>
            <CategoryFilter selected={selectedCategory} onSelect={handleCategorySelect} />
          </View>
        )}

        {/* Shops Near You */}
        {!hasSearched && hasLocation && (
          <View className="bg-white flex-1">
            <View className="px-6 py-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900">
                {t('customer.shops_near_you')} ({filteredShops.length})
              </Text>

              <View className="flex-row">
                <Pressable
                  onPress={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-primary' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name="list"
                    size={16}
                    color={viewMode === 'list' ? 'white' : '#6b7280'}
                  />
                </Pressable>
                {MapView && (
                  <Pressable
                    onPress={() => setViewMode('map')}
                    className={`p-2 rounded-lg ml-2 ${
                      viewMode === 'map' ? 'bg-primary' : 'bg-gray-100'
                    }`}
                  >
                    <Ionicons
                      name="map"
                      size={16}
                      color={viewMode === 'map' ? 'white' : '#6b7280'}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Loading State */}
            {isLoading || isLocating || isPaginatedLoading ? (
              <View className="px-6">
                <ShopCardSkeleton />
                <ShopCardSkeleton />
                <ShopCardSkeleton />
              </View>
            ) : filteredShops.length === 0 ? (
              <EmptyState variant="no_shops" />
            ) : viewMode === 'map' ? (
              MapView ? (
                <View className="px-6 pb-6" style={{ minHeight: 500 }}>
                  <MapView
                    style={{ height: 420, borderRadius: 16 }}
                    initialRegion={{
                      latitude: location?.lat || 31.5204,
                      longitude: location?.lng || 74.3587,
                      latitudeDelta: 0.03,
                      longitudeDelta: 0.03,
                    }}
                    showsUserLocation
                    showsMyLocationButton={Platform.OS === 'android'}
                  >
                    {filteredShops.map((shop) => (
                      <Marker
                        key={shop.id}
                        coordinate={{
                          latitude: shop.location.latitude,
                          longitude: shop.location.longitude,
                        }}
                        pinColor={shop.isOpen ? '#16a34a' : '#dc2626'}
                      >
                        <Callout onPress={() => handleShopPress(shop.id)}>
                          <View style={{ minWidth: 160 }}>
                            <Text className="font-semibold text-gray-900">{shop.name}</Text>
                            <Text className="text-xs text-gray-600 mt-1">
                              {shop.category} • {shop.isOpen ? t('customer.open') : t('customer.shop_closed')}
                            </Text>
                          </View>
                        </Callout>
                      </Marker>
                    ))}
                  </MapView>
                </View>
              ) : (
                <View className="px-6 pb-6 items-center justify-center" style={{ minHeight: 500 }}>
                  <Ionicons name="map" size={48} color="#d1d5db" />
                  <Text className="text-gray-600 text-center mt-4">
                    {t('customer.map_needs_dev_build')}
                  </Text>
                  <Text className="text-gray-500 text-center text-sm mt-2">
                    {t('customer.switch_to_list_prompt')}
                  </Text>
                  <Pressable
                    onPress={() => setViewMode('list')}
                    className="mt-4 bg-primary px-6 py-2 rounded-lg"
                  >
                    <Text className="text-white font-semibold">{t('customer.view_list')}</Text>
                  </Pressable>
                </View>
              )
            ) : (
              <View className="px-6 pb-6" style={{ minHeight: 500 }}>
                <FlashList
                  data={filteredShops}
                  renderItem={({ item}) => (
                    <ShopCard
                      shop={item}
                      onPress={() => handleShopPress(item.id)}
                      onWhatsAppPress={() => handleWhatsAppPress(item)}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  onEndReached={() => {
                    if (hasNextShopsPage && !isFetchingNextShopsPage) {
                      fetchNextShopsPage();
                    }
                  }}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={
                    <LoadingFooter
                      isLoading={isFetchingNextShopsPage}
                      text={language === 'ur' ? 'مزید دکانیں لوڈ ہو رہی ہیں...' : 'Loading more shops...'}
                    />
                  }
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}


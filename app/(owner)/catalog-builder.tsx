/**
 * app/(owner)/catalog-builder.tsx
 * Owner's catalog builder screen
 * Allows selecting from templates and customizing items
 */

import { bakeryTemplate } from '@constants/templates/bakery';
import { kiryanaTemplate } from '@constants/templates/kiryana';
import { pharmacyTemplate } from '@constants/templates/pharmacy';
import { sabziTemplate } from '@constants/templates/sabzi';
import { getShopById } from '@services/shopService';
import { useAuthStore } from '@store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useCatalogViewModel } from '@viewModels/useCatalogViewModel';
import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { CustomButton } from '../../src/components/CustomButton';
import { TextInput } from '../../src/components/TextInput';

interface TemplateOption {
  id: string;
  name: string;
  icon: string;
  items: any[];
  itemCount: number;
}

const templates: TemplateOption[] = [
  { id: 'kiryana', name: 'Kiryana Store', icon: '🛒', items: kiryanaTemplate, itemCount: 60 },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', items: pharmacyTemplate, itemCount: 45 },
  { id: 'sabzi', name: 'Vegetables & Fruits', icon: '🥕', items: sabziTemplate, itemCount: 35 },
  { id: 'bakery', name: 'Bakery', icon: '🥐', items: bakeryTemplate, itemCount: 30 },
];

export default function CatalogBuilderScreen() {
  const { user } = useAuthStore();

    // Fetch shop data
    const { data: shop, isLoading: isLoadingShop } = useQuery({
      queryKey: ['shop', user?.shopId],
      queryFn: async () => {
        if (!user?.shopId) throw new Error('No shop ID');
        return await getShopById(user.shopId);
      },
      enabled: !!user?.shopId,
    });

  const {
    selectedTemplate,
    searchQuery,
    selectedCategory,
    filteredItems,
    toggleItemSelection,
    customizeItem,
    getSelectedItemsWithCustomizations,
    getTotalValue,
    clearSelections,
    submitBulkProductsAsync,
    isSubmittingProducts,
    setSearchQuery,
    setSelectedCategory,
  } = useCatalogViewModel(shop || null);

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [showPrice, setShowPrice] = useState(false);
  if (isLoadingShop) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading shop data...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          Shop Not Registered
        </Text>
        <Text className="text-sm text-gray-600 text-center">
          Please register your shop first
        </Text>
      </View>
    );
  }


  const currentTemplateItems = useMemo(() => {
    const template = templates.find((t) => t.id === activeTemplate);
    return template ? filteredItems(template.items) : [];
  }, [activeTemplate, filteredItems]);

  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplate(activeTemplate === templateId ? null : templateId);
    clearSelections();
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleSubmit = async () => {
    const selected = selectedTemplate.length;
    if (selected === 0) {
      Alert.alert('Error', 'Please select at least one item');
      return;
    }

    Alert.alert(
      'Confirm Submission',
      `Add ${selected} products to your catalog?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            try {
              const items = getSelectedItemsWithCustomizations();
              await submitBulkProductsAsync(items);
              Alert.alert('Success', `${selected} products added!`);
              clearSelections();
              setActiveTemplate(null);
            } catch (error) {
              console.error('Catalog submit error:', error);
              Alert.alert('Error', 'Failed to add products. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderTemplateCard = (template: TemplateOption) => {
    const isActive = activeTemplate === template.id;
    const selectedCount = selectedTemplate.filter(
      (item) => template.items.some((t) => t.id === item.id)
    ).length;

    return (
      <TouchableOpacity
        key={template.id}
        onPress={() => handleSelectTemplate(template.id)}
        className={`mb-3 p-4 rounded-lg border-2 ${
          isActive ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              {template.icon} {template.name}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {template.itemCount} items
              {selectedCount > 0 && (
                <Text className="text-red-600 font-semibold">
                  {' '}
                  • {selectedCount} selected
                </Text>
              )}
            </Text>
          </View>
          {isActive && (
            <Text className="text-xl text-red-600">▶</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTemplateItems = () => {
    if (!activeTemplate) {
      return (
        <View className="mt-6">
          <Text className="text-gray-600 text-center">
            Select a template to get started
          </Text>
        </View>
      );
    }

    return (
      <View className="mt-6 space-y-3">
        {/* Search & Filter */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
          <Text>🔍</Text>
          <TextInput
            placeholder="Search items..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 bg-transparent"
          />
        </View>

        {/* Category Filter */}
        {activeTemplate && (
          <TouchableOpacity
            onPress={() => setShowPrice(!showPrice)}
            className="py-2"
          >
            <Text className="text-sm text-blue-600 font-medium">
              {showPrice ? 'Hide Prices' : 'Show Prices'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Items List */}
        <FlatList
          data={currentTemplateItems}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = selectedTemplate.some((i) => i.id === item.id);
            return (
              <TouchableOpacity
                onPress={() => toggleItemSelection(item)}
                className={`p-3 rounded-lg border mb-2 ${
                  isSelected
                    ? 'bg-red-50 border-red-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      {item.nameUrdu}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {item.unit}
                    </Text>
                  </View>
                  {showPrice && (
                    <Text className="text-sm font-semibold text-gray-800">
                      Rs {item.suggestedPrice}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Template Selection */}
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Select Template
      </Text>

      {templates.map((template) => renderTemplateCard(template))}

      {/* Template Items */}
      {renderTemplateItems()}

      {/* Selection Summary */}
      {selectedTemplate.length > 0 && (
        <View className="mt-6 p-4 bg-gray-50 rounded-lg">
          <Text className="font-semibold text-gray-800 mb-3">
            Selected: {selectedTemplate.length} items
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Total Value: Rs {getTotalValue().toLocaleString()}
          </Text>
          <CustomButton
            title={isSubmittingProducts ? 'Adding...' : 'Add to Catalog'}
            onPress={handleSubmit}
            disabled={isSubmittingProducts || selectedTemplate.length === 0}
          />
        </View>
      )}
    </ScrollView>
  );
}

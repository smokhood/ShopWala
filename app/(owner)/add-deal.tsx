/**
 * app/(owner)/add-deal.tsx
 * Screen for creating daily deals for shop products
 */

import { createDeal } from '@services/dealService';
import { getProductsByShop } from '@services/productService';
import { useAuthStore } from '@store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton } from '../../src/components/CustomButton';
import { TextInput } from '../../src/components/TextInput';

interface DealForm {
  productId: string;
  productName: string;
  regularPrice: number;
  discount: number;
  dealPrice: number;
  dealTitle: string;
  endDate: Date;
}

export default function AddDealScreen() {
  const { user } = useAuthStore();

  const [form, setForm] = useState<Partial<DealForm>>({
    discount: 10,
    dealTitle: 'Daily Deal',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Fetch shop products
  const productsQuery = useQuery({
    queryKey: ['shopProducts', user?.shopId],
    queryFn: () => {
      if (!user?.shopId) throw new Error('No shop found');
      return getProductsByShop(user.shopId);
    },
    enabled: !!user?.shopId,
  });

  const handleDiscountChange = (discount: number) => {
    if (selectedProduct) {
      const dealPrice = Math.round(
        selectedProduct.price * (1 - discount / 100)
      );
      setForm({
        ...form,
        discount,
        dealPrice,
      });
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    const discount = form.discount || 10;
    const dealPrice = Math.round(product.price * (1 - discount / 100));

    setForm({
      productId: product.id,
      productName: product.name,
      regularPrice: product.price,
      discount,
      dealPrice,
      dealTitle: 'Daily Deal',
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });
  };

  const handleSubmitDeal = async () => {
    if (!user?.shopId || !selectedProduct || !form.discount || !form.dealPrice) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const dealData = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        originalPrice: selectedProduct.price,
        dealPrice: form.dealPrice,
        expiresAt: form.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      
      await createDeal(user.shopId, dealData as any);
      
      Alert.alert('Success', 'Deal created successfully!');
      setForm({});
      setSelectedProduct(null);
    } catch (error) {
      console.error('Add deal error:', error);
      Alert.alert('Error', 'Failed to create deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  const products = productsQuery.data || [];

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Select Product */}
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Select Product
      </Text>

      <FlatList
        data={products}
        scrollEnabled={false}
        renderItem={({ item: product }) => {
          const isSelected = selectedProduct?.id === product.id;
          return (
            <TouchableOpacity
              onPress={() => handleProductSelect(product)}
              className={`p-3 rounded-lg border-2 mb-2 ${
                isSelected ? 'bg-red-50 border-red-500' : 'border-gray-200'
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">
                    {product.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Rs {product.price}
                  </Text>
                </View>
                {isSelected && (
                  <Text className="text-red-600 font-bold">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Deal Details */}
      {selectedProduct && (
        <View className="mt-6 space-y-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Deal Details
          </Text>

          {/* Regular Price */}
          <View className="p-3 bg-gray-50 rounded-lg">
            <Text className="text-sm text-gray-600">Regular Price</Text>
            <Text className="text-2xl font-bold text-gray-800 mt-1">
              Rs {selectedProduct.price}
            </Text>
          </View>

          {/* Discount Percentage */}
          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              <Text className="text-sm text-gray-700">Discount: {form.discount}%</Text>
            </Text>
            <TextInput
              value={form.discount?.toString() || '10'}
              onChangeText={(value: string) => {
                const discount = Math.min(100, Math.max(0, parseInt(value) || 0));
                handleDiscountChange(discount);
              }}
              keyboardType="number-pad"
              placeholder="10"
              className="text-lg"
            />
          </View>

          {/* Deal Price */}
          <View className="p-3 bg-red-50 rounded-lg">
            <Text className="text-sm text-red-700">Deal Price</Text>
            <Text className="text-2xl font-bold text-red-600 mt-1">
              Rs {form.dealPrice || selectedProduct.price}
            </Text>
            <Text className="text-xs text-red-600 mt-2">
              You save Rs {(selectedProduct.price - (form.dealPrice || selectedProduct.price))}
            </Text>
          </View>

          {/* Deal Title */}
          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              Deal Title
            </Text>
            <TextInput
              value={form.dealTitle || 'Daily Deal'}
              onChangeText={(value: string) =>
                setForm({ ...form, dealTitle: value })
              }
              placeholder="Daily Deal"
            />
          </View>

          {/* End Date Info */}
          <View className="p-3 bg-blue-50 rounded-lg">
            <View className="flex-row items-center">
              <Text className="text-sm text-blue-600 mr-2">📅</Text>
              <View className="ml-3 flex-1">
                <Text className="text-sm text-blue-700">Deal Duration</Text>
                <Text className="text-xs text-blue-600 mt-1">
                  24 hours from creation
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <CustomButton
            title={isSubmitting ? 'Creating Deal...' : 'Create Deal'}
            onPress={handleSubmitDeal}
            disabled={isSubmitting}
          />
        </View>
      )}

      {!selectedProduct && (
        <View className="mt-8 p-4 bg-gray-100 rounded-lg">
          <Text className="text-center text-gray-600">
            Select a product to create a deal
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

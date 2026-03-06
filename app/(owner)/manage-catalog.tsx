/**
 * app/(owner)/manage-catalog.tsx
 * Screen for editing existing products in catalog
 * Supports: Edit details, update prices, manage stock, swipe to delete
 */

import { getProductsByShopForOwner, toggleProductStock, updateProductDetails } from '@services/productService';
import { useAuthStore } from '@store/authStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { CustomButton } from '../../src/components/CustomButton';
import { TextInput } from '../../src/components/TextInput';

interface EditingProduct {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  isActive: boolean;
}

export default function ManageCatalogScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [editForm, setEditForm] = useState<Partial<EditingProduct>>({});

  // Fetch products
  const productsQuery = useQuery({
    queryKey: ['shopProducts', user?.shopId],
    queryFn: () => {
      if (!user?.shopId) throw new Error('No shop found');
      return getProductsByShopForOwner(user.shopId);
    },
    enabled: !!user?.shopId,
  });

  // Update editable product fields mutation
  const updateMutation = useMutation({
    mutationFn: async (product: EditingProduct) => {
      if (!user?.shopId) throw new Error('No shop found');
      return updateProductDetails(user.shopId, product.id, {
        name: product.name,
        price: product.price,
        inStock: product.inStock,
        isActive: product.isActive,
      });
    },
    onSuccess: () => {
      productsQuery.refetch();
      setEditingProduct(null);
      Alert.alert('Success', 'Product updated successfully');
    },
    onError: (error) => {
      console.error('Update product error:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    },
  });


  const handleEdit = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      inStock: product.inStock,
      isActive: product.isActive,
    });
    setEditForm({
      name: product.name,
      price: product.price,
      inStock: product.inStock,
      isActive: product.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    const updated = {
      ...editingProduct,
      ...editForm,
    };

    updateMutation.mutate(updated);
  };

  const handleDelete = (productId: string, productName: string, currentInStock: boolean) => {
    Alert.alert(
      'Product Stock',
      `${currentInStock ? 'Mark out of stock' : 'Mark in stock'} for "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            if (user?.shopId) {
              await toggleProductStock(user.shopId, productId, !currentInStock);
              productsQuery.refetch();
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (productId: string, productName: string, currentInStock: boolean) => {
    return (
      <TouchableOpacity
        onPress={() => handleDelete(productId, productName, currentInStock)}
        className="bg-red-500 w-20 flex items-center justify-center"
      >
        <Text className="text-white text-2xl">📦</Text>
      </TouchableOpacity>
    );
  };

  const products = productsQuery.data || [];

  if (editingProduct) {
    return (
      <ScrollView className="flex-1 bg-white p-4">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Edit Product
        </Text>

        <View className="space-y-4">
          {/* Product Name */}
          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              Product Name
            </Text>
            <TextInput
              value={editForm.name as string}
              onChangeText={(value: string) =>
                setEditForm({ ...editForm, name: value })
              }
              placeholder="Product name"
            />
          </View>

          {/* Price */}
          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              Price (Rs)
            </Text>
            <TextInput
              value={editForm.price?.toString() || ''}
              onChangeText={(value: string) =>
                setEditForm({
                  ...editForm,
                  price: parseInt(value) || 0,
                })
              }
              keyboardType="number-pad"
              placeholder="100"
            />
          </View>

          {/* Stock Status */}
          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              Stock Status
            </Text>
            <TouchableOpacity
              onPress={() =>
                setEditForm({
                  ...editForm,
                  inStock: !editForm.inStock,
                })
              }
              className={`p-3 rounded-lg border-2 ${
                editForm.inStock
                  ? 'bg-green-50 border-green-500'
                  : 'bg-orange-50 border-orange-400'
              }`}
            >
              <Text
                className={`font-medium ${
                  editForm.inStock ? 'text-green-700' : 'text-orange-700'
                }`}
              >
                {editForm.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Status */}
          <TouchableOpacity
            onPress={() =>
              setEditForm({
                ...editForm,
                isActive: !editForm.isActive,
              })
            }
            className={`p-3 rounded-lg border-2 ${
              editForm.isActive
                ? 'bg-green-50 border-green-500'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <Text
              className={`font-medium ${
                editForm.isActive ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {editForm.isActive ? '✓ Product Active' : '✕ Product Inactive'}
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mt-6">
            <TouchableOpacity
              onPress={() => {
                setEditingProduct(null);
                setEditForm({});
              }}
              className="flex-1 py-3 rounded-lg border border-gray-300"
            >
              <Text className="text-center text-gray-700 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>

            <CustomButton
              title={updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              onPress={handleSaveEdit}
              disabled={updateMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (productsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-800">
            {products.length} Products
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(owner)/catalog-builder')}
            className="p-2 bg-red-100 rounded-lg"
          >
            <Text className="text-2xl">➕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item: product }) => (
          <Swipeable
            renderRightActions={() =>
              renderRightActions(product.id, product.name, product.inStock)
            }
          >
            <TouchableOpacity
              onPress={() => handleEdit(product)}
              className="bg-white p-3 rounded-lg border border-gray-200 mb-2 flex-row justify-between items-center"
            >
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">
                  {product.name}
                </Text>
                <View className="flex-row mt-2 space-x-3">
                  <Text className="text-sm text-gray-600">
                    Rs {product.price}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    In Stock: {product.inStock ? 'Yes' : 'No'}
                  </Text>
                  <Text
                    className={`text-xs font-medium ${
                      product.isActive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <Text className="text-lg">✏️</Text>
            </TouchableOpacity>
          </Swipeable>
        )}
        keyExtractor={(item) => item.id}
      />

      {products.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">No products yet</Text>
          <CustomButton
            title="Add Products from Template"
            onPress={() => router.push('/(owner)/catalog-builder')}
          />
        </View>
      )}
    </View>
  );
}

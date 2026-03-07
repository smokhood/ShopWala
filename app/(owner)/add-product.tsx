/**
 * app/(owner)/add-product.tsx
 * Friendly form for owners to add custom products not present in templates.
 */

import { useAuthStore } from '@store/authStore';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { CustomButton } from '../../src/components/CustomButton';
import { TextInput } from '../../src/components/TextInput';
import { addProduct } from '../../src/services/productService';

type ProductCategoryOption = {
  value:
    | 'atta_rice'
    | 'oil_ghee'
    | 'dairy'
    | 'sugar_salt'
    | 'tea_drinks'
    | 'soap_hygiene'
    | 'pulses'
    | 'spices'
    | 'snacks'
    | 'cleaning'
    | 'medicines'
    | 'vitamins'
    | 'vegetables'
    | 'fruits'
    | 'bread_baked'
    | 'electronics'
    | 'other';
  label: string;
};

const categoryOptions: ProductCategoryOption[] = [
  { value: 'atta_rice', label: 'Atta & Rice' },
  { value: 'oil_ghee', label: 'Oil & Ghee' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'sugar_salt', label: 'Sugar & Salt' },
  { value: 'tea_drinks', label: 'Tea & Drinks' },
  { value: 'soap_hygiene', label: 'Soap & Hygiene' },
  { value: 'pulses', label: 'Pulses' },
  { value: 'spices', label: 'Spices' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'medicines', label: 'Medicines' },
  { value: 'vitamins', label: 'Vitamins' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'bread_baked', label: 'Bread & Baked' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
];

const unitOptions = ['piece', 'kg', 'g', 'litre', 'ml', 'pack', 'dozen', 'box'];

const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required'),
  nameUrdu: z.string().trim().optional(),
  category: z.enum([
    'atta_rice',
    'oil_ghee',
    'dairy',
    'sugar_salt',
    'tea_drinks',
    'soap_hygiene',
    'pulses',
    'spices',
    'snacks',
    'cleaning',
    'medicines',
    'vitamins',
    'vegetables',
    'fruits',
    'bread_baked',
    'electronics',
    'other',
  ]),
  price: z.number().positive('Price must be greater than 0'),
  unit: z.string().trim().min(1, 'Unit is required'),
  inStock: z.boolean(),
  isActive: z.boolean(),
});

export default function AddProductScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [nameUrdu, setNameUrdu] = useState('');
  const [priceText, setPriceText] = useState('');
  const [category, setCategory] = useState<ProductCategoryOption['value']>('other');
  const [unit, setUnit] = useState('piece');
  const [inStock, setInStock] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const selectedCategoryLabel = useMemo(() => {
    return categoryOptions.find((c) => c.value === category)?.label || 'Other';
  }, [category]);

  const handleSubmit = async () => {
    if (!user?.shopId) {
      Alert.alert('No Shop', 'Please register your shop first.');
      return;
    }

    const parsedPrice = Number(priceText.replace(/[^0-9.]/g, ''));

    const parsed = productFormSchema.safeParse({
      name,
      nameUrdu,
      category,
      price: parsedPrice,
      unit,
      inStock,
      isActive,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Please fill all required fields correctly.';
      Alert.alert('Invalid Product', message);
      return;
    }

    setIsSubmitting(true);
    try {
      await addProduct(user.shopId, {
        name: parsed.data.name,
        nameUrdu: parsed.data.nameUrdu && parsed.data.nameUrdu.trim().length > 0 ? parsed.data.nameUrdu.trim() : null,
        category: parsed.data.category,
        price: parsed.data.price,
        unit: parsed.data.unit,
        inStock: parsed.data.inStock,
        isActive: parsed.data.isActive,
        stockStatus: parsed.data.inStock ? 'in_stock' : 'out_of_stock',
        stockVerifiedAt: null,
      });

      Alert.alert('Success', 'Custom product added to your catalog.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(owner)/manage-catalog'),
        },
      ]);
    } catch (error) {
      console.error('Add custom product error:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView className="flex-1 bg-white p-4" keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold text-gray-900 mb-1">Add Custom Product</Text>
      <Text className="text-sm text-gray-600 mb-5">
        Add products that are not available in template lists.
      </Text>

      <Text className="text-sm text-gray-700 font-medium mb-2">Product Name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        onBlur={() => setName((v) => v.trim())}
        placeholder="e.g. Akmal Special Syrup"
      />

      <Text className="text-sm text-gray-700 font-medium mb-2">Product Name (Urdu) - Optional</Text>
      <TextInput
        value={nameUrdu}
        onChangeText={setNameUrdu}
        onBlur={() => setNameUrdu((v) => v.trim())}
        placeholder="اختیاری"
      />

      <Text className="text-sm text-gray-700 font-medium mb-2">Price (Rs) *</Text>
      <TextInput
        value={priceText}
        onChangeText={(value: string) => setPriceText(value)}
        keyboardType="decimal-pad"
        placeholder="e.g. 250"
      />

      <Text className="text-sm text-gray-700 font-medium mb-2">Category *</Text>
      <View className="flex-row flex-wrap">
        {categoryOptions.map((option) => {
          const selected = option.value === category;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setCategory(option.value)}
              className={`mr-2 mb-2 px-3 py-2 rounded-full border ${
                selected ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text className={`${selected ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-xs text-gray-500 mb-4">Selected: {selectedCategoryLabel}</Text>

      <Text className="text-sm text-gray-700 font-medium mb-2">Unit *</Text>
      <View className="flex-row flex-wrap mb-2">
        {unitOptions.map((u) => {
          const selected = u === unit;
          return (
            <TouchableOpacity
              key={u}
              onPress={() => setUnit(u)}
              className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                selected ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <Text className={`${selected ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>{u}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-sm text-gray-700 font-medium mb-2">Stock Status</Text>
      <TouchableOpacity
        onPress={() => setInStock((prev) => !prev)}
        className={`mb-4 p-3 rounded-lg border-2 ${
          inStock ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-400'
        }`}
      >
        <Text className={`font-medium ${inStock ? 'text-green-700' : 'text-orange-700'}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </Text>
      </TouchableOpacity>

      <Text className="text-sm text-gray-700 font-medium mb-2">Product Visibility</Text>
      <TouchableOpacity
        onPress={() => setIsActive((prev) => !prev)}
        className={`mb-6 p-3 rounded-lg border-2 ${
          isActive ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'
        }`}
      >
        <Text className={`font-medium ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
          {isActive ? 'Visible in catalog' : 'Hidden from customers'}
        </Text>
      </TouchableOpacity>

      <View className="flex-row space-x-3 mb-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-1 py-3 rounded-lg border border-gray-300"
          disabled={isSubmitting}
        >
          <Text className="text-center text-gray-700 font-medium">Cancel</Text>
        </TouchableOpacity>

        <CustomButton
          title={isSubmitting ? 'Adding...' : 'Add Product'}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * CategoryFilter Component - Horizontal scrollable category chips
 */
import { SHOP_CATEGORIES } from '@constants/categories';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
  showAll?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryFilter({
  selected,
  onSelect,
  showAll = true,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      className="flex-row"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
    >
      {showAll && (
        <CategoryPill
          id="all"
          label="سب"
          icon="grid"
          selected={selected === 'all'}
          onPress={() => onSelect('all')}
        />
      )}

      {SHOP_CATEGORIES.map((category) => (
        <CategoryPill
          key={category.id}
          id={category.id}
          label={category.nameUrdu}
          icon={category.icon}
          selected={selected === category.id}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );
}

interface CategoryPillProps {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

function CategoryPill({ label, icon, selected, onPress }: CategoryPillProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      style={[animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`flex-row items-center rounded-full px-4 py-2 mr-2 border-2 ${
        selected
          ? 'bg-primary border-primary'
          : 'bg-white border-gray-300'
      }`}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={selected ? 'white' : '#6b7280'}
      />
      <Text
        className={`ml-2 font-medium ${
          selected ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

type Props = {
  rating: number; // 0-5
  size?: number;
  color?: string;
};

// Read-only 5-star rating display.
export function StarRating({ rating, size = 16, color = '#F59E0B' }: Props) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i <= Math.round(rating) ? color : '#D1D5DB'}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

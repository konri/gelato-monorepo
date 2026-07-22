import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

type Props = {
  rating: number;
  /** When set, stars are tappable and call this with the chosen value (1-5). */
  onChange?: (value: number) => void;
  size?: number;
  color?: string;
};

/**
 * 5-star rating. Read-only by default; pass `onChange` to make it interactive
 * (used in the post-delivery review prompt).
 */
export function StarRating({ rating, onChange, size = 22, color = '#F5A623' }: Props) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating);
        const star = (
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? color : '#D1D5DB'}
            style={{ marginRight: 2 }}
          />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface InfoSectionProps {
  description: string;
}

export const InfoSection = ({ description }: InfoSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sprawdź czy tekst jest długi
  const isLongText = description.length > 150;
  const displayText =
    isExpanded || !isLongText ? description : description.substring(0, 150) + '...';

  return (
    <View className="p-4">
      <Text className="urbanist-h5-bold text-black mb-4">Info</Text>
      <Text className="urbanist-body-xlarge-regular text-gray-700 leading-6">{displayText}</Text>

      {isLongText && (
        <Pressable onPress={() => setIsExpanded(!isExpanded)} className="mt-2">
          <Text className="urbanist-body-medium-semibold text-primary">
            {isExpanded ? 'Show less' : 'Show more'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

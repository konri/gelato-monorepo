import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IceCreamBowlIllustration,
  CustomizeIllustration,
  DeliveryIllustration,
} from '../../components/onboarding/IceCreamIllustration';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  illustration: 'bowl' | 'customize' | 'delivery';
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: 'Diverse and\nfresh ice cream',
      description: 'With an extensive menu prepared for several ice cream flavors from local spots',
      illustration: 'bowl',
    },
    {
      id: '2',
      title: 'Easy to customize\nyour order',
      description: 'Pick your favorite flavors, choose scoops, and add toppings to make it perfect',
      illustration: 'customize',
    },
    {
      id: '3',
      title: 'Delivery given\non time',
      description: 'Track your order in real-time and get fresh ice cream delivered in 30 minutes',
      illustration: 'delivery',
    },
  ];

  const renderIllustration = (type: string) => {
    switch (type) {
      case 'bowl':
        return <IceCreamBowlIllustration size={240} />;
      case 'customize':
        return <CustomizeIllustration size={240} />;
      case 'delivery':
        return <DeliveryIllustration size={240} />;
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-8 bg-white">
      {/* Illustration */}
      <View className="mb-16">
        {renderIllustration(item.illustration)}
      </View>

      {/* Title */}
      <Text className="text-3xl font-bold font-urbanist text-text-primary text-center mb-4 leading-tight">
        {item.title}
      </Text>

      {/* Description */}
      <Text className="text-base text-text-secondary text-center leading-relaxed px-4">
        {item.description}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 pb-4 px-6 flex-row justify-between items-center">
        <TouchableOpacity onPress={handleSkip}>
          <Text className="text-base text-text-secondary font-medium">Skip</Text>
        </TouchableOpacity>
        <View className="flex-row gap-2">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentIndex
                  ? 'w-8 bg-accent'
                  : 'w-2 bg-text-tertiary'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom Button */}
      <View className="px-6 pb-12">
        <TouchableOpacity
          className="bg-accent rounded-button py-4 items-center shadow-sm"
          onPress={handleNext}
        >
          <Text className="text-white font-semibold text-base font-urbanist">
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

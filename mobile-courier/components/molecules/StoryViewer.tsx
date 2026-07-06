import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Story } from './StoriesSection';

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export const StoryViewer = ({
  visible,
  stories,
  initialIndex = 0,
  onClose,
  onStoryViewed,
}: StoryViewerProps) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!visible) {
      // Reset state when modal is hidden
      setCurrentIndex(0);
      setProgress(0);
      return;
    }

    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!visible || !currentStory) return;

    // Mark as viewed
    if (onStoryViewed && !currentStory.isViewed) {
      onStoryViewed(currentStory.id);
    }

    // Progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (STORY_DURATION / 50));
        if (newProgress >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            // Close when finished
            handleClose();
            return 100;
          }
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [visible, currentIndex, currentStory, stories.length, onStoryViewed, onClose]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setProgress(0);
    setCurrentIndex(0);
    onClose();
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
      onShow={() => {
        StatusBar.setBarStyle('light-content');
      }}
      onDismiss={() => {
        StatusBar.setBarStyle('dark-content');
      }}
    >
      <View className="flex-1 bg-black">
        {/* Story Image */}
        <View className="flex-1">
          <Image
            url={currentStory.imageUrl}
            fallbackWidth={width}
            fallbackHeight={height}
            fallbackLogoSize={100}
            rounded={false}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Top Overlay */}
        <View
          className="absolute top-0 left-0 right-0 px-4"
          style={{ paddingTop: insets.top + 12 }}
        >
          {/* Progress Bars */}
          <View className="flex-row gap-1 mb-3">
            {stories.map((_, index) => (
              <View
                key={index}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <View
                  className="h-full bg-white rounded-full"
                  style={{
                    width:
                      index < currentIndex
                        ? '100%'
                        : index === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </View>
            ))}
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 mr-2">
                {currentStory.storeLogoUrl ? (
                  <Image
                    url={currentStory.storeLogoUrl}
                    fallbackWidth={32}
                    fallbackHeight={32}
                    fallbackLogoSize={16}
                    rounded={true}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Ionicons name="storefront" size={16} color="white" />
                  </View>
                )}
              </View>
              <Typography variant="body-base-semibold" className="text-white">
                {currentStory.storeName}
              </Typography>
            </View>

            <Pressable onPress={handleClose} className="p-2" hitSlop={8}>
              <Ionicons name="close" size={28} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Touch Areas for Navigation */}
        <View className="absolute inset-0 flex-row">
          <Pressable className="flex-1" onPress={handlePrevious} />
          <Pressable className="flex-1" onPress={handleNext} />
        </View>
      </View>
    </Modal>
  );
};

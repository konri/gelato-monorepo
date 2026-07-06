import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Animated, Dimensions, Text, Easing, TouchableWithoutFeedback, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';

interface CouponActivationAnimationProps {
  visible: boolean;
  onComplete: () => void;
  couponData?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function CouponActivationAnimation({ visible, onComplete }: CouponActivationAnimationProps) {
  const animations = useRef({
    scale: new Animated.Value(1),
    y: new Animated.Value(0),
    x: new Animated.Value(0),
    opacity: new Animated.Value(1),
    bounce: new Animated.Value(1),
  }).current;
  
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const handleComplete = useCallback(() => {
    router.push('/(tabs)/qr');
    setTimeout(onComplete, 100);
  }, [router, onComplete]);

  const handleTouch = useCallback(() => {
    if (isAnimating) {
      // Stop current animation and complete immediately
      animations.scale.stopAnimation();
      animations.y.stopAnimation();
      animations.x.stopAnimation();
      animations.opacity.stopAnimation();
      animations.bounce.stopAnimation();
      
      handleComplete();
    }
  }, [isAnimating, animations, handleComplete]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouch,
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      setIsAnimating(false);
      return;
    }
    
    setIsAnimating(true);
    animations.scale.setValue(1);
    animations.y.setValue(0);
    animations.x.setValue(0);
    animations.opacity.setValue(1);
    animations.bounce.setValue(1);
    
    // Calculate precise QR tab position (center of tab bar, middle tab)
    const tabBarHeight = 90;
    const tabWidth = screenWidth / 5; // 5 tabs
    const qrTabIndex = 2; // QR is 3rd tab (index 2)
    const targetX = (qrTabIndex * tabWidth + tabWidth / 2) - screenWidth / 2; // Offset from center
    const targetY = screenHeight - tabBarHeight / 2 - screenHeight / 2; // Center of tab bar
    
    Animated.sequence([
      // 1. Bounce up effect
      Animated.timing(animations.bounce, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2))
      }),
      
      // 2. Move to QR tab position
      Animated.parallel([
        Animated.timing(animations.bounce, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animations.scale, { 
          toValue: 0.3, 
          duration: 800, 
          useNativeDriver: true,
          easing: Easing.in(Easing.quad)
        }),
        Animated.timing(animations.y, { 
          toValue: targetY, 
          duration: 800, 
          useNativeDriver: true,
          easing: Easing.in(Easing.quad)
        }),
        Animated.timing(animations.x, { 
          toValue: targetX, 
          duration: 800, 
          useNativeDriver: true,
          easing: Easing.in(Easing.quad)
        }),
      ]),
      
      // 3. Final fade out
      Animated.timing(animations.opacity, { 
        toValue: 0, 
        duration: 200, 
        useNativeDriver: true 
      })
    ]).start(() => {
      setIsAnimating(false);
      handleComplete();
    });
  }, [visible, animations, handleComplete]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View className="absolute inset-0 z-50" style={{ pointerEvents: visible ? 'auto' : 'none' }}>
        <Animated.View
          className="absolute bg-accent rounded-full w-16 h-16 items-center justify-center"
          style={{
            transform: [
              { translateX: animations.x },
              { translateY: animations.y },
              { scale: Animated.multiply(animations.scale, animations.bounce) },
            ],
            opacity: animations.opacity,
            left: screenWidth / 2 - 32,
            top: screenHeight / 2 - 32,
          }}
          {...panResponder.panHandlers}
        >
          <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-accent text-xs font-bold">1</Text>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
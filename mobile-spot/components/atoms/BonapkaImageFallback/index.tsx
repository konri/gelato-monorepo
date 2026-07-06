import GelatoLogo from '@/assets/images/gelato_logo.svg';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';

import { BonapkaImageFallbackProps } from './types';

export const BonapkaImageFallback = ({
  logoSize = 48,
}: BonapkaImageFallbackProps) => {
  return (
    <View className="h-full w-full overflow-hidden">
      <LinearGradient
        colors={['#EC2828', '#E8520D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ opacity: 0.85 }}>
          <GelatoLogo width={logoSize} height={logoSize} />
        </View>
      </LinearGradient>
    </View>
  );
};

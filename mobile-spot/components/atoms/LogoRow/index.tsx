import React, { useState } from 'react';
import { View } from 'react-native';
import LogoWhite from '@/assets/images/logo_white.svg';

export function LogoRow() {
  const [containerWidth, setContainerWidth] = useState(0);

  const logoSize = 26;
  const logoSpacing = 8;
  const smallLogoSize = 16;
  const totalLogos = Math.floor((containerWidth - logoSize) / (smallLogoSize + logoSpacing)) + 1;

  return (
    <View 
      className="flex-row items-center"
      style={{ gap: 8, flex: 1 }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {Array.from({ length: totalLogos }).map((_, index) => (
        <LogoWhite 
          key={index} 
          width={index === 0 ? 26 : 16} 
          height={index === 0 ? 26 : 15} 
          opacity={index === 0 ? 1 : 0.4} 
        />
      ))}
    </View>
  );
}

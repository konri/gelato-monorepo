import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

const testSvg = `<svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="20.8889" cy="16.8889" r="16.8889" fill="#EC2828"/>
<circle cx="20.8889" cy="16.8889" r="16.3889" stroke="white"/>
<path d="M22.4802 23.7238H19.6306C16.5331 23.7238 13.9312 21.4937 13.4356 18.5201L12.4445 13.0686C12.4445 12.6969 12.4445 12.4491 12.6923 12.2013C12.9401 11.9535 13.1878 11.8296 13.5595 11.8296H28.5513C28.923 11.8296 29.1707 11.9535 29.4185 12.2013C29.6663 12.4491 29.6663 12.8208 29.6663 13.0686L28.6752 18.5201C28.1796 21.6176 25.5777 23.7238 22.4802 23.7238ZM13.8073 13.1925L14.6746 18.3962C15.0463 20.8742 17.1526 22.6088 19.6306 22.6088H22.4802C24.9582 22.6088 27.0645 20.8742 27.4362 18.3962L28.3035 13.1925H13.8073Z" fill="white"/>
</svg>`;

export const SvgTest = () => {
  return (
    <View className="flex-1 items-center justify-center">
      <SvgXml xml={testSvg} width={100} height={100} />
    </View>
  );
};

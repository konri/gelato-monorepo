import React from 'react';
import { View } from 'react-native';

interface RoundedCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'less-rounded';
    shadow?: boolean;
}

export const RoundedCard = ({ children, className = '', variant = 'default', shadow = false }: RoundedCardProps) => {
    const borderRadius = variant === 'less-rounded' ? 'rounded-2xl' : 'rounded-32px';
    const shadowStyle = shadow ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.11, shadowRadius: 4.6, elevation: 5 } : {};
    
    return (
        <View className={`bg-white ${borderRadius} mx-6 mb-2 px-4 py-2 ${className}`} style={shadowStyle}>
            {children}
        </View>
    );
};

import React from 'react';
import { Pressable, Text } from 'react-native';

interface ListButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}

export const ListButton = ({ title, onPress, disabled = false }: ListButtonProps) => {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            className="bg-red-600 rounded-2xl justify-center items-center"
            style={{ 
                width: 129, 
                height: 32, 
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.25, 
                shadowRadius: 4, 
                elevation: 4,
                opacity: disabled ? 0.6 : 1
            }}
        >
            <Text 
                className="text-white text-center" 
                style={{ 
                    fontFamily: 'Urbanist', 
                    fontWeight: '500', 
                    fontSize: 16, 
                    lineHeight: 25.6, 
                    letterSpacing: 0.2 
                }}
            >
                {title}
            </Text>
        </Pressable>
    );
};
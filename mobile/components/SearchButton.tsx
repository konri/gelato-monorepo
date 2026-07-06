import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}

export const SearchButton = ({ title, onPress, disabled = false }: SearchButtonProps) => {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            className="bg-gray-100 rounded-2xl justify-center items-center flex-row"
            style={{ 
                width: 102, 
                height: 32, 
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.25, 
                shadowRadius: 4, 
                elevation: 4,
                opacity: disabled ? 0.6 : 1
            }}
        >
            <Ionicons name="search" size={16} color="#727272" />
            <Text 
                className="text-center ml-1" 
                style={{ 
                    fontFamily: 'Urbanist', 
                    fontWeight: '500', 
                    fontSize: 16, 
                    lineHeight: 25.6, 
                    letterSpacing: 0.2,
                    color: '#727272'
                }}
            >
                {title}
            </Text>
        </Pressable>
    );
};
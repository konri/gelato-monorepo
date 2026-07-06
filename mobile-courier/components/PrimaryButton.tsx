import React from 'react';
import {Pressable, Text, DimensionValue} from 'react-native';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    width?: DimensionValue;
    height?: number;
    disabled?: boolean;
}

export const PrimaryButton = ({ title, onPress, width = "80%", height = 42, disabled = false }: PrimaryButtonProps) => {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            className="rounded-32px justify-center items-center"
            style={{
                height: height, 
                backgroundColor: disabled ? '#EC282880' : '#EC2828',
                width: width,
                opacity: disabled ? 0.6 : 1
            }}
        >
            <Text className="text-white text-lg font-bold" style={{fontFamily: 'Urbanist', letterSpacing: 0.2}}>
                {title}
            </Text>
        </Pressable>
    );
};
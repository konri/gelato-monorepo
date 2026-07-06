import React from 'react';
import {Text, Pressable} from 'react-native';
import {StoreDetailsSheetProps} from './types';

export const StoreDetailsSheet = ({store, onClose}: StoreDetailsSheetProps) => {
    return (
        <Pressable
            onPress={onClose}
            className="mt-6 bg-red-600 rounded-full py-3 px-6"
        >
            <Text className="text-white font-semibold text-center" style={{fontFamily: 'Urbanist'}}>
                Zamknij
            </Text>
        </Pressable>
    );
};
import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { StoreForMap } from '@/shared/api-client/src/graphql/queries/stores/types';
import { formatDistance } from '@/utils/distance';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

interface StoresHorizontalScrollProps {
    stores: (StoreForMap & { distance?: number })[];
    onStorePress?: (storeId: string) => void;
}

export const StoresHorizontalScroll = ({ stores, onStorePress }: StoresHorizontalScrollProps) => {
    const handlePress = (storeId: string) => {
        if (onStorePress) onStorePress(storeId);
        else router.push(`/merchant_store/${storeId}`);
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4 pb-6"
            contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
        >
            {stores.map((store) => {
                const mainImage = store.images?.find((img) => img.type === 'main');
                const imageUrl = mainImage?.url;

                return (
                    <Pressable
                        key={store.id}
                        onPress={() => handlePress(store.id)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex-row"
                        style={{ width: 280 }}
                    >
                        {/* Image */}
                        <View className="rounded-xl overflow-hidden" style={{ width: 100, height: 80 }}>
                            <Image
                                url={imageUrl}
                                fallbackWidth={100}
                                fallbackHeight={80}
                                fallbackLogoSize={20}
                                rounded={false}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>

                        {/* Content */}
                        <View className="flex-1 pl-3 justify-between">
                            {/* Title */}
                            <Typography variant="body-base-bold" className="text-gray-900" numberOfLines={2}>
                                {store.merchant?.name || store.name}
                            </Typography>

                            {/* Distance badge */}
                            {store.distance != null && (
                                <View className="flex-row items-center justify-end">
                                    <View className="bg-gray-100 rounded-full px-2 py-1 flex-row items-center gap-1">
                                        <Ionicons name="navigate" size={11} color="#6B7280" />
                                        <Typography variant="body-small-regular" className="text-gray-500">
                                            {formatDistance(store.distance)}
                                        </Typography>
                                    </View>
                                </View>
                            )}
                        </View>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
};

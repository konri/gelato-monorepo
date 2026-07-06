import { SkeletonCircle, SkeletonRect } from '@/components/atoms/Skeleton';
import { nearbyStampCardStrategy } from '@/components/molecules/CouponSection/strategies';
import { HorizontalScrollSection } from '@/components/molecules/HorizontalScrollSection';
import { useNearbyStampCards } from '@/hooks/useNearbyStampCards';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export function NearbyStampsSection() {
    const {t} = useTranslation();
    const {data, loading} = useNearbyStampCards();

    const translations = {
        availableStamps: t('Sections.availableStamps'),
        collected: t('Sections.collected')
    };

    const stampSkeleton = (
        <View className="items-center mr-4 pt-2" style={{ width: 120 }}>
            <SkeletonCircle size={120} />
            <View className="mt-6 gap-2 items-center">
                <SkeletonRect width={90} height={14} radius={4} />
                <SkeletonRect width={60} height={12} radius={4} />
            </View>
        </View>
    );

    return (
        <HorizontalScrollSection
            titleKey="Sections.nearbyStamps"
            data={data}
            loading={loading}
            renderItem={(store) => nearbyStampCardStrategy.renderItem(store, translations)}
            getItemKey={(store) => store.store.id}
            onSeeAllPress={() => router.push('/see-all-stamps')}
            skeletonItem={stampSkeleton}
        />
    );
}

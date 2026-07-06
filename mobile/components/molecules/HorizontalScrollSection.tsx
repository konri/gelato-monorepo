import { SkeletonRect } from '@/components/atoms/Skeleton';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { useDevDelay } from '@/hooks/useDevDelay';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

interface HorizontalScrollSectionProps<T> {
    titleKey: string;
    data: T[] | null;
    loading: boolean;
    renderItem: (item: T) => React.ReactElement;
    getItemKey: (item: T) => string;
    headerContent?: React.ReactElement;
    onSeeAllPress?: () => void;
    skeletonItem?: React.ReactElement;
}

export function HorizontalScrollSection<T>({
    titleKey,
    data,
    loading,
    renderItem,
    getItemKey,
    headerContent,
    onSeeAllPress,
    skeletonItem,
}: HorizontalScrollSectionProps<T>) {
    const {t} = useTranslation();
    const devDelay = useDevDelay();
    const items = data || [];

    if (loading || devDelay) {
        return (
            <View className="mt-6">
                <View className="px-4 mb-3">
                    <SkeletonRect width={140} height={20} radius={4} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                    {[1, 2, 3].map((i) => (
                        <View key={i}>{skeletonItem}</View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <View className="mt-6">
            <SectionHeader
                title={t(titleKey)}
                seeAllText={t('Sections.seeAll')}
                onSeeAllPress={onSeeAllPress}
            />
            {headerContent}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 16
                }}
            >
                {items.map((item) => (
                    <View key={getItemKey(item)}>
                        {renderItem(item)}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

import { AutoScrollCarousel } from '@/components/atoms/AutoScrollCarousel';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { useDevDelay } from '@/hooks/useDevDelay';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, View } from 'react-native';

const {width: screenWidth} = Dimensions.get('window');

interface CarouselSectionProps<T> {
    titleKey: string;
    data: T[] | null;
    loading: boolean;
    renderItem: (item: T) => React.ReactElement;
    getItemKey: (item: T) => string;
    itemsPerSlide?: number;
    autoScroll?: boolean;
    bulletsColor?: string;
    headerContent?: React.ReactElement;
    onSeeAllPress?: () => void;
}

export function CarouselSection<T>({
    titleKey,
    data,
    loading,
    renderItem,
    getItemKey,
    itemsPerSlide = 2,
    autoScroll = true,
    bulletsColor = '#EC2828',
    headerContent,
    onSeeAllPress
}: CarouselSectionProps<T>) {
    const {t} = useTranslation();
    const devDelay = useDevDelay();
    const items = data || [];
    const itemWidth = (screenWidth - 48) / itemsPerSlide;
    const slides = [];

    for (let i = 0; i < items.length; i += itemsPerSlide) {
        slides.push(items.slice(i, i + itemsPerSlide));
    }

    if (!loading && !devDelay && items.length === 0) return null;

    return (
        <View className="mt-6">
            <View className="px-4">
                <SectionHeader
                    title={t(titleKey)}
                    seeAllText={t('Sections.seeAll')}
                    onSeeAllPress={onSeeAllPress}
                />
            </View>
            {headerContent}
            {(loading || devDelay || slides.length > 0) && (
                <AutoScrollCarousel
                    data={slides}
                    isLoading={loading || devDelay}
                    renderItem={(slideItems) => (
                        <View style={{width: screenWidth}} className="flex-row justify-center px-6">
                            {slideItems.map((item) => (
                                <View key={getItemKey(item)} style={{width: itemWidth}}>
                                    {renderItem(item)}
                                </View>
                            ))}
                        </View>
                    )}
                    keyExtractor={(_slideItems, index) => `slide-${index}`}
                    autoScroll={autoScroll && slides.length > 2}
                    showPagination={slides.length > 1}
                    bulletsColor={bulletsColor}
                />
            )}
        </View>
    );
}

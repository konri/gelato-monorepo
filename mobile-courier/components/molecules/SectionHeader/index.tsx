import { Typography } from '@/components/atoms/Typography';
import React from 'react';
import { Pressable, View } from 'react-native';

interface SectionHeaderProps {
    title: string;
    onSeeAllPress?: () => void;
    showSeeAll?: boolean;
    seeAllText?: string;
    className?: string;
}

export function SectionHeader({ title, onSeeAllPress, showSeeAll = true, seeAllText = 'See all', className = 'px-4' }: SectionHeaderProps) {
    return (
        <View className={`flex-row items-center justify-between mb-4 ${className}`}>
            <Typography variant="header-section-title">
                {title}
            </Typography>
            {showSeeAll && (
                <Pressable onPress={onSeeAllPress}>
                    <Typography variant="header-section-subtitle">
                        {seeAllText}
                    </Typography>
                </Pressable>
            )}
        </View>
    );
}

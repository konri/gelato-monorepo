import { Typography } from '@/components/atoms/Typography';
import { CarouselSection } from '@/components/molecules/CarouselSection';
import { rewardStrategy } from '@/components/molecules/CouponSection/strategies';
import { useMyRedeemableRewards } from '@/hooks/useMyRedeemableRewards';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';

export function RewardsSection() {
    const {t} = useTranslation();
    const router = useRouter();
    const {data, loading} = useMyRedeemableRewards();

    const headerContent = (
        <View className="px-3 py-4">
            <Pressable
                className="bg-[#F7F5F5] rounded-3xl border border-white px-4 py-3 flex-row justify-between items-center"
                style={{
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 4},
                    shadowOpacity: 0.19,
                    shadowRadius: 6.85,
                    elevation: 5,
                }}
            >
                <Typography variant="body-small-regular" className="text-black">
                    {t('Sections.visitNewPlace')}
                </Typography>
                <View className="flex-row items-center gap-1 pr-2">
                    <Typography variant="body-small-bold" className="text-[#FF0000] font-bold pr-1">
                        +100
                    </Typography>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={{width: 24, height: 24}}
                    />
                </View>
            </Pressable>
        </View>
    );

    return (
        <CarouselSection
            titleKey="Sections.rewards"
            data={data}
            loading={loading}
            renderItem={(reward) => rewardStrategy.renderItem(reward, t)}
            getItemKey={(reward) => reward.id}
            headerContent={headerContent}
            onSeeAllPress={() => router.push('/see-all-rewards')}
        />
    );
}
import React from 'react';
import {Typography} from '@/components/atoms/Typography';
import {RoundedCard} from '@/components/atoms/RoundedCard';
import {Button} from '@/components/atoms/Button';
import {View} from "react-native";

interface PointsSectionProps {
    userPoints: number;
    t: (key: string, params?: any) => string;
}

export const PointsSection = ({userPoints, t}: PointsSectionProps) => {
    return (
        <RoundedCard className="mt-4 pb-6" variant="less-rounded" shadow>
            <Typography variant="header-section-title" className="text-text-primary text-center mb-2 pt-4">
                {t('MerchantStore.yourPoints')}
            </Typography>
            <Typography
                variant="display-4xl-bold"
                className="text-accent text-center mb-3 pt-4"
            >
                {userPoints ? userPoints : 0} {t('Sections.points')}
            </Typography>
            <Button
                title={t('MerchantStore.pointsExchange', {points: 10, reward: 100})}
                onPress={() => {
                }}
                height={36}
                width={"80%"}
                textColor="text-text-primary"
                className="bg-white border border-accent rounded-2xl self-center"
            />
        </RoundedCard>
    );
};
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { InputField } from '@/components/InputField';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export const SendReferralSection = () => {
    const {t} = useTranslation();
    const [referralCode, setReferralCode] = useState('');

    const handleSendReferral = () => {
        // TODO: Send referral code
    };

    return (
        <View className="px-6 mt-2">
            <Typography variant="body-lg-bold" className="mb-4">
                {t('Profile.enterReferralCode')}
            </Typography>

            <View className="flex-row items-end mb-3">
                <View className="flex-1 mr-3">
                    <InputField
                        label=""
                        placeholder={t('Profile.referralCodePlaceholder')}
                        value={referralCode}
                        onChangeText={setReferralCode}
                        iconName="mail-outline"
                        autoCapitalize="characters"
                        paddingY="py-6"
                        iconSize={24}
                        iconMargin="mr-4"
                    />
                </View>
                <Button
                    title={"→"}
                    onPress={handleSendReferral}
                    textVariant="body-xl-bold"
                    textColor="text-white"
                    height={66}
                    width={64}
                />
            </View>

            <Typography variant="body-small-regular" className="text-gray-600 text-center mb-4">
                {t('Profile.referralBonus')}
            </Typography>
        </View>
    );
};
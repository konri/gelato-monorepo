import React from 'react';
import {View} from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import {Typography} from '@/components/atoms/Typography';
import {useTranslation} from 'react-i18next';

interface QRCodeComponentProps {
    deepLink: string;
}

export function QRCodeComponent({deepLink}: QRCodeComponentProps) {
    const {t} = useTranslation();

    if (!deepLink) {
        return null;
    }

    return (
        <View className="px-6 py-6">
            <Typography
                variant="body-2xl-bold"
                className="text-left mb-6"
            >
                {t('QR.title')}
            </Typography>

            <View className="items-center">
                <View className="w-[327px] h-[327px] bg-white rounded-32px items-center justify-center p-8 border-3 border-accent shadow-md">
                    <QRCodeSVG
                        value={deepLink}
                        size={250}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                        logo={require('@/assets/images/logo.png')}
                        logoSize={44}
                        logoBackgroundColor="#FFFFFF"
                        logoMargin={8}
                        logoBorderRadius={0}
                    />
                </View>
            </View>
        </View>
    );
}
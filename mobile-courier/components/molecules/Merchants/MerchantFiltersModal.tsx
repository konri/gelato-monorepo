import { Typography } from "@/components/atoms/Typography";
import {View} from "react-native";
import {useTranslation} from "react-i18next";

interface MerchantFiltersModalProps {
    onClose?: () => void;
}

export const MerchantFiltersModal = ({onClose}: MerchantFiltersModalProps) => {
    const {t} = useTranslation();
    
    return (
        <View className="gap-4">
            <View className="flex-row items-center justify-between">
                <Typography variant="body-small-semibold">{t('Merchants.sortBy')}</Typography>
                <View className="bg-input-bg px-6 py-3 w-40" />
            </View>
            <Typography variant="body-small-semibold">{t('Merchants.category')}</Typography>
            <Typography variant="body-small-semibold">{t('Merchants.category')}</Typography>
        </View>
    );
};

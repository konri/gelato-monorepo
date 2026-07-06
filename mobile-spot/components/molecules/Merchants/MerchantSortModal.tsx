import { Typography } from "@/components/atoms/Typography";
import {Pressable, View} from "react-native";
import {useTranslation} from "react-i18next";

interface MerchantSortModalProps {
    sortType: 'nearest' | 'alphabetical';
    onSortChange: (type: 'nearest' | 'alphabetical') => void;
    onClose?: () => void;
}

export const MerchantSortModal = ({onSortChange, onClose}: MerchantSortModalProps) => {
    const {t} = useTranslation();

    const handleSort = (type: 'nearest' | 'alphabetical') => {
        onSortChange(type);
        onClose?.();
    };

    return (
        <View className="gap-3">
            <Pressable onPress={() => handleSort('nearest')}>
                <Typography variant="body-small-semibold">
                    {t('Merchants.nearestToYou')}
                </Typography>
            </Pressable>
            <Pressable onPress={() => handleSort('alphabetical')}>
                <Typography variant="body-small-semibold">
                    {t('Merchants.alphabetical')}
                </Typography>
            </Pressable>
        </View>
    );
};
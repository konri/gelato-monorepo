import type { Voucher } from '@repo/types/merchants';
import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface VoucherCardProps {
  voucher: Voucher;
}

export const VoucherCard = ({ voucher }: VoucherCardProps) => {
  const { t } = useTranslation();

  return (
    <View className="bg-gray-50 rounded-lg overflow-hidden mb-3">
      {voucher.imageUrl && (
        <Image source={{ uri: voucher.imageUrl }} className="w-full h-32" resizeMode="cover" />
      )}

      <View className="p-3">
        <Text className="urbanist-body-large-semibold text-black mb-1">{voucher.title}</Text>

        <Text className="urbanist-body-medium-regular text-gray-600 mb-3">
          {voucher.description}
        </Text>

        <View className="flex-row justify-between items-center">
          <Text className="urbanist-body-small-semibold text-primary">{t('Sections.value')} {voucher.value}</Text>
          <Text className="urbanist-body-small-regular text-gray-500">
            {voucher.pointsCost} {t('Sections.pointsCost')}
          </Text>
        </View>
      </View>
    </View>
  );
};

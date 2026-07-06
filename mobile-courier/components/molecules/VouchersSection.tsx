import type { Voucher } from '@repo/types/merchants';
import { FlatList, View } from 'react-native';
import { VoucherCard } from './VoucherCard';
import { StateView } from '@/components/atoms/StateView';
import { Typography } from '@/components/atoms/Typography';

interface VouchersSectionProps {
  vouchers: Voucher[];
}

export const VouchersSection = ({ vouchers }: VouchersSectionProps) => {
  const renderVoucher = ({ item }: { item: Voucher }) => <VoucherCard voucher={item} />;

  const renderEmptyComponent = () => (
    <View className="py-12">
      <StateView message="No vouchers available" />
    </View>
  );

  return (
    <View className="p-4">
      <Typography variant="body-lg-bold" className="mb-4">Vouchers</Typography>

      <FlatList
        data={vouchers}
        renderItem={renderVoucher}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

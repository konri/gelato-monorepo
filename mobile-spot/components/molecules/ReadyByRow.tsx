import { Typography } from '@/components/atoms/Typography';
import { formatReadyBy, type ReadyByKind } from '@/utils/scheduledFor';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const KIND_COLOR: Record<ReadyByKind, string> = {
  asap: '#EC2828',
  today: '#EC2828',
  tomorrow: '#4F46E5',
  later: '#4F46E5',
};

type Props = {
  scheduledFor?: string | null;
  className?: string;
};

/** Clock row showing when the customer wants the package ready. */
export function ReadyByRow({ scheduledFor, className }: Props) {
  const { t, i18n } = useTranslation();
  const { label, kind } = formatReadyBy(scheduledFor, t, i18n.language);
  const color = KIND_COLOR[kind];

  return (
    <View className={`flex-row items-center ${className ?? ''}`}>
      <Ionicons name="time-outline" size={15} color={color} />
      <Typography variant="body-small-semibold" className="ml-2" style={{ color }}>
        {t('Spot.readyBy')}: {label}
      </Typography>
    </View>
  );
}

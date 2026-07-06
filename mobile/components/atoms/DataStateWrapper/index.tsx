import { useDevDelay } from '@/hooks/useDevDelay';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SkeletonRect } from '../Skeleton';
import { StateView } from '../StateView';

interface DataStateWrapperProps {
  loading?: boolean;
  error?: string | null;
  data?: any[] | null;
  emptyMessage?: string;
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

const DefaultSkeleton = () => (
  <View className="flex-1 px-4 pt-4 gap-3">
    {[1, 2, 3, 4].map((i) => (
      <SkeletonRect key={i} width="100%" height={80} radius={12} />
    ))}
  </View>
);

export const DataStateWrapper = ({ loading, error, data, emptyMessage, children, loadingFallback }: DataStateWrapperProps) => {
  const { t } = useTranslation();
  const devDelay = useDevDelay();

  if (loading || devDelay) {
    return <>{loadingFallback ?? <DefaultSkeleton />}</>;
  }

  if (error) {
    return <StateView message={error} variant="error" />;
  }

  if (!data || data.length === 0) {
    return <StateView message={emptyMessage || t('Common.noData')} />;
  }

  return <>{children}</>;
};

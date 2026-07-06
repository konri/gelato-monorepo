import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import type { ActivityHistoryVisualProps } from '@/components/Home/ActivityHistoryVisual/types';

const ActivityHistoryVisual = ({ alt, className = '' }: ActivityHistoryVisualProps) => {
  return (
    <Image
      src={IMAGES.home.fifthSection.activityHistoryMockup}
      alt={alt}
      width={820}
      height={500}
      className={`h-auto w-full max-w-[min(100%,640px)] object-contain lg:max-w-[720px] ${className}`}
      sizes="(max-width: 1024px) 90vw, 720px"
    />
  );
};

export default ActivityHistoryVisual;

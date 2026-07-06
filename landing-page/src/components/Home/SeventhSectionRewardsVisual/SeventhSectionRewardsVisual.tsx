import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import type { SeventhSectionRewardsVisualProps } from '@/components/Home/SeventhSectionRewardsVisual/types';

const SeventhSectionRewardsVisual = ({
  stampCardAlt,
  pointsCardAlt,
  className = '',
}: SeventhSectionRewardsVisualProps) => {
  return (
    <div
      className={`relative mx-auto flex w-full max-w-[560px] items-center justify-center gap-2 sm:max-w-[640px] sm:gap-4 md:mx-0 md:max-w-[720px] md:gap-6 ${className}`}
    >
      <div className="relative w-[48%] max-w-[300px] shrink-0">
        <Image
          src={IMAGES.home.seventhSection.stampCardReward}
          alt={stampCardAlt}
          width={339}
          height={340}
          className="h-auto w-full object-contain"
          sizes="(max-width: 768px) 44vw, 300px"
        />
      </div>
      <div className="relative mt-8 w-[48%] max-w-[300px] shrink-0 sm:mt-10 md:mt-12">
        <Image
          src={IMAGES.home.seventhSection.merchantPoints}
          alt={pointsCardAlt}
          width={339}
          height={340}
          className="h-auto w-full object-contain"
          sizes="(max-width: 768px) 44vw, 300px"
        />
      </div>
    </div>
  );
};

export default SeventhSectionRewardsVisual;

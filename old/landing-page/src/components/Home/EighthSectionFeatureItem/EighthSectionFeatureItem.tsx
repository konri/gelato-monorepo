import Image from 'next/image';
import type { EighthSectionFeatureItemProps } from '@/components/Home/EighthSectionFeatureItem/types';

const EighthSectionFeatureItem = ({
  iconSrc,
  iconAlt,
  title,
  content,
  showDivider = false,
  delay = '800',
}: EighthSectionFeatureItemProps) => {
  return (
    <div>
      <div className="flex gap-5 sm:gap-7">
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={64}
          height={64}
          className="h-12 w-12 shrink-0 object-contain xs:h-16 xs:w-16"
        />
        <div className="min-w-0 flex-1">
          <h3
            className="fade-in-up-target text-base font-bold leading-snug text-custom-gray"
            data-delay={delay}
          >
            {title}
          </h3>
          <p className="pt-2 text-left text-base text-custom-gray-light">{content}</p>
        </div>
      </div>
      {showDivider ? <div className="border-box-icons my-8 w-full md:my-10" /> : null}
    </div>
  );
};

export default EighthSectionFeatureItem;

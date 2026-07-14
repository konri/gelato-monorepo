import Image from 'next/image';
import Button from '@/components/common/Button';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import type { FeatureShowcaseRowProps } from '@/components/Home/FeatureShowcaseRow/types';

const FeatureShowcaseRow = ({
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  title,
  description,
  buttonText,
  reverse = false,
}: FeatureShowcaseRowProps) => {
  return (
    <FadeInOnVisible
      className={`flex flex-col items-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-6 xl:mx-auto xl:max-w-[1248px] ${
        reverse ? 'lg:flex-row-reverse' : ''
      }`}
    >
      <div className="relative flex w-full max-w-[min(100%,420px)] shrink-0 items-center justify-center sm:max-w-[460px] lg:max-w-[min(48vw,500px)]">
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 aspect-square w-[88%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F4D4D4]"
        />
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          className="fade-in-up-target relative z-10 h-auto w-full max-h-[380px] object-contain object-center sm:max-h-[420px] lg:max-h-[480px]"
          sizes="(max-width: 1024px) 85vw, 460px"
          data-delay="0"
        />
      </div>
      <div className="flex w-full max-w-[520px] flex-col items-center gap-6 text-center lg:max-w-[440px] lg:items-start lg:text-left">
        <h3 className="fade-in-up-target w-full text-custom-24 font-bold text-custom-gray" data-delay="200">
          {title}
        </h3>
        <p className="fade-in-up-target text-custom-13 font-bold text-custom-gray-light" data-delay="400">
          {description}
        </p>
        <div className="fade-in-up-target mx-auto w-fit lg:mx-0" data-delay="600">
          <Button
            type="button"
            title={buttonText}
            variant="btn_white_no_padding"
            border="border-2 border-gray-500"
          />
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default FeatureShowcaseRow;

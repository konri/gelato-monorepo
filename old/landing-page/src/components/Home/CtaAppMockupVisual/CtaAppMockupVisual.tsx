import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import type { CtaAppMockupVisualProps } from '@/components/Home/CtaAppMockupVisual/types';

const CtaAppMockupVisual = ({ alt, className = '' }: CtaAppMockupVisualProps) => {
  return (
    <Image
      src={IMAGES.home.tenthSection.appLoginMockup}
      alt={alt}
      width={896}
      height={1024}
      className={`h-auto w-full object-contain ${className}`}
      sizes="(max-width: 768px) 75vw, 440px"
    />
  );
};

export default CtaAppMockupVisual;

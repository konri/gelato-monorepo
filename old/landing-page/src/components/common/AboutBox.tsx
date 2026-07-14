import React from 'react';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import Image from 'next/image';

type AboutBoxProps = {
  iconSrc: string;
  titleKey: string;
  altKey: string;
  locale: Locale;
};

const AboutBox = ({ iconSrc, titleKey, altKey, locale }: AboutBoxProps) => {
  const { t } = getTranslation('about', locale);

  return (
    <div className="flex flex-col items-center text-center py-4 ">
      <div className="flex justify-center items-center w-full h-full mb-[62px]">
        <Image 
          src={iconSrc} 
          alt={t(altKey)} 
          className="w-[30%] h-auto" 
          width={100}
          height={100}
        />
      </div>
      <div className="pt-2 text-custom-gray text-[20px] font-bold text-left">
        {t(titleKey)}
      </div>
    </div>
  );
};

export default AboutBox;
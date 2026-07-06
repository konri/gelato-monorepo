"use client";

import { useEffect, useState } from 'react';
import Button from '@/components/common/Button';
import { IMAGES } from '@/constants/images';
import ArrowDropdownToggle from '@/components/common/ArrowDropdownToggle';
import Image from 'next/image';
import { getTranslation, type Locale } from '@/utils/getDictionary';

type PricingItemProps = {
  locale: Locale;
  mostPopularButton?: React.ReactNode;
  plan: string;
  unit?: string;
  price?: string;
  time?: string;
  description: string;
  buttonLabel?: string;
  icon?: string;
  customButton?: React.ReactNode;
  featuresText: string;
  featuresItems: string[];
  customStyle?: string;
}

const PricingItem = ({
  locale,
  mostPopularButton,
  plan,
  unit,
  price,
  time,
  description,
  buttonLabel,
  icon,
  customButton,
  featuresText,
  featuresItems,
  customStyle
}: PricingItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = getTranslation('common', locale);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (window.innerWidth >= 768) setIsExpanded(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`pricing-item relative min-w-0 overflow-hidden ${customStyle}`}>
      { mostPopularButton ? (
          <div className="md:absolute md:top-[-32px] md:left-0 md:right-0 md:bottom-[-32px] md:z-[-1] md:bg-white md:rounded-2xl md:shadow-md">
          {mostPopularButton}
        </div>
      ) : null }
      <div className="pricing-plan">{plan}</div>
      {icon ? (
        <Image className="h-auto w-auto w-48 md:w-32" src={icon} alt={t('suitcaseAlt')} width={192} height={100} />
      ) : (
        <div className="relative mt-1 flex items-center">
          <div className="pricing-unit">{unit}</div>
          <div className="pricing-price">{price}</div>
          <div className="pricing-time">{time}</div>
        </div>
      )}
      <div className="my-4 w-full shrink-0 border-b-2 border-solid border-[#748FB51A]" />
      <div className="max-w-[200px] min-h-[72px] mb-3 text-[#6E757C] md:mb-6 md:min-h-auto">{description}</div>
      <div className="w-full">
        {customButton ? customButton : <Button type="button" title={buttonLabel!} variant="btn_orange" maxWidth="max-w-[80%] mx-auto" className="text-sm" />}
      </div>
      <div className="w-full py-4 px-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 mt-4 font-semibold focus:outline-none"
        >
          <span>{featuresText}</span>
          <ArrowDropdownToggle isExpanded={isExpanded} locale={locale} />
        </button>
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[1000px]' : 'max-h-0'
          }`}
        >
          <ul className="mt-2 ml-4 text-[#6E757C] text-[18px]" data-delay="100">
            {featuresItems.map((item) => (
              <li className="flex items-center gap-3 pt-4" key={item}>
                <Image 
                  src={IMAGES.common.checkIcon} 
                  alt={t('checkIconAlt')} 
                  className="w-4 h-4 text-green-500" 
                  width={16} 
                  height={16}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingItem;
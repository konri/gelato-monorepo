import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';

type BoxesProps = {
  image: string;
  alt: string;
  title: string;
  content: string;
};

const Boxes = ({ image, alt, title, content }: BoxesProps) => {
  return (
    <div className="min-w-[160px] xs:min-w-[240px] lg:w-1/4 pt-10 overflow-visible">
      <Image src={image} alt={alt} className="w-16 h-16 mb-4" width={64} height={64} />
      <div className="w-[30%] border-box-icons" />
      <div className="pt-2 text-custom-gray text-[16px] font-bold lg:w-3/4 landing-average">{title}</div>
      <div className="pt-2 text-custom-gray-light text-[16px] text-left lg:w-2/3">{content}</div>
    </div>
  );
};

const SixthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <section className="flex mt-default-section-separator">
      <div className="flex flex-nowrap overflow-x-auto gap-7 px-4 lg:flex-wrap lg:overflow-x-visible lg:justify-start lg:gap-0 lg:px-0">
        <Boxes
          image={IMAGES.home.sixthSection.chart}
          alt={t('sixthSection.chartAlt')}
          title={t('sixthSection.dataSafeTitle')}
          content={t('sixthSection.dataSafeContent')}
        />
        <Boxes
          image={IMAGES.home.sixthSection.loop}
          alt={t('sixthSection.loopAlt')}
          title={t('sixthSection.smartLoyaltyTitle')}
          content={t('sixthSection.smartLoyaltyContent')}
        />
        <Boxes
          image={IMAGES.home.sixthSection.flower}
          alt={t('sixthSection.flowerAlt')}
          title={t('sixthSection.manageAllTitle')}
          content={t('sixthSection.manageAllContent')}
        />
        <Boxes
          image={IMAGES.home.sixthSection.circle}
          alt={t('sixthSection.circleAlt')}
          title={t('sixthSection.buildRelationsTitle')}
          content={t('sixthSection.buildRelationsContent')}
        />
        <Boxes
          image={IMAGES.home.sixthSection.rescue}
          alt={t('sixthSection.rescueAlt')}
          title={t('sixthSection.support24Title')}
          content={t('sixthSection.support24Content')}
        />
        <Boxes
          image={IMAGES.home.sixthSection.note}
          alt={t('sixthSection.noteAlt')}
          title={t('sixthSection.customerManagementTitle')}
          content={t('sixthSection.customerManagementContent')}
        />
        <Boxes
          image={IMAGES.home.sixthSection.arrow}
          alt={t('sixthSection.arrowAlt')}
          title={t('sixthSection.autoTrackingTitle')}
          content={t('sixthSection.autoTrackingContent')}
        />
        <Boxes
          image={IMAGES.home.sixthSection.chart2}
          alt={t('sixthSection.chart2Alt')}
          title={t('sixthSection.increaseRevenueTitle')}
          content={t('sixthSection.increaseRevenueContent')}
        />
      </div>
    </section>
  );
};

export default SixthSection;

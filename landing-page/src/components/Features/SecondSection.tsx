import { IMAGES } from '@/constants/images';
import FeatureBox from '@/components/common/FeatureBox';
import type { WithLocale } from '@/types/locale';

const SecondSection = ({ locale }: WithLocale) => {
  return (
    <section className="relative mt-default-subpages-section-separator">
      <div className="flex items-center flex-col md:flex-row md:items-center md:justify-center">
        <div className="pl-10 md:pl-20 pr-4 md:pr-10 w-full  mt-10 md:pt-4">
          <FeatureBox
            iconSrc={IMAGES.features.secondSection.chat}
            titleKey="section1Title"
            descriptionKey="section1Description"
            altKey="chatAlt"
            locale={locale}
          />
        </div>
        <div className="pl-10 md:pl-20 pr-4 md:pr-10 w-full mt-10 pt-10 md:pt-4 border-t-4 md:border-t-0 md:border-l-4 border-[#748FB51A]">
          <FeatureBox
            iconSrc={IMAGES.features.secondSection.commentAdd}
            titleKey="section2Title"
            descriptionKey="section2Description"
            altKey="triangleAlt"
            locale={locale}
          />
        </div>
        <div className="pl-10 md:pl-20 pr-4 md:pr-10 w-full mt-10 pt-10 md:pt-4 border-t-4 md:border-t-0 md:border-l-4 border-[#748FB51A]">
          <FeatureBox
            iconSrc={IMAGES.features.secondSection.folderReplace}
            titleKey="section3Title"
            descriptionKey="section3Description"
            altKey="folderIconAlt"
            locale={locale}
          />
        </div>
      </div>
    </section>
  );
};

export default SecondSection;
import AnimatedText from '@/components/common/AnimatedText';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import { IMAGES } from '@/constants/images';
import AboutBox from '@/components/common/AboutBox';
import TeamMember from '@/components/common/TeamMember';

const SecondSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('about', locale);

  const teamMembers = [
    { imgSrc: IMAGES.about.secondSection.avatarPlaceholder, nameKey: 'person1Name', descriptionKey: 'person1Description' },
    { imgSrc: IMAGES.about.secondSection.avatarPlaceholder, nameKey: 'person2Name', descriptionKey: 'person2Description' },
  ];

  return (
    <FadeInOnVisible className="relative mt-default-subpages-section-separator">
      <div className="flex items-center flex-col text-center">
        <div className="flex mx-4 mb-8 mt-8 text-gray-main-font lg:mx-0 uppercase">{t('section1Subtitle')}</div>
        <div className="custom-small-header-subpages whitespace-nowrap md:w-auto fade-in-up-target" data-delay="1200">
          <AnimatedText text1={t('section1Title')} text2={t('')} text3={t('')} />
        </div>
      </div>
      <div className="flex items-center flex-col pt-10 md:gap-20 md:flex-row md:items-center md:justify-center">
        <AboutBox iconSrc={IMAGES.about.secondSection.young} titleKey="section2item1Title" altKey="section2item1Title" locale={locale} />
        <AboutBox iconSrc={IMAGES.about.secondSection.enthusiasm} titleKey="section2item2Title" altKey="section2item2Title" locale={locale} />
        <AboutBox iconSrc={IMAGES.about.secondSection.smile} titleKey="section2item3Title" altKey="section2item3Title" locale={locale} />
      </div>
      <div className="m-auto w-[80%] my-10 border-b-4 border-[#748FB51A]" />
      <div className="flex items-center flex-col text-center">
        <span>❤</span>
        <div className="mb-10 text-[13px] leading-[1.84615] font-semibold">{t('teamTitle')}</div>
        <ul className="flex items-center flex-col xs:flex-row xs:items-start xs:justify-center xs:flex-wrap">
          {teamMembers.map((member) => (
            <TeamMember
              key={member.nameKey}
              imgSrc={member.imgSrc}
              altText={t(member.nameKey)}
              nameKey={member.nameKey}
              descriptionKey={member.descriptionKey}
              locale={locale}
            />
          ))}
        </ul>
      </div>
    </FadeInOnVisible>
  );
};

export default SecondSection;
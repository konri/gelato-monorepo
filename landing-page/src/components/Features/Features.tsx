import FirstSection from '@/components/Features/FirstSection';
import SecondSection from '@/components/Features/SecondSection';
import ThirdSection from '@/components/Features/ThirdSection';
import FourthSection from '@/components/Features/FourthSection';
import FifthSection from '@/components/Features/FifthSection';
import type { WithLocale } from '@/types/locale';

const Features = ({ locale }: WithLocale) => {
  return (
    <>
      <FirstSection locale={locale} />
      <SecondSection locale={locale} />
      <ThirdSection locale={locale} />
      <FourthSection locale={locale} />
      <FifthSection locale={locale} />
    </>
  );
};

export default Features;

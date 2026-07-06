import FirstSection from '@/components/About/FirstSection';
import SecondSection from '@/components/About/SecondSection';
import type { WithLocale } from '@/types/locale';

const About = ({ locale }: WithLocale) => {
  return (
    <>
      <FirstSection locale={locale} />
      <SecondSection locale={locale} />
    </>
  );
};

export default About;

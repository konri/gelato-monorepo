import FirstSection from '@/components/Download/FirstSection';
import SecondSection from '@/components/Download/SecondSection';
import ThirdSection from '@/components/Download/ThirdSection';
import type { WithLocale } from '@/types/locale';

const Download = ({ locale }: WithLocale) => {
  return (
    <>
      <FirstSection locale={locale} />
      <SecondSection locale={locale} />
      <ThirdSection locale={locale} />
    </>
  );
};

export default Download;

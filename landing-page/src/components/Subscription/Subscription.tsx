import FirstSection from '@/components/Subscription/FirstSection';
import SecondSection from '@/components/Subscription/SecondSection';
import type { WithLocale } from '@/types/locale';

const Subscription = ({ locale }: WithLocale) => {
  return (
    <>
      <FirstSection locale={locale} />
      <SecondSection locale={locale} />
    </>
  );
};

export default Subscription;

import FirstSection from '@/components/Contact/FirstSection';
import type { WithLocale } from '@/types/locale';

const Contact = ({ locale }: WithLocale) => {
  return <FirstSection locale={locale} />;
};

export default Contact;

import FirstSection from '@/components/Home/FirstSection';
import SecondSection from '@/components/Home/SecondSection';
import ThirdSection from '@/components/Home/ThirdSection';
import FourthSection from '@/components/Home/FourthSection';
import FifthSection from '@/components/Home/FifthSection';
import SixthSection from '@/components/Home/SixthSection';
import SeventhSection from '@/components/Home/SeventhSection';
import EighthSection from '@/components/Home/EighthSection';
import NinthSection from '@/components/Home/NinthSection';
import TenthSection from '@/components/Home/TenthSection';
import type { WithLocale } from '@/types/locale';

const Home = ({ locale }: WithLocale) => {
  return (
    <>
      <FirstSection locale={locale} />
      <SecondSection locale={locale} />
      <ThirdSection locale={locale} />
      <FourthSection locale={locale} />
      <FifthSection locale={locale} />
      <SixthSection locale={locale} />
      <SeventhSection locale={locale} />
      <EighthSection locale={locale} />
      <NinthSection locale={locale} />
      <TenthSection locale={locale} />
    </>
  );
};

export default Home;

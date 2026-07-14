import Image from 'next/image';
import { getTranslation, type Locale } from '@/utils/getDictionary';

type TeamMemberProps = {
  imgSrc: string;
  altText: string;
  nameKey: string;
  descriptionKey: string;
  locale: Locale;
};

const TeamMember = ({ imgSrc, altText, nameKey, descriptionKey, locale }: TeamMemberProps) => {
  const { t } = getTranslation('about', locale);

  return (
    <li className="mt-18 mx-10 mb-4 flex flex-col items-center justify-center xs:w-[26%] md:w-[14%]">
      <Image src={imgSrc} alt={altText} className="h-[100px] w-[100px] rounded-full" width={100} height={100} />
      <div className="mb-1 text-center font-bold">{t(nameKey)}</div>
      <div className="-mx-[5px] m-0 text-[14px] leading-[1.71429] text-[#748FB5]">{t(descriptionKey)}</div>
    </li>
  );
};

export default TeamMember;

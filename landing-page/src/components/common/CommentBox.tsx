import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import { getTranslation, type Locale } from '@/utils/getDictionary';
type CommentProps = {
  locale: Locale;
  content: string;
  starsNumber: number;
  name: string;
  role: string;
};

const CommentBox = ({ locale, content, starsNumber, name, role }: CommentProps) => {
  const { t } = getTranslation('home', locale);
  const starElement = <Image src={IMAGES.home.ninthSection.star} alt={t('ninthSection.starAlt')} className="w-6 h-6" width={24} height={24} />;
  const starElementsArray = [];
  if (starsNumber < 1 || starsNumber > 5) {
    throw new Error('Stars must be between 1 and 5');
  } else {
    for (let i = 0; i < starsNumber; i++) {
      starElementsArray.push(starElement);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 min-w-[300px] text-center">
      <div className="font-medium-semibold text-[22px] lg:h-auto">"{content}"</div>
      <div className="flex">
        {starElementsArray.map((star, index) => (
          <span key={index}>{star}</span>
        ))}
      </div>
      <div className="font-semibold text-[18px]">{name}</div>
      <div className="text-[#757575]">{role}</div>
    </div>
  );
};

export default CommentBox;

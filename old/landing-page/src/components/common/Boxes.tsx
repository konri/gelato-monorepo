import Button from '@/components/common/Button';
import Image from 'next/image';

type StepProps = {
  image: string;
  alt: string;
  stepNumber?: number;
  title: string;
  content: string;
  stepLabel?: string;
  imgWidth?: string;
  imgHeight?: string;
  boxHeight?: string;
};

const Boxes = ({
                 image,
                 alt,
                 stepNumber,
                 title,
                 content,
                 stepLabel,
                 imgWidth = 'w-16',
                 imgHeight = 'h-16',
                 boxHeight = 'h-auto',
               }: StepProps) => {
  return (
    <div className={`flex items-center flex-col ${boxHeight} md:w-[22%] border-b-4 md:border-b-0 md:border-r-4 last:border-b-0 md:last:border-r-0 py-4`}>
      <Image
        src={image}
        alt={alt}
        className={`${imgWidth} ${imgHeight} mb-4`}
        width={64}
        height={64}
      />
      {stepNumber !== undefined && stepLabel && <Button type="button" title={`${stepLabel} ${stepNumber}`} variant="btn_step" />}
      <div className="pt-2 text-custom-gray text-[16px] font-bold px-2">{title}</div>
      <div className="pt-2 text-custom-gray-light text-[16px] px-4 text-center w-[300px] md:w-[160px]">
        {content}
      </div>
    </div>
  );
};

export default Boxes;

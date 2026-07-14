import Link from 'next/link';
import { ReactNode } from 'react';
import Image from 'next/image';

type LinkButtonProps = {
  href: string;
  title: string;
  icon?: ReactNode;
  iconAlt?: string;
  variant:
    | 'btn_orange'
    | 'btn_orange_home_page'
    | 'btn_orange_home_page_mobile'
    | 'btn_white_home_page'
    | 'btn_white_try'
    | 'btn_white_one_line'
    | 'btn_white_feature_page'
    | 'btn_white_subscription_page'
    | 'btn_white_no_padding';
  className?: string;
  border?: string;
  height?: string;
  paddingX?: string;
  iconClassName?: string;
  maxWidth?: string;
};

const LinkButton = ({
  href,
  title,
  icon,
  iconAlt = `${title} icon`,
  variant,
  className = '',
  border = '',
  height = 'py-2',
  paddingX = 'px-4',
  iconClassName = 'w-4 h-4',
  maxWidth,
}: LinkButtonProps) => {
  return (
    <Link href={href} className={`flexCenter rounded-[1vw] ${variant} ${maxWidth || ''}`}>
      <span
        className={`${border} rounded-[1vw] ${paddingX} ${height} ${className} lg:whitespace-nowrap cursor-pointer flex items-center gap-2`}
      >
        {icon && (
          typeof icon === 'string' ? (
            <Image src={icon} alt={iconAlt} className={iconClassName} width={16} height={16} style={{ width: 'auto', height: 'auto' }} />
          ) : (
            <span className={iconClassName}>{icon}</span>
          )
        )}
        {title}
      </span>
    </Link>
  );
};

export default LinkButton;

"use client";

import Image from 'next/image';
import { ReactNode } from 'react';

type ButtonProps = {
  type: 'button' | 'submit' | 'reset';
  title: string;
  icon?: ReactNode; // Supports Image, SVG, or other components
  iconAlt?: string; // New prop for translated alt text
  variant:
    | 'btn_orange'
    | 'btn_white_main_menu'
    | 'btn_white_toggle_menu'
    | 'btn_orange_home_page'
    | 'btn_orange_home_page_mobile'
    | 'btn_white_try'
    | 'btn_step'
    | 'btn_step_subscription'
    | 'btn_white_one_line'
    | 'btn_white_no_padding'
    | 'btn_white_toggle_menu_languages'
    | 'btn_white_subscription_page'
    | 'btn_white_home_page'
    | 'btn_white_feature_page';
  onClick?: () => void;
  className?: string;
  border?: string;
  height?: string;
  paddingX?: string;
  iconClassName?: string;
  maxWidth?: string;
};

const Button = ({
                  type,
                  title,
                  icon,
                  iconAlt = `${title} icon`, // Fallback to title-based alt
                  variant,
                  onClick,
                  className = '',
                  border = '',
                  height = 'py-2',
                  paddingX = 'px-4',
                  iconClassName = 'w-4 h-4',
                  maxWidth,
                }: ButtonProps) => {
  return (
    <button className={`flexCenter rounded-[1vw] ${variant} ${maxWidth || ''}`} type={type} onClick={onClick}>
      <label
        className={`${border} rounded-[1vw] ${paddingX} ${height} ${className} lg:whitespace-nowrap cursor-pointer flex items-center gap-2`}
      >
        {icon && (
          typeof icon === 'string' ? (
            <Image src={icon} alt={iconAlt} className={iconClassName} width={16} height={16} />
          ) : (
            <span className={iconClassName}>{icon}</span>
          )
        )}
        {title}
      </label>
    </button>
  );
};

export default Button;
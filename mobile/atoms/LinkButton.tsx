import type { LinkButtonProps } from '@repo/ui';
import { ButtonContent } from '@repo/ui/components/atoms/Button/Button';
import { Linking, Pressable } from 'react-native';

export const LinkButton = ({
  href,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  children,
  className = '',
  disabled,
  iconSrc,
  iconPosition,
  ...props
}: LinkButtonProps) => {
  const mobileButtonStyles = {
    opacity: disabled || isLoading ? 0.6 : 1,
  };

  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      style={mobileButtonStyles}
      disabled={disabled || isLoading}
      {...props}
    >
      <ButtonContent iconSrc={iconSrc} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </Pressable>
  );
};

export default LinkButton;

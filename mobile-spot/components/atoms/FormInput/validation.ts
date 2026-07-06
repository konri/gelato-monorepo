import { ValidationUtil } from '@/utils/validation';
import { validateReferralCode, validatePhone } from '@/utils/validators';

export const getValidationForType = (
  type: string | undefined,
  t: (key: string) => string
) => {
  switch (type) {
    case 'email':
      return (value: string, required: boolean = true) => {
        if (!value) return required ? t('Validation.emailRequired') : true;
        const validation = ValidationUtil.validateEmail(value);
        return validation.isValid
          ? true
          : validation.messageKey
            ? t(validation.messageKey)
            : t('Validation.emailInvalid');
      };

    case 'password':
      return (value: string, required: boolean = true) => {
        if (!value) return required ? t('Validation.passwordRequired') : true;
        const validation = ValidationUtil.validatePassword(value);
        return validation.isValid
          ? true
          : validation.messageKey
            ? t(validation.messageKey)
            : t('Validation.passwordRequired');
      };

    case 'name':
      return (value: string, required: boolean = true) => {
        if (!value || !value.trim()) return required ? t('Validation.nameRequired') : true;
        return true;
      };

    case 'phone':
      return (value: string, required: boolean = false) => {
        if (!value) {
          return required ? t('Common.enterPhoneNumber') : true;
        }
        return validatePhone(value) ? true : t('Validation.phoneInvalid');
      };

    case 'referralCode':
      return (value: string) => {
        if (!value) return true;
        return validateReferralCode(value)
          ? true
          : t('Validation.referralCodeInvalid');
      };

    default:
      return undefined;
  }
};


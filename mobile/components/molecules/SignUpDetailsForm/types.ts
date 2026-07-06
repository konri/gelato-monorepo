export type SignUpDetailsFormProps = {
  onSkip?: () => void;
  isFirstTimeLogin: boolean;
  profileImage: string | null;
  phoneNumber?: string;
  onImagePick: () => void;
};

export type SignUpDetailsFormData = {
  firstName: string;
  surname: string;
  phone: string;
  birthDate: string;
  referralCode?: string;
};


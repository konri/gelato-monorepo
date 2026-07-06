export type SignupFormProps = Record<string, never>;

export type SignupFormData = {
  email: string;
  password: string;
  name: string;
  registrationSource: "MOBILE_CLIENT";
  referralCode?: string;
};

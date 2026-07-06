export type AccountUserDataMerchantRow = {
  id?: string | null;
  name?: string | null;
};

export type AccountUserDataReadOnlyCardProps = {
  user: {
    firstName?: string;
    surname?: string;
    phone?: string;
    birthDate?: string;
    email?: string;
  };
  merchants: ReadonlyArray<AccountUserDataMerchantRow>;
  roleLabels: readonly string[];
};

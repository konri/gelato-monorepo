import type { CompanyBasic } from "../../types/company";

export type CompanyInput = Omit<CompanyBasic, "id"> & {
  logoId?: string;
};

export type CreateCompanyResponse = {
  createCompanyAndMakeUserOwner: {
    token: string;
    role: string;
  };
};

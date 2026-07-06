export type CompanyByNipData = {
  nip: string;
  name: string;
  regon?: string | null;
  krs?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
} | null;

export type GetCompanyByNipResponse = {
  getCompanyByNip: CompanyByNipData;
};

import type { CompanyBasic } from "../../types/company";

export type Company = CompanyBasic & {
  logo?: {
    id: string;
    fileName?: string;
    filePath?: string;
    filePreview?: string;
  } | null;
  createdAt?: string;
};

export type GetMyCompanyResponse = {
  getMyCompany: Company | null;
};

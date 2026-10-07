import { gql } from '@apollo/client';

/** Partnership requests from the public /for-business form (SUPER_ADMIN only). */

export const BUSINESS_LEAD_STATUSES = ['NEW', 'CONTACTED', 'APPROVED', 'DECLINED'] as const;
export type BusinessLeadStatus = (typeof BUSINESS_LEAD_STATUSES)[number];

export type BusinessType = 'ICE_CREAM' | 'BAKERY' | 'CAFE' | 'CONFECTIONERY' | 'OTHER';

export type BusinessLead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city?: string | null;
  businessTypes: BusinessType[];
  spotsCount: number;
  currentSystem?: string | null;
  message?: string | null;
  /** Language of the form when it was sent. */
  language?: 'PL' | 'EN' | 'UA' | null;
  status: BusinessLeadStatus;
  adminNote?: string | null;
  statusChangedAt?: string | null;
  /** null when the status was never changed (or the account was removed). */
  statusChangedBy?: { id: string; name?: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessLeadPage = { items: BusinessLead[]; total: number };

export type BusinessLeadCounts = {
  new: number;
  contacted: number;
  approved: number;
  declined: number;
  total: number;
};

/** Omitted = unchanged. */
export type UpdateBusinessLeadVariables = {
  id: string;
  status?: BusinessLeadStatus;
  adminNote?: string | null;
};

export const BUSINESS_LEAD_FIELDS = gql`
  fragment BusinessLeadFields on BusinessLead {
    id
    companyName
    contactName
    email
    phone
    city
    businessTypes
    spotsCount
    currentSystem
    message
    language
    status
    adminNote
    statusChangedAt
    statusChangedBy {
      id
      name
    }
    createdAt
    updatedAt
  }
`;

/** One page of requests, newest first; `total` counts every match. */
export const BUSINESS_LEADS = gql`
  query BusinessLeads($status: BusinessLeadStatus, $search: String, $limit: Int, $offset: Int) {
    businessLeads(status: $status, search: $search, limit: $limit, offset: $offset) {
      items {
        ...BusinessLeadFields
      }
      total
    }
  }
  ${BUSINESS_LEAD_FIELDS}
`;

/** Answered from the cache when a list already holds the request (cachePolicies.ts). */
export const BUSINESS_LEAD = gql`
  query BusinessLead($id: ID!) {
    businessLead(id: $id) {
      ...BusinessLeadFields
    }
  }
  ${BUSINESS_LEAD_FIELDS}
`;

/** Per-status counters: the filter chips and the sidebar badge (NEW). */
export const BUSINESS_LEAD_COUNTS = gql`
  query BusinessLeadCounts {
    businessLeadCounts {
      new
      contacted
      approved
      declined
      total
    }
  }
`;

export const UPDATE_BUSINESS_LEAD = gql`
  mutation UpdateBusinessLead($id: ID!, $status: BusinessLeadStatus, $adminNote: String) {
    updateBusinessLead(id: $id, status: $status, adminNote: $adminNote) {
      ...BusinessLeadFields
    }
  }
  ${BUSINESS_LEAD_FIELDS}
`;

/**
 * Refetched after a status change: the list (a request may leave the current
 * filter) and the counters (chips and the sidebar badge). Lists of other
 * filters refresh when shown (cache-and-network).
 */
export const LEAD_STATUS_REFETCH = ['BusinessLeads', 'BusinessLeadCounts'];

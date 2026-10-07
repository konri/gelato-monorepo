import { gql } from '@apollo/client';
import { BRAND_TASK_FIELDS } from './fragments';
import type { LocalizedText } from './brands';
import type { ScheduleWindow } from '../lib/schedule';

/** v1 knows POINTS_MULTIPLIER only; other kinds are shown read-only. */
export type BrandTaskKind = 'POINTS_MULTIPLIER' | (string & {});
export type BrandTaskStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

/** A brand promotion as the console edits it (BrandTask). */
export type BrandTask = {
  id: string;
  brandId: string;
  kind: BrandTaskKind;
  status: BrandTaskStatus;
  title: string;
  titleLocal?: LocalizedText | null;
  description?: string | null;
  descriptionLocal?: LocalizedText | null;
  multiplierPercent?: number | null;
  appliesToOrders: boolean;
  appliesToTemplateAwards: boolean;
  /** Local dates YYYY-MM-DD (time zone of each location); null = open. */
  startsOn?: string | null;
  endsOn?: string | null;
  windows: ScheduleWindow[];
  /** [] = every location of the brand. */
  spotIds: string[];
  timesApplied: number;
  createdAt: string;
  updatedAt: string;
};

/** BrandTaskInput: always sent in full (updateBrandTask replaces everything). */
export type BrandTaskInput = {
  kind: 'POINTS_MULTIPLIER';
  title: string;
  titleLocal: LocalizedText | null;
  description: string | null;
  descriptionLocal: LocalizedText | null;
  multiplierPercent: number;
  appliesToOrders: boolean;
  appliesToTemplateAwards: boolean;
  startsOn: string | null;
  endsOn: string | null;
  windows: ScheduleWindow[];
  spotIds: string[];
};

/** Live state of an ACTIVE promotion, computed by the server in each location's local time. */
export type BrandPromotionState = {
  taskId: string;
  isActiveNow: boolean;
  activeUntil?: string | null;
  nextStartsAt?: string | null;
  timezone: string;
  spotIds: string[];
};

/** The brand's promotions for the console (MANAGE_BRAND), newest first. */
export const BRAND_TASKS = gql`
  query BrandTasks($brandId: ID, $includeArchived: Boolean = true) {
    brandTasks(brandId: $brandId, includeArchived: $includeArchived) {
      ...BrandTaskFields
    }
  }
  ${BRAND_TASK_FIELDS}
`;

/**
 * Running and upcoming promotions at the brand's active locations (what
 * customers see). The console reads only the live state per task.
 */
export const BRAND_PROMOTIONS = gql`
  query BrandPromotions($brandId: ID!) {
    brandPromotions(brandId: $brandId) {
      taskId
      isActiveNow
      activeUntil
      nextStartsAt
      timezone
      spotIds
    }
  }
`;

/** Starts ACTIVE; needs an active brand. */
export const CREATE_BRAND_TASK = gql`
  mutation CreateBrandTask($brandId: ID, $input: BrandTaskInput!) {
    createBrandTask(brandId: $brandId, input: $input) {
      ...BrandTaskFields
    }
  }
  ${BRAND_TASK_FIELDS}
`;

/** Full replace: settings, windows and spot scope (spotIds [] = every location). */
export const UPDATE_BRAND_TASK = gql`
  mutation UpdateBrandTask($id: ID!, $input: BrandTaskInput!) {
    updateBrandTask(id: $id, input: $input) {
      ...BrandTaskFields
    }
  }
  ${BRAND_TASK_FIELDS}
`;

/** Pause (PAUSED), resume (ACTIVE) or archive (ARCHIVED). */
export const SET_BRAND_TASK_STATUS = gql`
  mutation SetBrandTaskStatus($id: ID!, $status: BrandTaskStatus!) {
    setBrandTaskStatus(id: $id, status: $status) {
      ...BrandTaskFields
    }
  }
  ${BRAND_TASK_FIELDS}
`;

/** Hard delete when never applied; otherwise the server archives it. */
export const DELETE_BRAND_TASK = gql`
  mutation DeleteBrandTask($id: ID!) {
    deleteBrandTask(id: $id)
  }
`;

import type { VenueSessionScanPayload } from "@/utils/venueOrderQr";

export type OrderQueueScanAssignCardProps = {
  userId?: string | null;
  venueSession?: VenueSessionScanPayload | null;
  merchantStoreId: string;
  canSubmit: boolean;
};

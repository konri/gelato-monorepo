import type { VenueSessionScanPayload } from "@/utils/venueOrderQr";
import type { RefObject } from "react";

export type CloseInterceptor = (() => boolean) | null;

export type ScannedRewardPanelProps = {
  userId: string | null;
  venueSession: VenueSessionScanPayload | null;
  onClose: () => void;
  onBeforeCloseRef: RefObject<CloseInterceptor>;
};

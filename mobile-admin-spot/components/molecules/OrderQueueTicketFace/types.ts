import type { ReactNode } from "react";

export type OrderQueueTicketFaceTone = "accent" | "chrome";

export type OrderQueueTicketFaceProps = {
  tone: OrderQueueTicketFaceTone;
  children?: ReactNode;
  overlay?: ReactNode;
  className?: string;
};

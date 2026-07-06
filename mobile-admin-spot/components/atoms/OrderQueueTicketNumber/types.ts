import { Typography } from "@/components/atoms/Typography";
import type { ComponentProps } from "react";

export type OrderQueueTicketNumberProps = {
  orderNumber: number | null;
  accessibilityRole?: ComponentProps<typeof Typography>["accessibilityRole"];
} & Omit<ComponentProps<typeof Typography>, "accessibilityRole" | "children" | "variant">;

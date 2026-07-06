import { Typography } from "@/components/atoms/Typography";
import React from "react";

import type { OrderQueueTicketNumberProps } from "./types";

export const OrderQueueTicketNumber = ({
  orderNumber,
  className,
  accessibilityRole = "text",
  ...rest
}: OrderQueueTicketNumberProps) => {
  if (orderNumber == null) {
    return (
      <Typography
        variant="text-34-regular-44"
        accessibilityRole={accessibilityRole}
        className={className}
        {...rest}
      >
        —
      </Typography>
    );
  }

  return (
    <Typography
      variant="text-34-black-44"
      accessibilityRole={accessibilityRole}
      className={className}
      {...rest}
    >
      #{orderNumber}
    </Typography>
  );
};

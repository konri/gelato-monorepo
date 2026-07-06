import { useOrderQueueTabEnabled } from "@/hooks/useOrderQueueTabEnabled";
import { useQrTabEnabled } from "@/hooks/useQrTabEnabled";
import { useMemo } from "react";

export const useNativeTabsHiddenRoutes = (): Readonly<
  Partial<Record<string, true>>
> => {
  const qrTabEnabled = useQrTabEnabled();
  const orderQueueTabEnabled = useOrderQueueTabEnabled();

  return useMemo(() => {
    const next: Partial<Record<string, true>> = {};

    if (!qrTabEnabled) {
      next.qr = true;
    }
    if (!orderQueueTabEnabled) {
      next["order-queue"] = true;
    }

    return next;
  }, [orderQueueTabEnabled, qrTabEnabled]);
};

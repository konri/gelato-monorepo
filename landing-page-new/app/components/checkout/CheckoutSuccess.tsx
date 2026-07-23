"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "../../i18n/I18nProvider";

export function CheckoutSuccess() {
  const { t } = useI18n();
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const isCash = params.get("cash") === "1";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-pistachio/20 text-5xl">
        🎉
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-espresso">
        {t("checkout.success_title")}
      </h1>
      <p className="mt-3 text-espresso/70">
        {isCash ? t("checkout.success_pickup_cash") : t("checkout.success_message")}
      </p>
      {orderNumber && (
        <p className="mt-3 font-bold text-berry">
          {t("checkout.order_number", { number: orderNumber })}
        </p>
      )}
      <div className="mt-10 flex w-full flex-col gap-3">
        <Link
          href="/account"
          className="rounded-full bg-berry py-3.5 font-semibold text-white shadow-lg shadow-berry/25"
        >
          {t("checkout.view_orders")}
        </Link>
        <Link href="/spots" className="py-2 font-semibold text-espresso/60">
          {t("checkout.browse_spots")}
        </Link>
      </div>
    </main>
  );
}

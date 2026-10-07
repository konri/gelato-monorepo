"use client";

import { useI18n } from "../../i18n/I18nProvider";
import { REWARD_EXAMPLES, type RewardId } from "./RewardIllustrations";

/**
 * Example reward tiles (brief §5.3). Names come from `rewards.items.<id>` and
 * group titles from `rewards.group_menu` / `rewards.group_merch` in
 * `common.json`, so the grid works on the landing and on `/for-business`.
 *
 * - `landing`: two groups (treats first, then merch), each an h3 over a list.
 *   Four treats run 2 → 4 columns and six merch items 2 → 3, so no row is
 *   left with a single orphan tile.
 * - `compact`: one list, 2 → 3 → 6 columns, no headings.
 *
 * Illustrations are decorative; the visible name is the accessible label.
 */
type Props = {
  /** Limit and order the tiles. Defaults to every example. */
  ids?: RewardId[];
  variant?: "landing" | "compact";
};

export function RewardGrid({ ids, variant = "landing" }: Props) {
  const { t } = useI18n();

  const items = ids
    ? ids
        .map((id) => REWARD_EXAMPLES.find((r) => r.id === id))
        .filter((r): r is (typeof REWARD_EXAMPLES)[number] => Boolean(r))
    : REWARD_EXAMPLES;

  if (variant === "compact") {
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(({ id, Illustration }) => (
          <li
            key={id}
            className="flex flex-col items-center rounded-3xl border border-berry/10 bg-white p-4 text-center"
          >
            <Illustration className="h-20 w-20" />
            <span className="mt-2 text-sm font-semibold text-espresso">{t(`rewards.items.${id}`)}</span>
          </li>
        ))}
      </ul>
    );
  }

  const groups = [
    {
      key: "treat",
      title: t("rewards.group_menu"),
      items: items.filter((r) => r.kind === "treat"),
      cols: "grid-cols-2 lg:grid-cols-4",
    },
    {
      key: "merch",
      title: t("rewards.group_merch"),
      items: items.filter((r) => r.kind === "merch"),
      cols: "grid-cols-2 sm:grid-cols-3",
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="flex items-center gap-3 text-lg font-bold text-espresso">
            <span className="h-2 w-2 rounded-full bg-berry" aria-hidden />
            {g.title}
          </h3>
          <ul className={`mt-4 grid gap-4 sm:gap-5 ${g.cols}`}>
            {g.items.map(({ id, Illustration }) => (
              <li
                key={id}
                className="rounded-3xl border border-berry/10 bg-white p-4 text-center shadow-sm transition-transform duration-300 motion-safe:hover:-translate-y-1 sm:p-5"
              >
                <Illustration className="mx-auto h-24 w-24 sm:h-32 sm:w-32 lg:h-36 lg:w-36" />
                <span className="mt-3 block text-sm font-bold leading-snug text-espresso sm:text-base">
                  {t(`rewards.items.${id}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

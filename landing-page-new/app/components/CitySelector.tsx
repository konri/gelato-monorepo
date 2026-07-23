"use client";

import type { City } from "../lib/types";
import { localizedCityName } from "../lib/spot-utils";
import { useI18n } from "../i18n/I18nProvider";

type Props = {
  cities: City[];
  selectedCityId: string | null;
  onSelect: (cityId: string | null) => void;
};

export function CitySelector({ cities, selectedCityId, onSelect }: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
          selectedCityId === null
            ? "bg-berry text-white shadow-lg shadow-berry/25"
            : "border border-berry/20 bg-white text-espresso hover:border-berry/50"
        }`}
      >
        {t("spots.all_cities")}
      </button>
      {cities.map((city) => (
        <button
          key={city.id}
          type="button"
          onClick={() => onSelect(city.id)}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
            selectedCityId === city.id
              ? "bg-berry text-white shadow-lg shadow-berry/25"
              : "border border-berry/20 bg-white text-espresso hover:border-berry/50"
          }`}
        >
          {localizedCityName(city, locale)}
        </button>
      ))}
    </div>
  );
}

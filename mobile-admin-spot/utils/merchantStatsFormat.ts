export const formatShortDate = (iso: string, locale: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(d);
};

export const formatShortDateTime = (iso: string, locale: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(locale.length > 0 ? locale : undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
};

export const formatInteger = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

export const formatCompactInt = (value: number, locale: string): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatInteger(value, locale);
};

export const formatPercent = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

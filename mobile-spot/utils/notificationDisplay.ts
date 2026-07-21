import type { TFunction } from 'i18next';
import type { SpotNotification } from '@repo/api-client';

// The backend stores notification title/body in English. We re-render them
// from `type` + `data` so the spot staff sees them in their chosen language.
// Falls back to the stored (English) strings for unknown types.

const KNOWN_INCIDENT_TYPES = [
  'bike_broken',
  'address_not_found',
  'customer_unreachable',
  'other',
];

// Localized label for a courier incident slug (e.g. "address_not_found").
export function incidentLabel(t: TFunction, incidentType?: string | null): string {
  if (!incidentType) return t('SpotNotif.incidentType.other');
  if (KNOWN_INCIDENT_TYPES.includes(incidentType)) {
    return t(`SpotNotif.incidentType.${incidentType}`);
  }
  // Unknown slug: humanize it (address_not_found → "Address not found") so we
  // never show a raw slug to staff.
  return incidentType
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export type LocalizedNotification = { title: string; body: string };

// Localized title + body for a spot notification, by type.
export function localizeNotification(
  t: TFunction,
  n: Pick<SpotNotification, 'type' | 'title' | 'body' | 'data'>,
): LocalizedNotification {
  const data = n.data ?? {};
  const number = (data.orderNumber as string | undefined) ?? '';

  if (n.type === 'DELIVERY_INCIDENT') {
    const reason = incidentLabel(t, data.incidentType as string | undefined);
    const note = (data.note as string | undefined)?.trim();
    return {
      title: t('SpotNotif.incident.title', { number }),
      body: note
        ? t('SpotNotif.incident.bodyWithNote', { reason, note })
        : t('SpotNotif.incident.body', { reason }),
    };
  }

  if (n.type === 'order') {
    return {
      title: t('SpotNotif.order.title'),
      body: t('SpotNotif.order.body', { number }),
    };
  }

  // Unknown type — show whatever the server stored.
  return { title: n.title, body: n.body };
}

import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { CREATE_CITY, type City } from '../graphql/spots';
import { fetchPlacePredictions, geocodePlaceId, placesConfigured, type PlacePrediction } from '../lib/places';
import { defaultTimeZoneForCountry, europeTimeZones } from '../lib/constants';
import { errorText } from '../lib/errors';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { Field, Input, Select } from './ui/Field';

/**
 * Adds a city (PLATFORM only) with its time zone (BRANDS_SPEC §3.3). Brand
 * promotions and reports run on the city's local time.
 */
export function CreateCityModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (city: City) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [createCity, { loading }] = useMutation<{ createCity: City }>(CREATE_CITY);
  const zones = useMemo(() => europeTimeZones(), []);
  const [form, setForm] = useState({
    name: '',
    pl: '',
    en: '',
    ua: '',
    latitude: '',
    longitude: '',
    country: 'Poland',
    timezone: defaultTimeZoneForCountry('Poland'),
  });
  const [timezoneTouched, setTimezoneTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [namePredictions, setNamePredictions] = useState<PlacePrediction[]>([]);
  const [coordsResolved, setCoordsResolved] = useState(false);
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const country = e.target.value;
    setForm((f) => ({
      ...f,
      country,
      // Follow the country until the zone is picked by hand.
      timezone: timezoneTouched ? f.timezone : defaultTimeZoneForCountry(country),
    }));
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setForm((f) => ({ ...f, name: query }));
    setCoordsResolved(false);
    if (!placesConfigured) return;
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(async () => {
      setNamePredictions(await fetchPlacePredictions(query, '(cities)'));
    }, 350);
  };

  const pickNamePrediction = useCallback(async (p: PlacePrediction) => {
    setNamePredictions([]);
    const cityName = p.description.split(',')[0]?.trim() || p.description;
    setForm((f) => ({ ...f, name: cityName }));
    const place = await geocodePlaceId(p.placeId);
    if (!place) return;
    setForm((f) => ({ ...f, latitude: String(place.latitude), longitude: String(place.longitude) }));
    setCoordsResolved(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const latitude = parseFloat(form.latitude);
    const longitude = parseFloat(form.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError(t('City.coordsRequired'));
      return;
    }
    setBusy(true);
    try {
      const res = await createCity({
        variables: {
          name: form.name.trim(),
          latitude,
          longitude,
          nameLocal: {
            pl: form.pl.trim() || form.name.trim(),
            en: form.en.trim() || form.name.trim(),
            ua: form.ua.trim() || form.name.trim(),
          },
          country: form.country.trim() || 'Poland',
          timezone: form.timezone,
        },
      });
      const city = res.data?.createCity;
      if (city) await onCreated(city);
    } catch (err) {
      setError(errorText(err, t('City.failedCreate')));
    } finally {
      setBusy(false);
    }
  };

  const working = loading || busy;

  return (
    <Modal title={t('City.addCity')} onClose={onClose} busy={working}>
      {error && <Alert tone="error" className="mb-3">{error}</Alert>}
      <form id="create-city-form" onSubmit={submit} className="space-y-3">
        <Field label={t('City.nameCanonical')}>
          {(id) => (
            <div className="relative">
              <Input id={id} value={form.name} onChange={onNameChange} autoComplete="off" required />
              {namePredictions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {namePredictions.map((p) => (
                    <li key={p.placeId}>
                      <button
                        type="button"
                        onClick={() => void pickNamePrediction(p)}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        {p.description}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {coordsResolved && (
                <p className="mt-1 text-xs text-green-600">{t('CreateSpot.coordsFromAddress')}</p>
              )}
            </div>
          )}
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="PL">{(id) => <Input id={id} value={form.pl} onChange={set('pl')} />}</Field>
          <Field label="EN">{(id) => <Input id={id} value={form.en} onChange={set('en')} />}</Field>
          <Field label="UA">{(id) => <Input id={id} value={form.ua} onChange={set('ua')} />}</Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Common.latitude')}>
            {(id) => (
              <Input id={id} type="number" step="any" value={form.latitude} onChange={set('latitude')} required />
            )}
          </Field>
          <Field label={t('Common.longitude')}>
            {(id) => (
              <Input id={id} type="number" step="any" value={form.longitude} onChange={set('longitude')} required />
            )}
          </Field>
        </div>
        <Field label={t('City.country')}>
          {(id) => <Input id={id} value={form.country} onChange={onCountryChange} />}
        </Field>
        <Field label={t('City.timezone')} hint={t('City.timezoneHint')}>
          {(id) => (
            <Select
              id={id}
              value={form.timezone}
              onChange={(e) => {
                setTimezoneTouched(true);
                set('timezone')(e);
              }}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </form>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={working}>
          {t('Common.cancel')}
        </Button>
        <Button
          type="submit"
          form="create-city-form"
          className="flex-1"
          loading={working}
          loadingText={t('City.adding')}
        >
          {t('City.addCity')}
        </Button>
      </div>
    </Modal>
  );
}

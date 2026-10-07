import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../../brand/BrandScope';
import { SET_BRAND_CITIES, type BrandAdminView } from '../../graphql/brands';
import { CITIES, type AdminSpot, type City } from '../../graphql/spots';
import { errorCode, errorInfo, errorText } from '../../lib/errors';
import { cityName } from '../../lib/format';
import { ChipMultiSelect } from '../ChipMultiSelect';
import { CreateCityModal } from '../CreateCityModal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

/**
 * The cities the brand works in (BRANDS_SPEC §3.3). A spot's city must be one
 * of them, so cities with spots are locked (CITY_IN_USE). New cities are
 * added by Loodly (PLATFORM).
 */
export function BrandCitiesCard({ spots }: { spots: AdminSpot[] }) {
  const { t } = useTranslation();
  const { brand, brandId, isPlatform } = useBrandScope();
  const { data, refetch } = useQuery<{ cities: City[] }>(CITIES);
  const [setCities, { loading }] = useMutation<{ setBrandCities: BrandAdminView }>(SET_BRAND_CITIES);

  const [selected, setSelected] = useState<string[]>(brand.cityIds);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const inUse = useMemo(() => new Set(spots.map((s) => s.cityId)), [spots]);
  const options = useMemo(() => {
    // Every active city, plus the brand's own (an inactive one stays visible).
    const byId = new Map<string, City>();
    for (const c of data?.cities ?? []) byId.set(c.id, c);
    for (const c of brand.cities) if (!byId.has(c.id)) byId.set(c.id, c);
    return [...byId.values()]
      .sort((a, b) => cityName(a).localeCompare(cityName(b)))
      .map((c) => ({
        id: c.id,
        label: cityName(c),
        locked: inUse.has(c.id),
        lockedHint: t('BrandProfile.cityLocked'),
      }));
  }, [data, brand.cities, inUse, t]);

  const current = new Set(brand.cityIds);
  const dirty = selected.length !== current.size || selected.some((id) => !current.has(id));

  const save = async () => {
    setError(null);
    setNotice(null);
    if (selected.length === 0) {
      setError(t('BrandForm.citiesRequired'));
      return;
    }
    try {
      await setCities({ variables: { brandId, cityIds: selected } });
      setNotice(t('BrandProfile.citiesSaved'));
    } catch (err) {
      if (errorCode(err) === 'CITY_IN_USE') {
        const ids = errorInfo(err).extensions.cityIds;
        if (Array.isArray(ids)) setSelected((s) => [...new Set([...s, ...ids.map(String)])]);
      }
      setError(errorText(err));
    }
  };

  return (
    <Card
      title={t('BrandProfile.cities')}
      description={t('BrandProfile.citiesHint')}
      actions={
        isPlatform ? (
          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            className="text-xs font-semibold text-brand hover:underline"
          >
            {t('CreateSpot.addCity')}
          </button>
        ) : undefined
      }
    >
      <div id="cities" className="space-y-4">
        <ChipMultiSelect
          options={options}
          value={selected}
          onChange={(next) => {
            setSelected(next);
            setNotice(null);
          }}
          disabled={loading}
        />
        {inUse.size > 0 && <p className="text-xs text-gray-500">🔒 {t('BrandProfile.cityLocked')}</p>}
        {!isPlatform && <p className="text-xs text-gray-500">{t('BrandProfile.cityMissing')}</p>}
        {error && <Alert tone="error">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        <div className="flex gap-2">
          <Button onClick={() => void save()} disabled={!dirty} loading={loading} loadingText={t('Common.saving')}>
            {t('BrandProfile.saveCities')}
          </Button>
          {dirty && (
            <Button variant="secondary" onClick={() => setSelected(brand.cityIds)} disabled={loading}>
              {t('Common.discard')}
            </Button>
          )}
        </div>
      </div>
      {cityModalOpen && (
        <CreateCityModal
          onClose={() => setCityModalOpen(false)}
          onCreated={async (city) => {
            await refetch();
            setSelected((s) => (s.includes(city.id) ? s : [...s, city.id]));
            setCityModalOpen(false);
          }}
        />
      )}
    </Card>
  );
}

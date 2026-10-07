import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../brand/BrandScope';
import { CREATE_SPOT, type AdminSpot, type City } from '../graphql/spots';
import { SET_BRAND_CITIES } from '../graphql/brands';
import { evictRoot } from '../lib/cachePolicies';
import { errorCode, errorField, errorText } from '../lib/errors';
import { cityName } from '../lib/format';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { CreateCityModal } from '../components/CreateCityModal';
import { Card, PageHeader } from '../components/ui/Card';
import { Button, ButtonLink } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';
import { EmptyState } from '../components/ui/EmptyState';

type Errors = Partial<Record<'name' | 'cityId' | 'address' | 'coords' | 'phone' | 'radius' | 'threshold', string>>;

/**
 * New spot of the brand, created as a draft with a server-generated id
 * (BRANDS_SPEC §3.3). Only the brand's cities can be chosen; PLATFORM can add
 * a city (it joins the brand's list).
 */
export function CreateSpotPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { brand, brandId, brandActive, isPlatform, quota, totalCap, paths } = useBrandScope();
  const [createSpot, { loading }] = useMutation<{ createSpot: AdminSpot }>(CREATE_SPOT, {
    update: (cache) => evictRoot(cache, ['brandSpots', 'myAdminSpots']),
    refetchQueries: ['AdminBrand'],
  });
  const [setBrandCities] = useMutation(SET_BRAND_CITIES);

  const cities = useMemo(
    () =>
      brand.cities
        .filter((c) => c.isActive !== false)
        .sort((a, b) => cityName(a).localeCompare(cityName(b))),
    [brand.cities],
  );

  const [form, setForm] = useState({
    name: '',
    cityId: cities.length === 1 ? cities[0].id : '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    description: '',
    deliveryRadiusKm: '5',
    freeDeliveryThreshold: '',
  });
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminSpot | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const atTotalCap = quota.totalSpots >= totalCap;
  const blocked = !brandActive
    ? t('Spots.createBlockedInactive')
    : atTotalCap
      ? t('Errors.SPOT_LIMIT_TOTAL', { total: totalCap })
      : cities.length === 0 && !isPlatform
        ? t('CreateSpot.noCities')
        : null;

  const validate = (): Errors => {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = t('CreateSpot.required');
    if (!form.cityId) errs.cityId = t('CreateSpot.required');
    if (!form.address.trim()) errs.address = t('CreateSpot.required');
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      errs.coords = t('CreateSpot.coordsRequired');
    }
    if (!form.phone.trim()) errs.phone = t('CreateSpot.required');
    if (deliveryEnabled) {
      const r = parseFloat(form.deliveryRadiusKm);
      if (!Number.isFinite(r) || r < 0 || r > 100) errs.radius = t('CreateSpot.radiusRule');
      if (form.freeDeliveryThreshold.trim() !== '') {
        const th = parseFloat(form.freeDeliveryThreshold);
        if (!Number.isFinite(th) || th < 0) errs.threshold = t('CreateSpot.thresholdRule');
      }
    }
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      const res = await createSpot({
        variables: {
          brandId,
          name: form.name.trim(),
          address: form.address.trim(),
          cityId: form.cityId,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          phone: form.phone.trim(),
          description: form.description.trim() || null,
          deliveryEnabled,
          deliveryRadiusKm: deliveryEnabled ? parseFloat(form.deliveryRadiusKm) : 0,
          freeDeliveryThreshold:
            deliveryEnabled && form.freeDeliveryThreshold.trim() !== '' ? parseFloat(form.freeDeliveryThreshold) : null,
          pickupEnabled,
          onlinePaymentEnabled,
        },
      });
      if (res.data) setCreated(res.data.createSpot);
    } catch (err) {
      const field = errorField(err);
      if (errorCode(err) === 'CITY_NOT_IN_BRAND' || field === 'cityId') setErrors({ cityId: errorText(err) });
      else if (field === 'name' || field === 'address' || field === 'phone') setErrors({ [field]: errorText(err) });
      else if (field === 'latitude' || field === 'longitude') setErrors({ coords: errorText(err) });
      else setError(errorText(err, t('CreateSpot.failedCreate')));
    }
  };

  const back = (
    <Link to={paths.spots} className="text-sm text-gray-500 hover:text-brand">
      {t('Common.backToSpots')}
    </Link>
  );

  if (created) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6 sm:p-8">
        <PageHeader title={t('CreateSpot.title')} back={back} />
        <Card>
          <Alert tone="success" title={t('CreateSpot.createdTitle')}>
            {t('CreateSpot.created', { name: created.name })}
          </Alert>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink to={paths.editSpot(created.id)}>{t('CreateSpot.openSpot')}</ButtonLink>
            <ButtonLink to={paths.spots} variant="secondary">
              {t('Common.backToSpots')}
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6 sm:p-8">
        <PageHeader title={t('CreateSpot.title')} back={back} />
        <EmptyState
          title={t('CreateSpot.blockedTitle')}
          description={blocked}
          action={
            <ButtonLink to={cities.length === 0 ? `${paths.home}#cities` : paths.spots} variant="secondary">
              {cities.length === 0 ? t('CreateSpot.goToCities') : t('Common.backToSpots')}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6 sm:p-8">
      <PageHeader title={t('CreateSpot.title')} subtitle={t('CreateSpot.subtitle', { brand: brand.name })} back={back} />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <form onSubmit={submit} className="space-y-6" noValidate>
        <Card title={t('EditSpot.basics')}>
          <div className="space-y-4">
            <Field label={t('Common.name')} error={errors.name}>
              {(id, invalid) => <Input id={id} invalid={invalid} value={form.name} onChange={set('name')} maxLength={100} />}
            </Field>
            <Field
              label={t('CreateSpot.city')}
              error={errors.cityId}
              hint={t('CreateSpot.cityHint')}
              action={
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
              {(id, invalid) => (
                <Select id={id} invalid={invalid} value={form.cityId} onChange={set('cityId')}>
                  <option value="">{t('CreateSpot.selectCity')}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {cityName(c)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('Common.address')} error={errors.address}>
              {(id, invalid) => (
                <AddressAutocomplete
                  id={id}
                  invalid={invalid}
                  value={form.address}
                  onChange={(address) => setForm((f) => ({ ...f, address }))}
                  onResolved={(place) =>
                    setForm((f) => ({
                      ...f,
                      address: place.address || f.address,
                      latitude: String(place.latitude),
                      longitude: String(place.longitude),
                    }))
                  }
                />
              )}
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('Common.latitude')} error={errors.coords}>
                {(id, invalid) => (
                  <Input id={id} invalid={invalid} type="number" step="any" value={form.latitude} onChange={set('latitude')} />
                )}
              </Field>
              <Field label={t('Common.longitude')}>
                {(id) => <Input id={id} type="number" step="any" value={form.longitude} onChange={set('longitude')} />}
              </Field>
            </div>
            <Field label={t('Common.phone')} error={errors.phone}>
              {(id, invalid) => (
                <Input id={id} invalid={invalid} type="tel" value={form.phone} onChange={set('phone')} maxLength={40} />
              )}
            </Field>
            <Field label={t('CreateSpot.descriptionOptional')}>
              {(id) => <Textarea id={id} rows={3} value={form.description} onChange={set('description')} maxLength={2000} />}
            </Field>
          </div>
        </Card>

        <Card title={t('EditSpot.ordering')} description={t('EditSpot.orderingHint')}>
          <div className="space-y-3">
            <Toggle checked={deliveryEnabled} onChange={setDeliveryEnabled} label={t('CreateSpot.canDeliver')} />
            {deliveryEnabled && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('CreateSpot.deliveryRadius')} error={errors.radius}>
                  {(id, invalid) => (
                    <Input
                      id={id}
                      invalid={invalid}
                      type="number"
                      step="any"
                      min={0}
                      max={100}
                      value={form.deliveryRadiusKm}
                      onChange={set('deliveryRadiusKm')}
                    />
                  )}
                </Field>
                <Field label={t('EditSpot.freeDeliveryThreshold')} error={errors.threshold} hint={t('EditSpot.freeDeliveryHint')}>
                  {(id, invalid) => (
                    <Input
                      id={id}
                      invalid={invalid}
                      type="number"
                      step="any"
                      min={0}
                      value={form.freeDeliveryThreshold}
                      onChange={set('freeDeliveryThreshold')}
                    />
                  )}
                </Field>
              </div>
            )}
            <Toggle
              checked={pickupEnabled}
              onChange={setPickupEnabled}
              label={t('EditSpot.pickup')}
              description={t('EditSpot.pickupHint')}
            />
            <Toggle
              checked={onlinePaymentEnabled}
              onChange={setOnlinePaymentEnabled}
              label={t('EditSpot.onlinePayment')}
              description={t('EditSpot.onlinePaymentHint')}
            />
          </div>
        </Card>

        <Alert tone="info">{t('CreateSpot.draftNote')}</Alert>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(paths.spots)} disabled={loading}>
            {t('Common.cancel')}
          </Button>
          <Button type="submit" loading={loading} loadingText={t('Common.creating')}>
            {t('CreateSpot.createSpot')}
          </Button>
        </div>
      </form>

      {cityModalOpen && (
        <CreateCityModal
          onClose={() => setCityModalOpen(false)}
          onCreated={async (city: City) => {
            // A new city joins the brand's list before a spot can use it.
            try {
              await setBrandCities({ variables: { brandId, cityIds: [...new Set([...brand.cityIds, city.id])] } });
              setForm((f) => ({ ...f, cityId: city.id }));
            } catch (err) {
              setError(errorText(err));
            }
            setCityModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

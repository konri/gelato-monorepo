import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../brand/BrandScope';
import { brandPaths } from '../brand/paths';
import {
  DELETE_SPOT,
  SET_SPOT_ACTIVE,
  SPOT_DETAIL,
  UPDATE_SPOT,
  spotStatus,
  type AdminSpot,
} from '../graphql/spots';
import { ADMIN_BRANDS, MOVE_SPOT_TO_BRAND, type BrandAdminView } from '../graphql/brands';
import { BRAND_STAFF, type StaffMember } from '../graphql/staff';
import { evictRoot, mountedQueries } from '../lib/cachePolicies';
import { errorCode, errorField, errorText } from '../lib/errors';
import { cityName } from '../lib/format';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { ActivationChecklist } from '../components/ActivationChecklist';
import { QuotaMeter } from '../components/QuotaMeter';
import { Card, PageHeader } from '../components/ui/Card';
import { Button, ButtonLink } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';

const STATUS_TONE: Record<string, BadgeTone> = { ACTIVE: 'green', DRAFT: 'blue', INACTIVE: 'gray' };

/**
 * One spot in the console (BRANDS_SPEC §3.3): basics (crucial fields need the
 * brand admin or Loodly), ordering options, status (activation through the
 * plan's limit), the staff at the spot and, for PLATFORM, move / delete.
 * Only changed fields are sent.
 */
export function EditSpotPage() {
  const { t } = useTranslation();
  const { spotId = '' } = useParams<{ spotId: string }>();
  const { brandId, paths, isPlatform } = useBrandScope();
  const { data, loading, error, refetch } = useQuery<{ spot: AdminSpot | null }>(SPOT_DETAIL, {
    variables: { id: spotId },
    fetchPolicy: 'cache-and-network',
  });
  const spot = data?.spot ?? null;
  const back = (
    <Link to={paths.spots} className="text-sm text-gray-500 hover:text-brand">
      {t('Common.backToSpots')}
    </Link>
  );

  if (loading && !data) return <FullPageSpinner inline />;
  if (error && !data) {
    return (
      <div className="mx-auto max-w-2xl p-6 sm:p-8">
        <Alert
          tone="error"
          action={
            <Button size="sm" variant="secondary" onClick={() => void refetch()}>
              {t('Common.retry')}
            </Button>
          }
        >
          {errorText(error)}
        </Alert>
      </div>
    );
  }
  if (!spot || spot.brandId !== brandId) {
    return (
      <div className="mx-auto max-w-2xl p-6 sm:p-8">
        <EmptyState
          title={t('EditSpot.spotNotFound')}
          description={spot && isPlatform ? t('EditSpot.otherBrand', { brand: spot.brand.name }) : undefined}
          action={
            spot && isPlatform ? (
              <ButtonLink to={brandPaths('param', spot.brandId).editSpot(spot.id)} variant="secondary">
                {t('EditSpot.openInBrand', { brand: spot.brand.name })}
              </ButtonLink>
            ) : (
              <ButtonLink to={paths.spots} variant="secondary">
                {t('Common.backToSpots')}
              </ButtonLink>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 sm:p-8">
      <PageHeader
        title={spot.name}
        subtitle={`${cityName(spot.city)} · ${spot.address}`}
        back={back}
        actions={<Badge tone={STATUS_TONE[spotStatus(spot)]}>{t(`Spots.status_${spotStatus(spot)}`)}</Badge>}
      />
      <SpotForm key={spot.id} spot={spot} />
      <StatusCard spot={spot} />
      <SpotStaffCard spot={spot} />
      {isPlatform && <PlatformSpotZone spot={spot} />}
    </div>
  );
}

type FormState = {
  name: string;
  cityId: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  description: string;
  deliveryEnabled: boolean;
  deliveryRadiusKm: string;
  deliveryFee: string;
  freeDeliveryThreshold: string;
  pickupEnabled: boolean;
  onlinePaymentEnabled: boolean;
};

function formFrom(spot: AdminSpot): FormState {
  return {
    name: spot.name,
    cityId: spot.cityId,
    address: spot.address,
    latitude: String(spot.latitude),
    longitude: String(spot.longitude),
    phone: spot.phone ?? '',
    email: spot.email ?? '',
    description: spot.description ?? '',
    deliveryEnabled: spot.deliveryEnabled,
    deliveryRadiusKm: String(spot.deliveryRadiusKm),
    deliveryFee: String(spot.deliveryFee),
    freeDeliveryThreshold: spot.freeDeliveryThreshold == null ? '' : String(spot.freeDeliveryThreshold),
    pickupEnabled: spot.pickupEnabled,
    onlinePaymentEnabled: spot.onlinePaymentEnabled,
  };
}

const optionalText = (value: string) => value.trim() || null;
const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

/** UPDATE_SPOT variables for the fields that differ from the stored spot. */
function diffOf(spot: AdminSpot, f: FormState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (f.name.trim() !== spot.name) out.name = f.name.trim();
  if (f.cityId !== spot.cityId) out.cityId = f.cityId;
  if (f.address.trim() !== spot.address) out.address = f.address.trim();
  if (num(f.latitude) !== spot.latitude) out.latitude = num(f.latitude);
  if (num(f.longitude) !== spot.longitude) out.longitude = num(f.longitude);
  if (optionalText(f.phone) !== (spot.phone ?? null)) out.phone = f.phone.trim();
  if (optionalText(f.email) !== (spot.email ?? null)) out.email = f.email.trim();
  if (optionalText(f.description) !== (spot.description ?? null)) out.description = f.description.trim();
  if (f.deliveryEnabled !== spot.deliveryEnabled) out.deliveryEnabled = f.deliveryEnabled;
  if (num(f.deliveryRadiusKm) !== spot.deliveryRadiusKm) out.deliveryRadiusKm = num(f.deliveryRadiusKm);
  if (num(f.deliveryFee) !== spot.deliveryFee) out.deliveryFee = num(f.deliveryFee);
  const threshold = f.freeDeliveryThreshold.trim() === '' ? null : num(f.freeDeliveryThreshold);
  if (threshold !== (spot.freeDeliveryThreshold ?? null)) out.freeDeliveryThreshold = threshold;
  if (f.pickupEnabled !== spot.pickupEnabled) out.pickupEnabled = f.pickupEnabled;
  if (f.onlinePaymentEnabled !== spot.onlinePaymentEnabled) out.onlinePaymentEnabled = f.onlinePaymentEnabled;
  return out;
}

type FormErrors = Partial<Record<'name' | 'cityId' | 'address' | 'coords' | 'email' | 'radius' | 'fee' | 'threshold', string>>;

function SpotForm({ spot }: { spot: AdminSpot }) {
  const { t } = useTranslation();
  const { brand } = useBrandScope();
  const [form, setForm] = useState<FormState>(() => formFrom(spot));
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [updateSpot, { loading }] = useMutation<{ updateSpot: AdminSpot }>(UPDATE_SPOT);

  const cities = useMemo(() => {
    const list = brand.cities.filter((c) => c.isActive !== false || c.id === spot.cityId);
    return [...list].sort((a, b) => cityName(a).localeCompare(cityName(b)));
  }, [brand.cities, spot.cityId]);

  const diff = diffOf(spot, form);
  const dirty = Object.keys(diff).length > 0;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setNotice(null);
  };
  const onText = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(key, e.target.value as never);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = t('CreateSpot.required');
    if (!form.cityId) errs.cityId = t('CreateSpot.required');
    if (!form.address.trim()) errs.address = t('CreateSpot.required');
    const lat = num(form.latitude);
    const lng = num(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      errs.coords = t('CreateSpot.coordsRequired');
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = t('EditSpot.emailInvalid');
    const radius = num(form.deliveryRadiusKm);
    if (!Number.isFinite(radius) || radius < 0 || radius > 100) errs.radius = t('CreateSpot.radiusRule');
    const fee = num(form.deliveryFee);
    if (!Number.isFinite(fee) || fee < 0) errs.fee = t('CreateSpot.thresholdRule');
    if (form.freeDeliveryThreshold.trim() !== '') {
      const th = num(form.freeDeliveryThreshold);
      if (!Number.isFinite(th) || th < 0) errs.threshold = t('CreateSpot.thresholdRule');
    }
    return errs;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !dirty) return;
    try {
      await updateSpot({ variables: { id: spot.id, ...diff } });
      setNotice(t('EditSpot.spotUpdated'));
    } catch (err) {
      const field = errorField(err);
      if (errorCode(err) === 'CITY_NOT_IN_BRAND' || field === 'cityId') setErrors({ cityId: errorText(err) });
      else if (field === 'name' || field === 'address' || field === 'email') setErrors({ [field]: errorText(err) });
      else setError(errorText(err, t('EditSpot.failedUpdate')));
    }
  };

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <Card title={t('EditSpot.basics')} description={t('EditSpot.basicsHint')}>
        <div className="space-y-4">
          <Field label={t('Common.name')} error={errors.name}>
            {(id, invalid) => <Input id={id} invalid={invalid} value={form.name} onChange={onText('name')} maxLength={100} />}
          </Field>
          <Field
            label={t('CreateSpot.city')}
            error={errors.cityId}
            hint={form.cityId !== spot.cityId ? undefined : t('CreateSpot.cityHint')}
          >
            {(id, invalid) => (
              <Select id={id} invalid={invalid} value={form.cityId} onChange={onText('cityId')}>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {cityName(c)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {form.cityId !== spot.cityId && <Alert tone="warning">{t('EditSpot.cityChangeWarning')}</Alert>}
          <Field label={t('Common.address')} error={errors.address}>
            {(id, invalid) => (
              <AddressAutocomplete
                id={id}
                invalid={invalid}
                value={form.address}
                onChange={(address) => set('address', address)}
                onResolved={(place) => {
                  setForm((f) => ({
                    ...f,
                    address: place.address || f.address,
                    latitude: String(place.latitude),
                    longitude: String(place.longitude),
                  }));
                  setNotice(null);
                }}
              />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('Common.latitude')} error={errors.coords}>
              {(id, invalid) => (
                <Input id={id} invalid={invalid} type="number" step="any" value={form.latitude} onChange={onText('latitude')} />
              )}
            </Field>
            <Field label={t('Common.longitude')}>
              {(id) => <Input id={id} type="number" step="any" value={form.longitude} onChange={onText('longitude')} />}
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('Common.phone')}>
              {(id) => <Input id={id} type="tel" value={form.phone} onChange={onText('phone')} maxLength={40} />}
            </Field>
            <Field label={t('Common.email')} error={errors.email}>
              {(id, invalid) => (
                <Input id={id} invalid={invalid} type="email" value={form.email} onChange={onText('email')} maxLength={200} />
              )}
            </Field>
          </div>
          <Field label={t('Common.description')}>
            {(id) => <Textarea id={id} rows={3} value={form.description} onChange={onText('description')} maxLength={2000} />}
          </Field>
        </div>
      </Card>

      <Card title={t('EditSpot.ordering')} description={t('EditSpot.orderingHint')}>
        <div className="space-y-3">
          <Toggle checked={form.deliveryEnabled} onChange={(v) => set('deliveryEnabled', v)} label={t('CreateSpot.canDeliver')} />
          {form.deliveryEnabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('EditSpot.radius')} error={errors.radius}>
                {(id, invalid) => (
                  <Input id={id} invalid={invalid} type="number" step="any" min={0} max={100} value={form.deliveryRadiusKm} onChange={onText('deliveryRadiusKm')} />
                )}
              </Field>
              <Field label={t('EditSpot.deliveryFee')} error={errors.fee}>
                {(id, invalid) => (
                  <Input id={id} invalid={invalid} type="number" step="any" min={0} value={form.deliveryFee} onChange={onText('deliveryFee')} />
                )}
              </Field>
              <Field label={t('EditSpot.freeDeliveryThreshold')} error={errors.threshold} hint={t('EditSpot.freeDeliveryHint')}>
                {(id, invalid) => (
                  <Input id={id} invalid={invalid} type="number" step="any" min={0} value={form.freeDeliveryThreshold} onChange={onText('freeDeliveryThreshold')} />
                )}
              </Field>
            </div>
          )}
          <Toggle
            checked={form.pickupEnabled}
            onChange={(v) => set('pickupEnabled', v)}
            label={t('EditSpot.pickup')}
            description={t('EditSpot.pickupHint')}
          />
          <Toggle
            checked={form.onlinePaymentEnabled}
            onChange={(v) => set('onlinePaymentEnabled', v)}
            label={t('EditSpot.onlinePayment')}
            description={t('EditSpot.onlinePaymentHint')}
          />
          <p className="text-xs text-gray-500">{t('EditSpot.spotAppNote')}</p>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      <div className="flex justify-end gap-3">
        {dirty && (
          <Button
            variant="secondary"
            onClick={() => {
              setForm(formFrom(spot));
              setErrors({});
            }}
            disabled={loading}
          >
            {t('Common.discard')}
          </Button>
        )}
        <Button type="submit" disabled={!dirty} loading={loading} loadingText={t('Common.saving')}>
          {t('EditSpot.saveChanges')}
        </Button>
      </div>
    </form>
  );
}

function StatusCard({ spot }: { spot: AdminSpot }) {
  const { t } = useTranslation();
  const { quota, brandActive } = useBrandScope();
  const [activating, setActivating] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useApolloClient();
  const [setActive, { loading }] = useMutation(SET_SPOT_ACTIVE, {
    refetchQueries: () => mountedQueries(client, ['AdminBrand', 'AdminBrands']),
  });
  const status = spotStatus(spot);
  const atLimit = quota.activeSpots >= quota.maxSpots;

  return (
    <Card title={t('EditSpot.status')} description={t(`EditSpot.statusHint_${status}`)}>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <QuotaMeter quota={quota} compact />
        {spot.isActive ? (
          <Button
            variant="secondary"
            onClick={() => {
              setError(null);
              setConfirmOff(true);
            }}
          >
            {t('Spots.deactivate')}
          </Button>
        ) : (
          <Button onClick={() => setActivating(true)} disabled={!brandActive || atLimit}>
            {t('Spots.activate')}
          </Button>
        )}
      </div>
      {!spot.isActive && brandActive && atLimit && (
        <Alert tone="warning" className="mt-3">
          {t('Quota.limitReachedLong', { max: quota.maxSpots })}
        </Alert>
      )}
      {activating && <ActivationChecklist spot={spot} onClose={() => setActivating(false)} />}
      {confirmOff && (
        <ConfirmDialog
          title={t('Spots.deactivateTitle', { name: spot.name })}
          body={t('Spots.deactivateBody')}
          confirmLabel={t('Spots.deactivate')}
          tone="danger"
          busy={loading}
          error={error}
          onCancel={() => setConfirmOff(false)}
          onConfirm={async () => {
            setError(null);
            try {
              await setActive({ variables: { spotId: spot.id, isActive: false } });
              setConfirmOff(false);
            } catch (err) {
              setError(errorText(err));
            }
          }}
        />
      )}
    </Card>
  );
}

function SpotStaffCard({ spot }: { spot: AdminSpot }) {
  const { t } = useTranslation();
  const { brandId, paths } = useBrandScope();
  const { data, loading, error } = useQuery<{ brandStaff: StaffMember[] }>(BRAND_STAFF, {
    variables: { brandId, spotId: spot.id },
    fetchPolicy: 'cache-and-network',
  });
  const staff = data?.brandStaff ?? [];

  return (
    <Card
      title={t('EditSpot.staffTitle')}
      description={t('EditSpot.staffHint')}
      actions={
        <>
          <ButtonLink size="sm" variant="secondary" to={paths.staffFor({ spotId: spot.id })}>
            {t('EditSpot.manageStaff')}
          </ButtonLink>
          <ButtonLink size="sm" to={paths.staffFor({ spotId: spot.id, invite: true })}>
            {t('EditSpot.inviteStaff')}
          </ButtonLink>
        </>
      }
    >
      {error && <Alert tone="error">{errorText(error)}</Alert>}
      {loading && !data ? (
        <p className="text-sm text-gray-500">{t('Common.loading')}</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-gray-500">{t('EditSpot.noStaff')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {staff.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{m.name || m.email}</p>
                <p className="truncate text-xs text-gray-500">{m.email}</p>
              </div>
              <Badge tone="gray">{m.kind ? t(`Roles.${m.kind}`) : m.role}</Badge>
              {m.loginDisabled ? (
                <Badge tone="red">{t('StaffStatus.disabled')}</Badge>
              ) : m.invitePending ? (
                <Badge tone="amber">{t('StaffStatus.pending')}</Badge>
              ) : (
                <Badge tone="green">{t('StaffStatus.active')}</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** PLATFORM only: move the spot to another brand, or delete it. */
function PlatformSpotZone({ spot }: { spot: AdminSpot }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { paths } = useBrandScope();
  const { data } = useQuery<{ adminBrands: BrandAdminView[] }>(ADMIN_BRANDS);
  const targets = (data?.adminBrands ?? [])
    .filter((b) => b.brand.id !== spot.brandId)
    .sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  const [targetId, setTargetId] = useState('');
  const [confirmMove, setConfirmMove] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const evict = { update: (cache: Parameters<typeof evictRoot>[0]) => evictRoot(cache, ['brandSpots', 'myAdminSpots', 'brandStaff']) };
  const client = useApolloClient();
  const refetchBrands = { refetchQueries: () => mountedQueries(client, ['AdminBrand', 'AdminBrands']) };
  const [move, { loading: moving }] = useMutation(MOVE_SPOT_TO_BRAND, { ...evict, ...refetchBrands });
  const [remove, { loading: deleting }] = useMutation(DELETE_SPOT, { ...evict, ...refetchBrands });
  const target = targets.find((b) => b.brand.id === targetId) ?? null;
  const targetHasCity = !!target && target.brand.cityIds.includes(spot.cityId);

  const doMove = async () => {
    if (!target) return;
    setError(null);
    try {
      await move({ variables: { spotId: spot.id, brandId: target.brand.id } });
      navigate(brandPaths('param', target.brand.id).editSpot(spot.id), {
        replace: true,
        state: { notice: t('EditSpot.moved', { name: spot.name, brand: target.brand.name }) },
      });
    } catch (err) {
      setError(
        errorCode(err) === 'SPOT_HAS_OPEN_ORDERS' ? t('Errors.SPOT_HAS_OPEN_ORDERS') : errorText(err),
      );
    }
  };

  const doDelete = async () => {
    setError(null);
    try {
      await remove({ variables: { id: spot.id } });
      navigate(paths.spots, { replace: true, state: { notice: t('EditSpot.deleted', { name: spot.name }) } });
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Card tone="danger" title={t('EditSpot.platformZone')} description={t('EditSpot.platformZoneHint')}>
      <div className="space-y-5">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">{t('EditSpot.moveTitle')}</p>
          <p className="mb-2 text-xs text-gray-500">{t('EditSpot.moveHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="max-w-xs"
              aria-label={t('EditSpot.moveTarget')}
            >
              <option value="">{t('EditSpot.moveTarget')}</option>
              {targets.map((b) => (
                <option key={b.brand.id} value={b.brand.id}>
                  {b.brand.name}
                </option>
              ))}
            </Select>
            <Button
              variant="dangerOutline"
              disabled={!target || !targetHasCity}
              onClick={() => {
                setError(null);
                setConfirmMove(true);
              }}
            >
              {t('EditSpot.move')}
            </Button>
          </div>
          {target && !targetHasCity && (
            <p className="mt-1 text-xs text-amber-700">
              {t('EditSpot.moveNeedsCity', { brand: target.brand.name, city: cityName(spot.city) })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-red-100 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-700">{t('EditSpot.deleteTitle')}</p>
            <p className="text-xs text-gray-500">{t('EditSpot.deleteHint')}</p>
          </div>
          <Button
            variant="dangerOutline"
            onClick={() => {
              setTyped('');
              setError(null);
              setConfirmDelete(true);
            }}
          >
            {t('Common.delete')}
          </Button>
        </div>
      </div>

      {confirmMove && target && (
        <ConfirmDialog
          title={t('EditSpot.moveConfirmTitle', { name: spot.name, brand: target.brand.name })}
          body={t('EditSpot.moveConfirmBody')}
          confirmLabel={t('EditSpot.move')}
          tone="danger"
          busy={moving}
          error={error}
          onCancel={() => setConfirmMove(false)}
          onConfirm={() => void doMove()}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t('EditSpot.deleteConfirmTitle', { name: spot.name })}
          body={t('EditSpot.deleteConfirmBody')}
          confirmLabel={t('Common.delete')}
          tone="danger"
          busy={deleting}
          error={error}
          confirmDisabled={typed.trim() !== spot.name}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void doDelete()}
        >
          <Field className="mt-3" label={t('BrandDanger.typeName', { name: spot.name })}>
            {(id) => <Input id={id} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />}
          </Field>
        </ConfirmDialog>
      )}
    </Card>
  );
}

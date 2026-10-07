import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { withSpotScope } from '@/components/hoc/withSpotScope';
import { AccessGuard } from '@/components/molecules/AccessGuard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { SpotMultiSelect, type SpotOption } from '@/components/molecules/Staff/SpotMultiSelect';
import { StaffActionsSheet } from '@/components/molecules/Staff/StaffActionsSheet';
import { StaffMemberRow } from '@/components/molecules/Staff/StaffMemberRow';
import { atLeast } from '@/auth/levels';
import { canAssignSpots, canManageMember, creatableKinds, type StaffCaller } from '@/auth/staffRules';
import { spotCityName, useActiveSpot } from '@/hooks/useActiveSpot';
import { useRole } from '@/hooks/useRole';
import { spotStore, type StaffSpotVM } from '@/stores/spotStore';
import { downloadReport } from '@/services/downloadReport';
import { messageForError } from '@/utils/errorCodes';
import {
  getBrandStaff,
  getSpotStaffSessions,
  inviteStaff,
  setStaffLoginDisabled,
  type BrandStaffMember,
  type InviteStaffInput,
  type StaffKind,
  type StaffLoginSession,
} from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';

const inputCls = 'rounded-xl border border-gray-300 px-4 text-base';
const LANGUAGE: Record<string, InviteStaffInput['language']> = { pl: 'PL', en: 'EN', ua: 'UA' };

type Scope = 'spot' | 'brand';

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row rounded-xl bg-gray-100 p-1" accessibilityRole="tablist">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className="flex-1 items-center justify-center rounded-lg px-1"
            style={{ minHeight: 44, backgroundColor: active ? '#fff' : 'transparent' }}
          >
            <Typography variant="body-base-bold" style={{ color: active ? '#B91C1C' : '#4B5563' }} numberOfLines={1}>
              {o.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Team screen (BRANDS_SPEC §4.7). Spot admins add employees to one of their
 * spots; brand admins (and the Loodly team) also add spot admins with one or
 * more spots, and can look at the whole brand. Every member has a "…" menu
 * with the actions the caller may use. The server enforces the same rules.
 */
function StaffScreen() {
  const { t, i18n } = useTranslation();
  const { userId, level, staffKind } = useRole();
  const { activeSpotId: spotId, brandId, spots } = useActiveSpot();

  const brandSpots = useMemo(() => spots.filter((s) => s.brandId === brandId), [spots, brandId]);
  const toOption = useCallback(
    (s: StaffSpotVM): SpotOption => ({
      id: s.spotId,
      name: s.name,
      subtitle: spotCityName(s, i18n.language) ?? s.address,
      inactive: !s.isActive,
    }),
    [i18n.language],
  );
  const employeeSpots = useMemo(
    () => brandSpots.filter((s) => atLeast(s.level, 'MANAGE_SPOT')).map(toOption),
    [brandSpots, toOption],
  );
  const adminSpots = useMemo(
    () => brandSpots.filter((s) => atLeast(s.level, 'MANAGE_BRAND')).map(toOption),
    [brandSpots, toOption],
  );
  const caller: StaffCaller = useMemo(
    () => ({ userId, staffKind, level, managedSpotIds: new Set(employeeSpots.map((s) => s.id)) }),
    [userId, staffKind, level, employeeSpots],
  );
  const kinds = creatableKinds(caller);
  const brandWide = atLeast(level, 'MANAGE_BRAND');

  const [scope, setScope] = useState<Scope>('spot');
  const [staff, setStaff] = useState<BrandStaffMember[]>([]);
  const [sessions, setSessions] = useState<StaffLoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionsFor, setActionsFor] = useState<BrandStaffMember | null>(null);
  const loadReq = useRef(0);

  // Invite form: emailed invitation (they set their own password) or a
  // temporary password handed over in person.
  const [mode, setMode] = useState<'invite' | 'password'>('invite');
  const [kind, setKind] = useState<StaffKind>('EMPLOYEE');
  const [formSpotIds, setFormSpotIds] = useState<string[]>(spotId ? [spotId] : []);
  const [form, setForm] = useState({ email: '', name: '', password: '' });

  const formSpotOptions = kind === 'SPOT_ADMIN' ? adminSpots : employeeSpots;

  const load = useCallback(async () => {
    if (!spotId) {
      setLoading(false);
      return;
    }
    const req = ++loadReq.current;
    const [list, sess] = await Promise.all([
      getBrandStaff(scope === 'brand' && brandId ? { brandId } : { spotId }, { silent: true }),
      getSpotStaffSessions(spotId, { silent: true }),
    ]);
    // Stale guard: the spot or the list scope changed while loading.
    if (req !== loadReq.current || spotStore.getActiveSpotId() !== spotId) return;
    if (list.error) setError(messageForError(list.error, t('Staff.loadError')));
    setStaff(list.data ?? []);
    setSessions(sess.data ?? []);
    setLoading(false);
  }, [spotId, brandId, scope, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeKind = (next: StaffKind) => {
    setKind(next);
    const options = next === 'SPOT_ADMIN' ? adminSpots : employeeSpots;
    setFormSpotIds(spotId && options.some((o) => o.id === spotId) ? [spotId] : options[0] ? [options[0].id] : []);
  };

  const create = async () => {
    const email = form.email.trim();
    const name = form.name.trim();
    if (!email || !name) return;
    if (formSpotIds.length === 0) {
      setError(t('Staff.spotsRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    // A spot admin invited again as spot admin gets the new spots added.
    const existing = staff.find((m) => m.email.toLowerCase() === email.toLowerCase());
    const res = await inviteStaff(
      {
        email,
        name,
        kind,
        spotIds: kind === 'EMPLOYEE' ? formSpotIds.slice(0, 1) : formSpotIds,
        password: mode === 'password' ? form.password : undefined,
        language: LANGUAGE[i18n.language.toLowerCase()],
        // The Loodly team names the brand; brand staff never do.
        brandId: level === 'PLATFORM' && brandId ? brandId : undefined,
      },
      { silent: true },
    );
    if (spotStore.getActiveSpotId() !== spotId) return;
    setBusy(false);
    if (res.error || !res.data) {
      setError(messageForError(res.error, t('Staff.createError')));
      return;
    }
    setForm({ email: '', name: '', password: '' });
    setNotice(
      existing && existing.kind === 'SPOT_ADMIN' && kind === 'SPOT_ADMIN'
        ? t('Staff.spotsUpdated', { name: res.data.name?.trim() || res.data.email })
        : mode === 'invite'
          ? t('Staff.invited', { email: res.data.email })
          : t('Staff.created'),
    );
    await load();
  };

  const toggleLogin = async (member: BrandStaffMember) => {
    setBusy(true);
    setError(null);
    const res = await setStaffLoginDisabled(member.id, !member.loginDisabled, { silent: true });
    setBusy(false);
    if (res.error) {
      setError(messageForError(res.error, t('Staff.updateError')));
      return;
    }
    await load();
  };

  const exportSessions = async () => {
    if (!spotId) return;
    setExporting(true);
    try {
      await downloadReport(`sessions/${spotId}?includeSwitches=1`, `sessions-${spotId}.pdf`, i18n.language);
    } catch {
      setError(t('Staff.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const canCreate =
    kinds.length > 0 &&
    !!form.email.trim() &&
    !!form.name.trim() &&
    formSpotIds.length > 0 &&
    (mode === 'invite' || form.password.length >= 8) &&
    !busy;

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('Staff.title')} spotScoped />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <ResponsiveContainer maxWidth={680}>
          {notice && (
            <View className="mb-4 rounded-xl bg-green-50 px-4 py-3" accessibilityLiveRegion="polite">
              <Typography variant="body-base-semibold" style={{ color: '#15803D' }}>{notice}</Typography>
            </View>
          )}
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
              <Typography variant="body-base-semibold" style={{ color: '#B91C1C' }}>{error}</Typography>
            </View>
          )}

          {/* Add a team member */}
          {kinds.length > 0 && (
            <View className="mb-6 gap-3 rounded-2xl bg-white p-4">
              <Typography variant="body-lg-bold" className="text-text-primary" accessibilityRole="header">
                {t('Staff.addMember')}
              </Typography>

              {kinds.length > 1 && (
                <Segmented
                  value={kind}
                  onChange={changeKind}
                  options={kinds.map((k) => ({ value: k, label: t(`Roles.${k}`) }))}
                />
              )}

              {formSpotOptions.length > 1 && (
                <View>
                  <Typography variant="body-base-semibold" className="mb-1 text-text-primary">
                    {t(kind === 'SPOT_ADMIN' ? 'Staff.spotsLabel' : 'Staff.spotLabel')}
                  </Typography>
                  <Typography variant="body-small-regular" className="mb-2 text-gray-600">
                    {t(kind === 'SPOT_ADMIN' ? 'Staff.pickSpotsHint' : 'Staff.pickSpotHint')}
                  </Typography>
                  <SpotMultiSelect
                    options={formSpotOptions}
                    mode={kind === 'SPOT_ADMIN' ? 'multi' : 'single'}
                    selected={formSpotIds}
                    onChange={setFormSpotIds}
                    disabled={busy}
                  />
                </View>
              )}

              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'invite', label: t('Staff.modeInvite') },
                  { value: 'password', label: t('Staff.modePassword') },
                ]}
              />

              <TextInput
                className={inputCls}
                style={{ minHeight: 52 }}
                placeholder={t('Staff.name')}
                placeholderTextColor="#6B7280"
                accessibilityLabel={t('Staff.name')}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <TextInput
                className={inputCls}
                style={{ minHeight: 52 }}
                placeholder={t('Staff.email')}
                placeholderTextColor="#6B7280"
                accessibilityLabel={t('Staff.email')}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {mode === 'password' ? (
                <TextInput
                  className={inputCls}
                  style={{ minHeight: 52 }}
                  placeholder={t('Staff.tempPassword')}
                  placeholderTextColor="#6B7280"
                  accessibilityLabel={t('Staff.tempPassword')}
                  value={form.password}
                  onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                  autoCapitalize="none"
                />
              ) : (
                <Typography variant="body-small-regular" className="text-gray-600">
                  {t('Staff.inviteHint')}
                </Typography>
              )}
              <Pressable
                onPress={() => void create()}
                disabled={!canCreate}
                accessibilityRole="button"
                className="items-center justify-center rounded-xl"
                style={{ minHeight: 56, backgroundColor: canCreate ? '#EC2828' : '#F4A3A3' }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Typography variant="body-base-bold" className="text-white">
                    {t(mode === 'invite' ? 'Staff.sendInvite' : 'Staff.create')}
                  </Typography>
                )}
              </Pressable>
            </View>
          )}

          {/* Team */}
          <Typography variant="body-lg-bold" className="mb-2 text-text-primary" accessibilityRole="header">
            {t('Staff.team')}
          </Typography>
          {brandWide && brandSpots.length > 1 && (
            <View className="mb-3">
              <Segmented
                value={scope}
                onChange={(s) => {
                  setScope(s);
                  setLoading(true);
                }}
                options={[
                  { value: 'spot', label: t('Staff.scopeSpot') },
                  { value: 'brand', label: t('Staff.scopeBrand') },
                ]}
              />
            </View>
          )}
          {loading ? (
            <View className="items-center py-8"><ActivityIndicator color="#EC2828" /></View>
          ) : staff.length === 0 ? (
            <Typography variant="body-base-regular" className="text-gray-600">
              {t(scope === 'brand' ? 'Staff.noStaffBrand' : 'Staff.noStaff')}
            </Typography>
          ) : (
            staff.map((m) => {
              const manage = canManageMember(caller, m);
              const assign = canAssignSpots(caller, m);
              return (
                <StaffMemberRow
                  key={m.id}
                  member={m}
                  isSelf={m.id === userId}
                  showSpots={brandSpots.length > 1}
                  canToggleLogin={manage}
                  hasActions={manage || assign}
                  busy={busy}
                  onToggleLogin={() => void toggleLogin(m)}
                  onOpenActions={() => setActionsFor(m)}
                />
              );
            })
          )}

          {/* Sign-ins at this spot */}
          <View className="mb-2 mt-6 flex-row items-center justify-between">
            <Typography variant="body-lg-bold" className="text-text-primary" accessibilityRole="header">
              {t('Staff.sessions')}
            </Typography>
            <Pressable
              onPress={() => void exportSessions()}
              disabled={exporting}
              accessibilityRole="button"
              className="flex-row items-center rounded-full border border-gray-300 bg-white px-4"
              style={{ minHeight: 44 }}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#EC2828" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color="#B91C1C" />
                  <Typography variant="body-small-semibold" className="ml-1" style={{ color: '#B91C1C' }}>
                    {t('Staff.exportPdf')}
                  </Typography>
                </>
              )}
            </Pressable>
          </View>
          {loading ? null : sessions.length === 0 ? (
            <Typography variant="body-base-regular" className="text-gray-600">{t('Staff.noSessions')}</Typography>
          ) : (
            sessions.slice(0, 30).map((s) => (
              <View key={s.id} className="mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
                <View className="flex-1 pr-2">
                  <Typography variant="body-base-semibold" className="text-text-primary">{s.staffName}</Typography>
                  <Typography variant="body-small-regular" className="text-gray-600">
                    {t(`Roles.${s.role}`, { defaultValue: s.role })}
                    {' · '}
                    {t(s.event === 'SPOT_SWITCH' ? 'Staff.eventSwitched' : 'Staff.eventLogin')}
                    {s.ipAddress ? ` · ${s.ipAddress}` : ''}
                  </Typography>
                </View>
                <Typography variant="body-small-regular" className="text-gray-600">
                  {formatWhen(s.loginAt)}
                </Typography>
              </View>
            ))
          )}
        </ResponsiveContainer>
      </ScrollView>

      <StaffActionsSheet
        member={actionsFor}
        canManage={!!actionsFor && canManageMember(caller, actionsFor)}
        canAssign={!!actionsFor && canAssignSpots(caller, actionsFor)}
        employeeSpots={employeeSpots}
        adminSpots={adminSpots}
        onClose={() => setActionsFor(null)}
        onChanged={(message) => {
          setActionsFor(null);
          setError(null);
          setNotice(message);
          void load();
        }}
      />
    </View>
  );
}

function GuardedStaff() {
  return (
    <AccessGuard min="MANAGE_SPOT" messageKey="Staff.adminOnly">
      <StaffScreen />
    </AccessGuard>
  );
}

export default withSpotScope(GuardedStaff);

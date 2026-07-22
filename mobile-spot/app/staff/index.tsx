import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { useRole } from '@/hooks/useRole';
import { downloadReport } from '@/services/downloadReport';
import {
  getSpotStaffAdmins,
  getSpotStaffEmployees,
  getSpotStaffSessions,
  createSpotStaff,
  inviteSpotStaff,
  adminResetStaffPassword,
  setStaffLoginDisabled,
  type StaffMember,
  type StaffLoginSession,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const inputCls = 'rounded-xl border border-gray-300 px-4 py-3 text-base';

type StaffRow = StaffMember & { kind: 'admin' | 'employee' };

export default function StaffScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spotId, userId, isAdmin, loading: roleLoading } = useRole();

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [sessions, setSessions] = useState<StaffLoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create form. `mode` toggles between handing over a temp password and
  // emailing a set-password invite (branded with the spot's logo/details).
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'EMPLOYEE' as 'EMPLOYEE' | 'SPOT_ADMIN' });
  const [mode, setMode] = useState<'invite' | 'password'>('invite');

  const load = useCallback(async () => {
    if (!spotId) {
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const [admins, employees, sess] = await Promise.all([
      getSpotStaffAdmins(spotId, { token }),
      getSpotStaffEmployees(spotId, { token }),
      getSpotStaffSessions(spotId, { token }),
    ]);
    const rows: StaffRow[] = [
      ...(admins.data ?? []).map((a) => ({ ...a, kind: 'admin' as const })),
      ...(employees.data ?? []).map((e) => ({ ...e, kind: 'employee' as const })),
    ];
    setStaff(rows);
    setSessions(sess.data ?? []);
    setLoading(false);
  }, [spotId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!spotId || !form.email.trim() || !form.name.trim()) return;
    if (mode === 'password' && !form.password.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res =
        mode === 'invite'
          ? await inviteSpotStaff(
              { spotId, email: form.email.trim(), name: form.name.trim(), role: form.role },
              { token },
            )
          : await createSpotStaff(
              {
                spotId,
                email: form.email.trim(),
                name: form.name.trim(),
                password: form.password,
                role: form.role,
              },
              { token },
            );
      if (res.error || !res.data) throw new Error(res.error?.message || t('Staff.createError'));
      setForm({ email: '', name: '', password: '', role: 'EMPLOYEE' });
      setNotice(mode === 'invite' ? t('Staff.invited', { email: res.data.email }) : t('Staff.created'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Staff.createError'));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = (member: StaffRow) => {
    // Email the staff member a set-password code so THEY choose their own
    // password (same flow as the invite) — the admin never sets it directly.
    const doReset = async () => {
      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
        const res = await adminResetStaffPassword(member.id, { token });
        if (res.error) throw new Error(res.error.message);
        setNotice(t('Staff.passwordResetSent', { email: member.email }));
      } catch (e) {
        setError(e instanceof Error ? e.message : t('Staff.resetError'));
      } finally {
        setBusy(false);
      }
    };
    const title = t('Staff.resetPassword');
    const message = t('Staff.resetConfirm', { email: member.email });
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(`${title}\n\n${message}`)) void doReset();
    } else {
      Alert.alert(title, message, [
        { text: t('Staff.cancel'), style: 'cancel' },
        { text: t('Staff.resetSendCta'), onPress: () => void doReset() },
      ]);
    }
  };

  const toggleLogin = async (member: StaffRow) => {
    setBusy(true);
    setError(null);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res = await setStaffLoginDisabled(member.id, !member.loginDisabled, { token });
      if (res.error) throw new Error(res.error.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Staff.updateError'));
    } finally {
      setBusy(false);
    }
  };

  const exportSessions = async () => {
    if (!spotId) return;
    setExporting(true);
    try {
      await downloadReport(`sessions/${spotId}`, `sessions-${spotId}.pdf`, i18n.language);
    } catch {
      setError(t('Staff.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const timeAgo = useMemo(
    () => (iso: string) => {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    },
    [],
  );

  if (!roleLoading && !isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8" style={{ paddingTop: insets.top }}>
        <Ionicons name="lock-closed-outline" size={40} color="#9CA3AF" />
        <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
          {t('Staff.adminOnly')}
        </Typography>
        <Pressable onPress={() => goBackOr()} className="mt-5 rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
          <Typography variant="body-base-bold" className="text-white">{t('Staff.back')}</Typography>
        </Pressable>
      </View>
    );
  }

  const canCreate =
    !!form.email.trim() &&
    !!form.name.trim() &&
    (mode === 'invite' || form.password.length >= 8) &&
    !busy;

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('Staff.title')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ResponsiveContainer maxWidth={680}>
          {notice && (
            <View className="mb-4 rounded-xl bg-green-50 px-4 py-3">
              <Typography variant="body-small-regular" style={{ color: '#15803D' }}>{notice}</Typography>
            </View>
          )}
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>{error}</Typography>
            </View>
          )}

          {/* Create staff */}
          <View className="mb-6 rounded-2xl bg-white p-4">
            <Typography variant="body-base-bold" className="mb-3 text-text-primary">{t('Staff.addMember')}</Typography>

            {/* Invite by email vs. hand over a temporary password. */}
            <View className="mb-3 flex-row rounded-xl bg-gray-100 p-1">
              {(['invite', 'password'] as const).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    className="flex-1 items-center rounded-lg py-2"
                    style={{ backgroundColor: active ? '#fff' : 'transparent' }}
                  >
                    <Typography variant="body-small-bold" style={{ color: active ? '#EC2828' : '#6B7280' }}>
                      {t(m === 'invite' ? 'Staff.modeInvite' : 'Staff.modePassword')}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>

            <View className="mb-3 flex-row rounded-xl bg-gray-100 p-1">
              {(['EMPLOYEE', 'SPOT_ADMIN'] as const).map((r) => {
                const active = form.role === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setForm((f) => ({ ...f, role: r }))}
                    className="flex-1 items-center rounded-lg py-2"
                    style={{ backgroundColor: active ? '#fff' : 'transparent' }}
                  >
                    <Typography variant="body-small-bold" style={{ color: active ? '#EC2828' : '#6B7280' }}>
                      {t(r === 'EMPLOYEE' ? 'Staff.roleEmployee' : 'Staff.roleAdmin')}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              className={`${inputCls} mb-2`}
              placeholder={t('Staff.name')}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <TextInput
              className={`${inputCls} mb-2`}
              placeholder={t('Staff.email')}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {mode === 'password' ? (
              <TextInput
                className={inputCls}
                placeholder={t('Staff.tempPassword')}
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                autoCapitalize="none"
              />
            ) : (
              <Typography variant="body-small-regular" className="text-gray-500">
                {t('Staff.inviteHint')}
              </Typography>
            )}
            <Pressable
              onPress={create}
              disabled={!canCreate}
              className="mt-3 items-center rounded-xl py-4"
              style={{ backgroundColor: canCreate ? '#EC2828' : '#F4A3A3' }}
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

          {/* Staff list */}
          <Typography variant="body-base-bold" className="mb-2 text-text-primary">{t('Staff.team')}</Typography>
          {loading ? (
            <View className="py-8 items-center"><ActivityIndicator color="#EC2828" /></View>
          ) : staff.length === 0 ? (
            <Typography variant="body-small-regular" className="text-gray-500">{t('Staff.noStaff')}</Typography>
          ) : (
            staff.map((m) => (
              <View key={`${m.kind}-${m.id}`} className="mb-3 rounded-2xl bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Typography variant="body-base-semibold" className="text-text-primary">
                      {m.name || m.email}
                    </Typography>
                    <Typography variant="body-small-regular" className="text-gray-500">{m.email}</Typography>
                  </View>
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: m.kind === 'admin' ? '#FEECEC' : '#EEF2FF' }}
                  >
                    <Typography variant="body-very-small-medium" style={{ color: m.kind === 'admin' ? '#EC2828' : '#4F46E5' }}>
                      {t(m.kind === 'admin' ? 'Staff.roleAdmin' : 'Staff.roleEmployee')}
                    </Typography>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Switch
                      value={!m.loginDisabled}
                      onValueChange={() => toggleLogin(m)}
                      disabled={busy || m.id === userId}
                      trackColor={{ true: '#EC2828', false: '#D1D5DB' }}
                      thumbColor="#fff"
                    />
                    <Typography variant="body-small-regular" className="ml-2 text-gray-600">
                      {t(m.loginDisabled ? 'Staff.loginDisabled' : 'Staff.loginEnabled')}
                    </Typography>
                  </View>
                  <Pressable onPress={() => resetPassword(m)} disabled={busy} hitSlop={8}>
                    <Typography variant="body-small-semibold" style={{ color: '#EC2828' }}>
                      {t('Staff.resetPassword')}
                    </Typography>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          {/* Login sessions */}
          <View className="mb-2 mt-6 flex-row items-center justify-between">
            <Typography variant="body-base-bold" className="text-text-primary">{t('Staff.sessions')}</Typography>
            <Pressable
              onPress={exportSessions}
              disabled={exporting}
              className="flex-row items-center rounded-full border border-gray-300 bg-white px-3 py-1.5"
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#EC2828" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={15} color="#EC2828" />
                  <Typography variant="body-small-semibold" className="ml-1" style={{ color: '#EC2828' }}>
                    {t('Staff.exportPdf')}
                  </Typography>
                </>
              )}
            </Pressable>
          </View>
          {loading ? null : sessions.length === 0 ? (
            <Typography variant="body-small-regular" className="text-gray-500">{t('Staff.noSessions')}</Typography>
          ) : (
            sessions.slice(0, 30).map((s) => (
              <View key={s.id} className="mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
                <View className="flex-1 pr-2">
                  <Typography variant="body-small-semibold" className="text-text-primary">{s.staffName}</Typography>
                  <Typography variant="body-very-small-medium" className="text-gray-500">
                    {t(s.role === 'SPOT_ADMIN' ? 'Staff.roleAdmin' : 'Staff.roleEmployee')}
                    {s.ipAddress ? ` · ${s.ipAddress}` : ''}
                  </Typography>
                </View>
                <Typography variant="body-very-small-medium" className="text-gray-500">
                  {timeAgo(s.loginAt)}
                </Typography>
              </View>
            ))
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

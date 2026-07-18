import { Typography } from '@/components/atoms/Typography';
import { useRole } from '@/hooks/useRole';
import {
  getPointTemplates,
  getLoyaltyCustomer,
  awardPoints as apiAwardPoints,
  createPointTemplate,
  deletePointTemplate,
  type LoyaltyCustomer,
  type PointTemplate,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, TextInput, View } from 'react-native';

/**
 * After a customer's loyalty QR is scanned (or their account code typed):
 * confirm who the customer is (name, balance, affordable prizes), pick an
 * admin-configured point template + quantity, and award points. Admins can
 * also enter custom points and manage templates inline. A Cancel button
 * returns to the scanner without awarding.
 */
export function LoyaltyAward({
  userId,
  spotId,
  onDone,
}: {
  // Either the customer's real user id (from the QR) or their typed loyalty code.
  userId: string;
  spotId: string | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { isAdmin } = useRole();

  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [lookupState, setLookupState] = useState<'loading' | 'found' | 'notfound'>('loading');
  const [templates, setTemplates] = useState<PointTemplate[]>([]);
  const [selected, setSelected] = useState<PointTemplate | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [managing, setManaging] = useState(false);

  // Resolve the scanned/typed value to a real customer so staff can confirm
  // who they're crediting before awarding.
  const loadCustomer = useCallback(async () => {
    setLookupState('loading');
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getLoyaltyCustomer(userId, { token });
    if (res.data) {
      setCustomer(res.data);
      setLookupState('found');
    } else {
      setLookupState('notfound');
    }
  }, [userId]);

  const loadTemplates = useCallback(async () => {
    if (!spotId) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getPointTemplates(spotId, { token });
    setTemplates((res.data ?? []).filter((tpl) => tpl.isActive));
  }, [spotId]);

  useEffect(() => {
    void loadCustomer();
    void loadTemplates();
  }, [loadCustomer, loadTemplates]);

  const customPoints = custom ? parseInt(custom, 10) || 0 : 0;
  const total = selected ? selected.points * quantity : customPoints;

  const award = async () => {
    if (total <= 0 || !customer) return;
    setBusy(true);
    setStatus('idle');
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const description = selected
      ? `${selected.name} ×${quantity}`
      : t('Scan.customPoints');
    // Award against the resolved id (works whether we scanned an id or a code).
    const res = await apiAwardPoints(customer.id, total, description, spotId, { token });
    setBusy(false);
    setStatus(res.error ? 'error' : 'done');
  };

  // While resolving the customer.
  if (lookupState === 'loading') {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
        <ActivityIndicator color="#EC2828" />
        <Typography variant="body-small-regular" className="mt-3 text-gray-500">
          {t('Scan.lookingUp')}
        </Typography>
      </View>
    );
  }

  // No customer matched the scanned id / typed code.
  if (lookupState === 'notfound') {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
        <Ionicons name="alert-circle" size={48} color="#EC2828" />
        <Typography variant="body-base-bold" className="mt-3 text-center text-text-primary">
          {t('Scan.customerNotFound')}
        </Typography>
        <Pressable onPress={onDone} className="mt-5 rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
          <Typography variant="body-base-bold" className="text-white">
            {t('Scan.tryAgain')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  if (status === 'done') {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
        <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
        <Typography variant="body-lg-bold" className="mt-3 text-text-primary">
          {t('Scan.awarded', { points: total })}
        </Typography>
        {customer?.name && (
          <Typography variant="body-small-regular" className="mt-1 text-gray-500">
            {customer.name}
          </Typography>
        )}
        <Pressable onPress={onDone} className="mt-5 rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
          <Typography variant="body-base-bold" className="text-white">
            {t('Scan.scanAnother')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {status === 'error' && (
        <View className="rounded-xl bg-red-50 px-4 py-3">
          <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
            {t('Scan.awardError')}
          </Typography>
        </View>
      )}

      {/* Customer summary — confirm who is being credited */}
      {customer && <CustomerCard customer={customer} t={t} />}

      <Typography variant="body-base-semibold" className="text-text-primary">
        {t('Scan.pickTemplate')}
      </Typography>

      {templates.length === 0 ? (
        <Typography variant="body-small-regular" className="text-gray-500">
          {t('Scan.noTemplates')}
        </Typography>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {templates.map((tpl) => (
            <Pressable
              key={tpl.id}
              onPress={() => {
                setSelected(selected?.id === tpl.id ? null : tpl);
                setCustom('');
              }}
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: selected?.id === tpl.id ? '#EC2828' : '#D1D5DB',
                backgroundColor: selected?.id === tpl.id ? '#FEECEC' : '#fff',
              }}
            >
              <Typography variant="body-small-bold" style={{ color: selected?.id === tpl.id ? '#EC2828' : '#374151' }}>
                {tpl.name}
              </Typography>
              <Typography variant="body-very-small-medium" className="text-gray-500">
                {tpl.points} pts
              </Typography>
            </Pressable>
          ))}
        </View>
      )}

      {/* Quantity multiplier (only when a template is selected) */}
      {selected && (
        <View className="flex-row items-center justify-between rounded-2xl bg-white p-4">
          <Typography variant="body-base-semibold" className="text-text-primary">
            {t('Scan.quantity')}
          </Typography>
          <View className="flex-row items-center gap-4">
            <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} hitSlop={8}>
              <Ionicons name="remove-circle-outline" size={30} color="#EC2828" />
            </Pressable>
            <Typography variant="heading-32-bold" className="w-8 text-center text-text-primary">
              {String(quantity)}
            </Typography>
            <Pressable onPress={() => setQuantity((q) => q + 1)} hitSlop={8}>
              <Ionicons name="add-circle-outline" size={30} color="#EC2828" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Custom points — admins only */}
      {isAdmin && !selected && (
        <View>
          <Typography variant="body-small-semibold" className="mb-1.5 text-gray-700">
            {t('Scan.customPoints')}
          </Typography>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            keyboardType="number-pad"
            placeholder="0"
            className="rounded-xl border border-gray-300 px-4 py-3 text-base"
          />
        </View>
      )}

      <View className="flex-row gap-3">
        <Pressable
          onPress={onDone}
          disabled={busy}
          className="items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-4"
        >
          <Typography variant="body-base-bold" className="text-gray-600">
            {t('Scan.cancel')}
          </Typography>
        </Pressable>
        <Pressable
          onPress={award}
          disabled={busy || total <= 0}
          className="flex-1 items-center rounded-xl py-4"
          style={{ backgroundColor: busy || total <= 0 ? '#F4A3A3' : '#EC2828' }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Typography variant="body-base-bold" className="text-white">
              {total > 0 ? t('Scan.award', { points: total }) : t('Scan.totalPoints', { points: 0 })}
            </Typography>
          )}
        </Pressable>
      </View>

      {/* Admin: manage templates */}
      {isAdmin && (
        <View className="mt-2 rounded-2xl border border-gray-200 bg-white p-4">
          <Pressable onPress={() => setManaging((v) => !v)} className="flex-row items-center justify-between">
            <Typography variant="body-base-semibold" className="text-text-primary">
              {t('Scan.manageTemplates')}
            </Typography>
            <Ionicons name={managing ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
          </Pressable>
          {managing && spotId && (
            <TemplateManager spotId={spotId} templates={templates} onChanged={loadTemplates} />
          )}
        </View>
      )}
    </View>
  );
}

// Customer identity + balance summary shown before awarding points.
function CustomerCard({
  customer,
  t,
}: {
  customer: LoyaltyCustomer;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const initial = (customer.name || '?').trim().charAt(0).toUpperCase();
  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4">
      <View className="flex-row items-center">
        {customer.profilePicture ? (
          <Image
            source={{ uri: customer.profilePicture }}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6' }}
          />
        ) : (
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: '#FEECEC' }}
          >
            <Typography variant="body-lg-bold" style={{ color: '#EC2828' }}>
              {initial}
            </Typography>
          </View>
        )}
        <View className="ml-3 flex-1">
          <Typography variant="body-base-bold" className="text-text-primary">
            {customer.name || t('Scan.customer')}
          </Typography>
          {customer.loyaltyCode && (
            <Typography variant="body-small-regular" className="text-gray-500">
              {customer.loyaltyCode}
            </Typography>
          )}
        </View>
      </View>

      <View className="mt-4 flex-row">
        <View className="flex-1 items-center border-r border-gray-100">
          <Typography variant="heading-32-bold" style={{ color: '#EC2828' }}>
            {String(customer.availablePoints)}
          </Typography>
          <Typography variant="body-very-small-medium" className="text-gray-500">
            {t('Scan.availablePoints')}
          </Typography>
        </View>
        <View className="flex-1 items-center">
          <Typography variant="heading-32-bold" className="text-text-primary">
            {String(customer.availablePrizes)}
          </Typography>
          <Typography variant="body-very-small-medium" className="text-gray-500">
            {t('Scan.availablePrizes')}
          </Typography>
        </View>
      </View>
    </View>
  );
}

function TemplateManager({
  spotId,
  templates,
  onChanged,
}: {
  spotId: string;
  templates: PointTemplate[];
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const p = parseInt(points, 10);
    if (!name.trim() || !p || p <= 0) return;
    setBusy(true);
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    await createPointTemplate(spotId, name.trim(), p, { token });
    setName('');
    setPoints('');
    setBusy(false);
    onChanged();
  };

  const remove = async (id: string) => {
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    await deletePointTemplate(id, { token });
    onChanged();
  };

  return (
    <View className="mt-3 gap-3">
      {templates.map((tpl) => (
        <View key={tpl.id} className="flex-row items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
          <Typography variant="body-small-semibold" className="text-text-primary">
            {tpl.name} · {tpl.points} pts
          </Typography>
          <Pressable onPress={() => remove(tpl.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color="#EC2828" />
          </Pressable>
        </View>
      ))}
      <View className="flex-row gap-2">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('Scan.templateName')}
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        />
        <TextInput
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
          placeholder={t('Scan.templatePoints')}
          className="w-20 rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        />
        <Pressable
          onPress={add}
          disabled={busy}
          className="items-center justify-center rounded-xl px-4"
          style={{ backgroundColor: '#EC2828' }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

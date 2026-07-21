import { Typography } from '@/components/atoms/Typography';
import { config } from '@/config';
import {
  createTaste,
  updateTaste,
  createProduct,
  updateProduct,
  type MenuItem,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

const TASTE_TYPES = ['GELATO', 'SORBET', 'MILK', 'VEGAN', 'OTHER'];
const PRODUCT_TYPES = ['COFFEE', 'BEVERAGE', 'DESSERT', 'MERCHANDISE', 'OTHER'];

const inputCls = 'rounded-xl border border-gray-300 px-4 py-3 text-base';

// Upload an image to the taste/product REST endpoint after we have its id.
async function uploadImage(kind: 'taste' | 'product', id: string, uri: string) {
  const token = (await AsyncStorage.getItem('access_token')) ?? '';
  const form = new FormData();
  // On web the picker gives a blob URL; on native a file uri. Both work with FormData.
  const filename = uri.split('/').pop() || 'image.jpg';
  if (uri.startsWith('data:') || uri.startsWith('blob:')) {
    const blob = await (await fetch(uri)).blob();
    form.append('image', blob, filename);
  } else {
    // React Native file object shape.
    form.append('image', { uri, name: filename, type: 'image/jpeg' } as any);
  }
  await fetch(`${config.REST_API_URL}/upload/${kind}/${id}`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

export function MenuItemModal({
  spotId,
  item,
  onClose,
  onSaved,
}: {
  spotId: string;
  item: MenuItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!item;

  // Kind defaults to taste (per spec). On edit it's locked to the item's kind.
  const [kind, setKind] = useState<'taste' | 'product'>(item?.kind ?? 'taste');
  const [name, setName] = useState(item?.title ?? '');
  const [type, setType] = useState(item?.type ?? 'GELATO');
  const [description, setDescription] = useState(item?.description ?? '');
  const [ingredients, setIngredients] = useState('');
  const [allergens, setAllergens] = useState((item?.allergens ?? []).join(', '));
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [loyaltyPoints, setLoyaltyPoints] = useState(
    item?.loyaltyPoints != null ? String(item.loyaltyPoints) : '',
  );
  const [kcalPortion, setKcalPortion] = useState('');
  const [kcal100g, setKcal100g] = useState('');
  // Ice cream pack (box): pick N tastes, total weight.
  const [isBox, setIsBox] = useState(item?.isBox ?? false);
  const [maxTastes, setMaxTastes] = useState(item?.maxTastes != null ? String(item.maxTastes) : '');
  const [weightGrams, setWeightGrams] = useState(item?.weightGrams != null ? String(item.weightGrams) : '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const types = kind === 'taste' ? TASTE_TYPES : PRODUCT_TYPES;

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const localized = JSON.stringify({ pl: name, en: name, ua: name });
      const allergenList = allergens
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      const priceNum = parseFloat(price) || 0;
      const pointsNum = loyaltyPoints ? parseInt(loyaltyPoints, 10) || 0 : 0;
      const kcalP = kcalPortion ? parseFloat(kcalPortion) : undefined;
      const kcal1 = kcal100g ? parseFloat(kcal100g) : undefined;
      // Box fields apply only to products; ignored for tastes.
      const box = kind === 'product' && isBox;
      const maxTastesNum = box && maxTastes ? parseInt(maxTastes, 10) || undefined : undefined;
      const weightNum = box && weightGrams ? parseInt(weightGrams, 10) || undefined : undefined;

      let savedId = item?.id;

      if (kind === 'taste') {
        if (isEdit) {
          await updateTaste(
            { id: item!.id, title: name, titleLocal: localized, type, description, ingredients, price: priceNum, loyaltyPoints: pointsNum, kcalPerPortion: kcalP, kcalPer100g: kcal1, allergens: allergenList },
            { token },
          );
        } else {
          const res = await createTaste(
            { spotId, title: name, titleLocal: localized, type, description, loyaltyPoints: pointsNum, kcalPerPortion: kcalP, kcalPer100g: kcal1, allergens: allergenList },
            { token },
          );
          savedId = res.data?.createTaste?.id;
          // price is only editable via updateTaste; set it right after create.
          if (savedId && priceNum) {
            await updateTaste({ id: savedId, price: priceNum, ingredients }, { token });
          }
        }
      } else {
        if (isEdit) {
          await updateProduct(
            { id: item!.id, name, nameLocal: localized, type, price: priceNum, loyaltyPoints: pointsNum, description, maxTastes: maxTastesNum, weightGrams: weightNum, kcalPerPortion: kcalP, kcalPer100g: kcal1, allergens: allergenList },
            { token },
          );
        } else {
          const res = await createProduct(
            { spotId, name, nameLocal: localized, type, price: priceNum, loyaltyPoints: pointsNum, description, isBox: box, maxTastes: maxTastesNum, weightGrams: weightNum, kcalPerPortion: kcalP, kcalPer100g: kcal1, allergens: allergenList },
            { token },
          );
          savedId = res.data?.createProduct?.id;
        }
      }

      if (imageUri && savedId) {
        await uploadImage(kind, savedId, imageUri);
      }
      onSaved();
    } catch {
      setError(t('SpotMenu.saveError'));
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[90%] rounded-t-3xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-100 px-6 py-4">
            <Typography variant="body-lg-bold" className="text-text-primary">
              {isEdit ? t('SpotMenu.editItem') : t('SpotMenu.addItem')}
            </Typography>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}>
            {error && (
              <View className="rounded-xl bg-red-50 px-4 py-3">
                <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
                  {error}
                </Typography>
              </View>
            )}

            {/* Kind selector (taste default) — locked on edit */}
            {!isEdit && (
              <View>
                <Label>{t('SpotMenu.kind')}</Label>
                <View className="flex-row gap-2">
                  <Chip active={kind === 'taste'} onPress={() => { setKind('taste'); setType('GELATO'); }}>
                    {t('SpotMenu.tasteKind')}
                  </Chip>
                  <Chip active={kind === 'product'} onPress={() => { setKind('product'); setType('COFFEE'); }}>
                    {t('SpotMenu.productKind')}
                  </Chip>
                </View>
              </View>
            )}

            <View>
              <Label>{t('SpotMenu.name')}</Label>
              <TextInput className={inputCls} value={name} onChangeText={setName} />
            </View>

            <View>
              <Label>{t('SpotMenu.type')}</Label>
              <View className="flex-row flex-wrap gap-2">
                {types.map((ty) => (
                  <Chip key={ty} active={type === ty} onPress={() => setType(ty)}>
                    {t(`Spot.category.${ty}`, { defaultValue: ty })}
                  </Chip>
                ))}
              </View>
            </View>

            <View>
              <Label>{t('SpotMenu.price')}</Label>
              <TextInput className={inputCls} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            </View>

            <View>
              <Label>{t('SpotMenu.loyaltyPoints')}</Label>
              <TextInput
                className={inputCls}
                value={loyaltyPoints}
                onChangeText={setLoyaltyPoints}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
              <Typography variant="body-very-small-regular" className="mt-1 ml-1 text-gray-400">
                {t('SpotMenu.loyaltyPointsHint')}
              </Typography>
            </View>

            <View>
              <Label>{t('SpotMenu.description')}</Label>
              <TextInput className={inputCls} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
            </View>

            {/* Ice cream pack (box) — products only */}
            {kind === 'product' && (
              <View className="rounded-xl border border-gray-200 p-3">
                <Pressable
                  onPress={() => setIsBox((v) => !v)}
                  className="flex-row items-center justify-between"
                  disabled={isEdit}
                >
                  <View className="flex-1 pr-2">
                    <Typography variant="body-small-semibold" className="text-gray-700">
                      {t('SpotMenu.isBox')}
                    </Typography>
                    <Typography variant="body-very-small-medium" className="text-gray-500">
                      {t('SpotMenu.isBoxHint')}
                    </Typography>
                  </View>
                  <View
                    className="h-6 w-11 justify-center rounded-full px-0.5"
                    style={{ backgroundColor: isBox ? '#EC2828' : '#D1D5DB', alignItems: isBox ? 'flex-end' : 'flex-start' }}
                  >
                    <View className="h-5 w-5 rounded-full bg-white" />
                  </View>
                </Pressable>

                {isBox && (
                  <View className="mt-3 flex-row gap-3">
                    <View className="flex-1">
                      <Label>{t('SpotMenu.maxTastes')}</Label>
                      <TextInput
                        className={inputCls}
                        value={maxTastes}
                        onChangeText={setMaxTastes}
                        keyboardType="number-pad"
                        placeholder="4"
                      />
                    </View>
                    <View className="flex-1">
                      <Label>{t('SpotMenu.weightGrams')}</Label>
                      <TextInput
                        className={inputCls}
                        value={weightGrams}
                        onChangeText={setWeightGrams}
                        keyboardType="number-pad"
                        placeholder="500"
                      />
                    </View>
                  </View>
                )}
                {isEdit && (
                  <Typography variant="body-very-small-medium" className="mt-2 text-gray-400">
                    {t('SpotMenu.isBoxLocked')}
                  </Typography>
                )}
              </View>
            )}

            {kind === 'taste' && (
              <View>
                <Label>{t('SpotMenu.ingredients')}</Label>
                <TextInput className={inputCls} value={ingredients} onChangeText={setIngredients} multiline />
              </View>
            )}

            <View>
              <Label>{t('SpotMenu.allergens')}</Label>
              <TextInput className={inputCls} value={allergens} onChangeText={setAllergens} />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label>{t('SpotMenu.kcalPortion')}</Label>
                <TextInput className={inputCls} value={kcalPortion} onChangeText={setKcalPortion} keyboardType="number-pad" />
              </View>
              <View className="flex-1">
                <Label>{t('SpotMenu.kcal100g')}</Label>
                <TextInput className={inputCls} value={kcal100g} onChangeText={setKcal100g} keyboardType="number-pad" />
              </View>
            </View>

            <View>
              <Label>{t('SpotMenu.photo')}</Label>
              <Pressable
                onPress={pickImage}
                className="flex-row items-center justify-center rounded-xl border border-dashed border-gray-300 py-4"
              >
                <Ionicons name={imageUri ? 'checkmark-circle' : 'image-outline'} size={20} color={imageUri ? '#16A34A' : '#6B7280'} />
                <Typography variant="body-small-semibold" className="ml-2 text-gray-600">
                  {imageUri ? '✓' : t('SpotMenu.photo')}
                </Typography>
              </Pressable>
            </View>

            <Pressable
              onPress={save}
              disabled={busy || !name}
              className="mt-2 items-center rounded-xl py-4"
              style={{ backgroundColor: busy || !name ? '#F4A3A3' : '#EC2828' }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('SpotMenu.save')}
                </Typography>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body-small-semibold" className="mb-1.5 text-gray-700">
      {children}
    </Typography>
  );
}

function Chip({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-4 py-2"
      style={{ borderColor: active ? '#EC2828' : '#D1D5DB', backgroundColor: active ? '#FEECEC' : '#fff' }}
    >
      <Typography variant="body-small-semibold" style={{ color: active ? '#EC2828' : '#374151' }}>
        {children}
      </Typography>
    </Pressable>
  );
}

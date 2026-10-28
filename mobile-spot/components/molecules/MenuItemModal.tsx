import { Typography } from '@/components/atoms/Typography';
import { config } from '@/config';
import { clientHeaders } from '@/shared/api-client/src/clientInfo';
import {
  createTaste,
  updateTaste,
  createProduct,
  updateProduct,
  createMenuCategory,
  getSpotMenuCategories,
  type MenuCategory,
  type MenuItem,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

const TASTE_TYPES = ['GELATO', 'SORBET', 'MILK', 'VEGAN', 'OTHER'];
const PRODUCT_TYPES = [
  'COFFEE',
  'BEVERAGE',
  'DESSERT',
  'ICE_CREAM_BOX',
  'SANDWICH',
  'BREAD',
  'PASTRY',
  'MERCHANDISE',
  'OTHER',
];

function categoryLabel(nameLocal: MenuCategory['nameLocal'] | string | null | undefined, language: string) {
  let value: MenuCategory['nameLocal'] | null = null;
  if (typeof nameLocal === 'string') {
    try {
      value = JSON.parse(nameLocal);
    } catch {
      return nameLocal;
    }
  } else if (nameLocal && typeof nameLocal === 'object') {
    value = nameLocal;
  }
  if (!value) return '';
  const code = language.split('-')[0] as 'pl' | 'en' | 'ua';
  return value[code] || value.en || value.pl || value.ua || '';
}

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
    headers: { ...clientHeaders(), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: form,
  });
}

export function MenuItemModal({
  spotId,
  item,
  defaultKind = 'product',
  hasTastes = false,
  onClose,
  onSaved,
}: {
  spotId: string;
  item: MenuItem | null;
  /** Kind of a new item: taste once the menu has tastes, else product (A4: no ice-cream default for a bakery or café). */
  defaultKind?: 'taste' | 'product';
  /** The menu already has tastes: only then can a product be a pack of tastes. */
  hasTastes?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isEdit = !!item;

  // On edit the kind is locked to the item's kind.
  const initialKind = item?.kind ?? defaultKind;
  const [kind, setKind] = useState<'taste' | 'product'>(initialKind);
  const [name, setName] = useState(item?.title ?? '');
  const [type, setType] = useState(item?.type ?? (initialKind === 'taste' ? 'GELATO' : 'OTHER'));
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId ?? null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [customPl, setCustomPl] = useState('');
  const [customEn, setCustomEn] = useState('');
  const [customUa, setCustomUa] = useState('');
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

  const types =
    kind === 'taste'
      ? TASTE_TYPES
      : PRODUCT_TYPES.filter((ty) => !(isEdit && !isBox && ty === 'ICE_CREAM_BOX'));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res = await getSpotMenuCategories(spotId, { token });
      if (!cancelled && res.data) setCategories(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  const selectBuiltin = (ty: string) => {
    setCreatingCustom(false);
    setCategoryId(null);
    setType(ty);
    if (!isEdit) {
      if (ty === 'ICE_CREAM_BOX') setIsBox(true);
      else if (type === 'ICE_CREAM_BOX') setIsBox(false);
    }
  };

  const selectCategory = (id: string) => {
    setCreatingCustom(false);
    setCategoryId(id);
    setType('OTHER');
    if (!isEdit && type === 'ICE_CREAM_BOX') setIsBox(false);
  };

  const startCustom = () => {
    setCreatingCustom(true);
    setCategoryId(null);
    setType('OTHER');
    if (!isEdit && type === 'ICE_CREAM_BOX') setIsBox(false);
  };

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
      let resolvedType = type;
      let resolvedCategoryId: string | null = kind === 'product' && !creatingCustom ? categoryId : null;
      if (kind === 'product' && creatingCustom) {
        const pl = customPl.trim();
        const en = customEn.trim();
        const ua = customUa.trim();
        if (!pl || !en || !ua) {
          setError(t('SpotMenu.customTypeRequired'));
          setBusy(false);
          return;
        }
        const created = await createMenuCategory(
          { spotId, nameLocal: JSON.stringify({ pl, en, ua }) },
          { token },
        );
        resolvedCategoryId = created.data?.createMenuCategory?.id ?? null;
        if (!resolvedCategoryId) throw new Error('category');
        resolvedType = 'OTHER';
        const savedCategoryId = resolvedCategoryId;
        setCategoryId(savedCategoryId);
        setCreatingCustom(false);
        setCategories((prev) =>
          prev.some((category) => category.id === savedCategoryId)
            ? prev
            : [...prev, { id: savedCategoryId, nameLocal: { pl, en, ua } }],
        );
      }
      // Box fields apply only to products; ignored for tastes.
      const box = kind === 'product' && (isBox || resolvedType === 'ICE_CREAM_BOX');
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
            { id: item!.id, name, nameLocal: localized, type: resolvedType, categoryId: resolvedCategoryId, price: priceNum, loyaltyPoints: pointsNum, description, maxTastes: maxTastesNum, weightGrams: weightNum, kcalPerPortion: kcalP, kcalPer100g: kcal1, allergens: allergenList },
            { token },
          );
        } else {
          const res = await createProduct(
            { spotId, name, nameLocal: localized, type: resolvedType, categoryId: resolvedCategoryId, price: priceNum, loyaltyPoints: pointsNum, description, isBox: box, maxTastes: maxTastesNum, weightGrams: weightNum, kcalPerPortion: kcalP, kcalPer100g: kcal1, allergens: allergenList },
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
                  <Chip active={kind === 'taste'} onPress={() => { setKind('taste'); setCreatingCustom(false); setCategoryId(null); setType('GELATO'); if (!isEdit) setIsBox(false); }}>
                    {t('SpotMenu.tasteKind')}
                  </Chip>
                  <Chip active={kind === 'product'} onPress={() => { setKind('product'); selectBuiltin('OTHER'); }}>
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
                  <Chip key={ty} active={!creatingCustom && !categoryId && type === ty} onPress={() => selectBuiltin(ty)}>
                    {t(`Ordering.category.${ty}`, { defaultValue: ty })}
                  </Chip>
                ))}
                {kind === 'product' &&
                  categories.map((category) => (
                    <Chip
                      key={category.id}
                      active={!creatingCustom && categoryId === category.id}
                      onPress={() => selectCategory(category.id)}
                    >
                      {categoryLabel(category.nameLocal, i18n.language)}
                    </Chip>
                  ))}
                {kind === 'product' && (
                  <Chip active={creatingCustom} onPress={startCustom}>
                    {`+ ${t('SpotMenu.customType')}`}
                  </Chip>
                )}
              </View>
              {kind === 'product' && creatingCustom && (
                <View className="mt-3 gap-2">
                  <Typography variant="body-very-small-regular" className="text-gray-400">
                    {t('SpotMenu.customTypeHint')}
                  </Typography>
                  <TextInput
                    className={inputCls}
                    value={customPl}
                    onChangeText={setCustomPl}
                    placeholder={t('SpotMenu.langPl')}
                    placeholderTextColor="#9CA3AF"
                    maxLength={40}
                  />
                  <TextInput
                    className={inputCls}
                    value={customEn}
                    onChangeText={setCustomEn}
                    placeholder={t('SpotMenu.langEn')}
                    placeholderTextColor="#9CA3AF"
                    maxLength={40}
                  />
                  <TextInput
                    className={inputCls}
                    value={customUa}
                    onChangeText={setCustomUa}
                    placeholder={t('SpotMenu.langUa')}
                    placeholderTextColor="#9CA3AF"
                    maxLength={40}
                  />
                </View>
              )}
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

            {/* Ice cream pack (box): products only, and only once there are tastes to pick. */}
            {kind === 'product' && (hasTastes || isBox || type === 'ICE_CREAM_BOX') && (
              <View className="rounded-xl border border-gray-200 p-3">
                <Pressable
                  onPress={() => setIsBox((v) => !v)}
                  className="flex-row items-center justify-between"
                  disabled={isEdit || type === 'ICE_CREAM_BOX'}
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
                {!isEdit && type === 'ICE_CREAM_BOX' && !hasTastes && (
                  <Typography variant="body-very-small-medium" className="mt-2 text-gray-400">
                    {t('SpotMenu.isBoxNeedsTastes')}
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
                {imageUri || item?.imageUrl ? (
                  <Image
                    source={{ uri: imageUri ?? item?.imageUrl ?? undefined }}
                    style={{ width: 56, height: 56, borderRadius: 12 }}
                    accessibilityLabel={t('SpotMenu.photo')}
                  />
                ) : (
                  <Ionicons name="image-outline" size={20} color="#6B7280" />
                )}
                <Typography variant="body-small-semibold" className="ml-2 text-gray-600">
                  {imageUri || item?.imageUrl ? t('SpotMenu.photoChange') : t('SpotMenu.photo')}
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

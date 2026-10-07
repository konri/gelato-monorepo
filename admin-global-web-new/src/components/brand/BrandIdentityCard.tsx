import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../../brand/BrandScope';
import { UPDATE_BRAND_PROFILE, type BrandAdminView, type UpdateBrandProfileInput } from '../../graphql/brands';
import { uploadBrandImage } from '../../lib/upload';
import { errorText } from '../../lib/errors';
import { localized } from '../../lib/format';
import { BRAND_DESCRIPTION_MAX } from '../../lib/constants';
import {
  localizedFrom,
  localizedToInput,
  sameLocalized,
  type LocalizedValue,
} from '../../lib/localizedText';
import { LocalizedTextFields } from '../LocalizedTextFields';
import { ImageInput } from '../ImageInput';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { BrandPreview } from './BrandPreview';

/**
 * Name (read-only here: only Loodly renames a brand), logo, cover and
 * description, with a preview of the client-app card (BRANDS_SPEC §3.3).
 */
export function BrandIdentityCard() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { brand, brandId, isPlatform } = useBrandScope();
  const [updateProfile, { loading: saving }] = useMutation<{ updateBrandProfile: BrandAdminView }>(
    UPDATE_BRAND_PROFILE,
  );

  const initial = localizedFrom(brand.description, brand.descriptionLocal);
  const [description, setDescription] = useState<LocalizedValue>(initial);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dirty = !sameLocalized(description, initial);

  const save = async (input: UpdateBrandProfileInput) => {
    await updateProfile({ variables: { brandId, input } });
  };

  // The upload route saves the URL on the brand; mirror it in the cache.
  const setImage = (field: 'logoUrl' | 'coverUrl', url: string | null) => {
    client.cache.modify({
      id: client.cache.identify({ __typename: 'Brand', id: brandId }),
      fields: { [field]: () => url },
    });
  };

  const saveDescription = async () => {
    setError(null);
    setNotice(null);
    const { text, local } = localizedToInput(description);
    try {
      await save({ description: text, descriptionLocal: local });
      setNotice(t('BrandProfile.saved'));
    } catch (err) {
      setError(errorText(err));
    }
  };

  const previewText = localized(brand.descriptionLocal, brand.description ?? '');

  return (
    <Card title={t('BrandProfile.identity')} description={t('BrandProfile.identityHint')}>
      <div id="identity" className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">{t('BrandForm.name')}</p>
            <p className="text-base font-semibold text-gray-900">{brand.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {isPlatform ? t('BrandProfile.nameHintPlatform') : t('BrandProfile.nameHintBrand')}
            </p>
          </div>
          <ImageInput
            label={t('BrandForm.logo')}
            url={brand.logoUrl}
            shape="square"
            onUpload={async (file) => setImage('logoUrl', await uploadBrandImage(brandId, 'logo', file))}
            onRemove={() => save({ logoUrl: null })}
          />
          <ImageInput
            label={t('BrandProfile.cover')}
            url={brand.coverUrl}
            shape="wide"
            onUpload={async (file) => setImage('coverUrl', await uploadBrandImage(brandId, 'cover', file))}
            onRemove={() => save({ coverUrl: null })}
          />
          <LocalizedTextFields
            label={t('BrandForm.description')}
            value={description}
            onChange={(v) => {
              setDescription(v);
              setNotice(null);
            }}
            multiline
            maxLength={BRAND_DESCRIPTION_MAX}
          />
          {error && <Alert tone="error">{error}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}
          <div className="flex gap-2">
            <Button onClick={() => void saveDescription()} disabled={!dirty} loading={saving} loadingText={t('Common.saving')}>
              {t('BrandProfile.saveDescription')}
            </Button>
            {dirty && (
              <Button variant="secondary" onClick={() => setDescription(initial)} disabled={saving}>
                {t('Common.discard')}
              </Button>
            )}
          </div>
        </div>
        <BrandPreview
          name={brand.name}
          logoUrl={brand.logoUrl}
          coverUrl={brand.coverUrl}
          description={dirty ? localizedToInput(description).text : previewText}
        />
      </div>
    </Card>
  );
}

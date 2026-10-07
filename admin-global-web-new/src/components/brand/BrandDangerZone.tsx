import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../../brand/BrandScope';
import { DELETE_BRAND } from '../../graphql/brands';
import { evictRoot } from '../../lib/cachePolicies';
import { errorText } from '../../lib/errors';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Field, Input } from '../ui/Field';

/**
 * PLATFORM only: delete a brand. The server refuses while the brand has
 * spots or history (orders, points, rewards); deactivating is the way then.
 */
export function BrandDangerZone({ spotCount }: { spotCount: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { brand, brandId } = useBrandScope();
  const [deleteBrand, { loading }] = useMutation(DELETE_BRAND, {
    update: (cache) => evictRoot(cache, ['adminBrands']),
  });
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setError(null);
    try {
      await deleteBrand({ variables: { brandId } });
      navigate('/brands', { replace: true, state: { notice: t('BrandDanger.deleted', { name: brand.name }) } });
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Card tone="danger" title={t('BrandDanger.title')} description={t('BrandDanger.subtitle')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {spotCount > 0 ? t('BrandDanger.hasSpots', { n: spotCount }) : t('BrandDanger.hint')}
        </p>
        <Button
          variant="dangerOutline"
          disabled={spotCount > 0}
          onClick={() => {
            setTyped('');
            setError(null);
            setOpen(true);
          }}
        >
          {t('BrandDanger.delete')}
        </Button>
      </div>
      {open && (
        <ConfirmDialog
          title={t('BrandDanger.confirmTitle', { name: brand.name })}
          body={t('BrandDanger.confirmBody')}
          confirmLabel={t('BrandDanger.delete')}
          tone="danger"
          busy={loading}
          error={error}
          confirmDisabled={typed.trim() !== brand.name}
          onCancel={() => setOpen(false)}
          onConfirm={() => void confirm()}
        >
          <Field className="mt-3" label={t('BrandDanger.typeName', { name: brand.name })}>
            {(id) => <Input id={id} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />}
          </Field>
        </ConfirmDialog>
      )}
    </Card>
  );
}

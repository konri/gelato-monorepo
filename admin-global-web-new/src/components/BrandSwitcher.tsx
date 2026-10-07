import { useQuery } from '@apollo/client/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ADMIN_BRANDS, type BrandAdminView } from '../graphql/brands';
import { Select } from './ui/Field';

/**
 * PLATFORM: jump to another brand's console, staying on the same section
 * (profile, spots, rewards, …).
 */
export function BrandSwitcher({ currentBrandId }: { currentBrandId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useQuery<{ adminBrands: BrandAdminView[] }>(ADMIN_BRANDS);
  const brands = [...(data?.adminBrands ?? [])].sort((a, b) => a.brand.name.localeCompare(b.brand.name));

  if (brands.length < 2) return null;

  const switchTo = (brandId: string) => {
    const prefix = `/brands/${currentBrandId}`;
    const rest = location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) : '';
    const section = rest.split('/').filter(Boolean)[0];
    navigate(`/brands/${encodeURIComponent(brandId)}${section ? `/${section}` : ''}`);
  };

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{t('BrandScope.switchBrand')}</span>
      <Select
        value={currentBrandId}
        onChange={(e) => switchTo(e.target.value)}
        className="!w-auto max-w-[14rem] !py-1.5"
        aria-label={t('BrandScope.switchBrand')}
      >
        {brands.map((b) => (
          <option key={b.brand.id} value={b.brand.id}>
            {b.brand.name}
            {b.brand.isActive ? '' : ` (${t('Brands.inactiveBadge')})`}
          </option>
        ))}
      </Select>
    </label>
  );
}

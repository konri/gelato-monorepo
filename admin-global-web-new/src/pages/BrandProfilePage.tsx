import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../brand/BrandScope';
import { BRAND_SPOTS, type AdminSpot } from '../graphql/spots';
import { SetupChecklist } from '../components/brand/SetupChecklist';
import { BrandIdentityCard } from '../components/brand/BrandIdentityCard';
import { BrandCitiesCard } from '../components/brand/BrandCitiesCard';
import { BrandPlanCard } from '../components/brand/BrandPlanCard';
import { BrandAdminsCard } from '../components/brand/BrandAdminsCard';
import { BrandDangerZone } from '../components/brand/BrandDangerZone';
import { QuotaMeter } from '../components/QuotaMeter';
import { Card, PageHeader } from '../components/ui/Card';

/**
 * Brand home (BRANDS_SPEC §3.3). A brand admin sees the setup checklist, the
 * brand's identity and cities, and the plan usage; PLATFORM support mode adds
 * the plan, the brand admins and the danger zone.
 */
export function BrandProfilePage() {
  const { t } = useTranslation();
  const { brand, brandId, isPlatform, quota } = useBrandScope();
  const { data, loading } = useQuery<{ brandSpots: AdminSpot[] }>(BRAND_SPOTS, {
    variables: { brandId },
    fetchPolicy: 'cache-and-network',
  });
  const spots = data?.brandSpots ?? [];
  const spotsLoaded = !!data && !loading;

  // Checklist links point at sections of this page (#identity, #cities):
  // the router only changes the hash, so scroll to the section ourselves.
  const { hash, key } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 sm:p-8">
      {!isPlatform && <PageHeader title={brand.name} subtitle={t('BrandProfile.subtitle')} />}

      {!isPlatform && <SetupChecklist spots={spots} spotsLoaded={spotsLoaded} />}

      {!isPlatform && (
        <Card title={t('BrandProfile.plan')} description={t('BrandProfile.planHint')}>
          <QuotaMeter quota={quota} />
        </Card>
      )}

      {/* Keyed by brand: switching brands (PLATFORM) starts the forms afresh. */}
      <BrandIdentityCard key={`identity-${brandId}`} />
      <BrandCitiesCard key={`cities-${brandId}`} spots={spots} />

      {isPlatform && <BrandPlanCard key={`plan-${brandId}`} />}
      {isPlatform && <BrandAdminsCard key={`admins-${brandId}`} />}
      {isPlatform && spotsLoaded && <BrandDangerZone spotCount={spots.length} />}
    </div>
  );
}

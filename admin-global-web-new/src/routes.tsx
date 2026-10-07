import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { homeFor } from './auth/scope';
import { BrandScopeProvider } from './brand/BrandScope';
import { BrandScopeLayout } from './brand/BrandScopeLayout';
import { AppLayout } from './components/AppLayout';
import { BrandsPage } from './pages/BrandsPage';
import { CreateBrandPage } from './pages/CreateBrandPage';
import { BrandProfilePage } from './pages/BrandProfilePage';
import { SpotsPage } from './pages/SpotsPage';
import { CreateSpotPage } from './pages/CreateSpotPage';
import { EditSpotPage } from './pages/EditSpotPage';
import { OrdersPage } from './pages/OrdersPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { AdminsPage } from './pages/AdminsPage';
import { NewsPage } from './pages/NewsPage';
import { QuestsPage } from './pages/QuestsPage';
import { PrizesPage } from './pages/PrizesPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { StaffPage } from './pages/StaffPage';
import { RequestsPage } from './pages/RequestsPage';

/** The brand pages, shared by the brand tree and PLATFORM support mode. */
function brandPageRoutes() {
  return (
    <>
      <Route path="spots" element={<SpotsPage />} />
      <Route path="spots/new" element={<CreateSpotPage />} />
      <Route path="spots/:spotId/edit" element={<EditSpotPage />} />
      <Route path="rewards" element={<PrizesPage />} />
      <Route path="promotions" element={<PromotionsPage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="orders" element={<OrdersPage />} />
    </>
  );
}

/** Old invite links (/spots/:spotId/invite) open the staff invite for that spot. */
function InviteRedirect() {
  const { spotId = '' } = useParams<{ spotId: string }>();
  return <Navigate to={`/staff?invite=1&spot=${encodeURIComponent(spotId)}`} replace />;
}

/** PLATFORM (SUPER_ADMIN): brands, partnership requests, the platform directories and support mode per brand. */
function PlatformRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout variant="platform" />}>
        <Route index element={<Navigate to="/brands" replace />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="brands/new" element={<CreateBrandPage />} />
        <Route
          path="brands/:brandId"
          element={
            <BrandScopeProvider source="param">
              <BrandScopeLayout />
            </BrandScopeProvider>
          }
        >
          <Route index element={<BrandProfilePage />} />
          {brandPageRoutes()}
        </Route>
        <Route path="spots" element={<SpotsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="admins" element={<AdminsPage />} />
        <Route path="news" element={<NewsPage />} />
        {/* Partnership requests (/for-business form). Platform only: other scopes fall through to their home. */}
        <Route path="requests" element={<RequestsPage />} />
        {/* Frozen (E21): reachable by URL, hidden from the nav. */}
        <Route path="quests" element={<QuestsPage />} />
        <Route path="prizes" element={<Navigate to="/brands" replace />} />
        <Route path="*" element={<Navigate to="/brands" replace />} />
      </Route>
    </Routes>
  );
}

/** BRAND_ADMIN: the brand console, brand taken from the session. */
function BrandRoutes() {
  return (
    <Routes>
      <Route
        element={
          <BrandScopeProvider source="self">
            <AppLayout variant="brand" />
          </BrandScopeProvider>
        }
      >
        <Route index element={<Navigate to="/brand" replace />} />
        <Route path="brand" element={<BrandProfilePage />} />
        {brandPageRoutes()}
        <Route path="prizes" element={<Navigate to="/rewards" replace />} />
        <Route path="spots/:spotId/invite" element={<InviteRedirect />} />
        <Route path="*" element={<Navigate to="/brand" replace />} />
      </Route>
    </Routes>
  );
}

/** One route tree per scope (BRANDS_SPEC §3.2). */
export function ScopedRoutes() {
  const { scope } = useAuth();
  if (scope === 'PLATFORM') return <PlatformRoutes />;
  if (scope === 'BRAND_ADMIN') return <BrandRoutes />;
  return <Navigate to={homeFor(scope)} replace />;
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SpotsPage } from './pages/SpotsPage';
import { CreateSpotPage } from './pages/CreateSpotPage';
import { EditSpotPage } from './pages/EditSpotPage';
import { InviteSpotAdminPage } from './pages/InviteSpotAdminPage';
import { AdminsPage } from './pages/AdminsPage';
import { NewsPage } from './pages/NewsPage';
import { OrdersPage } from './pages/OrdersPage';
import { PrizesPage } from './pages/PrizesPage';
import { QuestsPage } from './pages/QuestsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated area */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/spots" element={<SpotsPage />} />
              <Route path="/spots/new" element={<CreateSpotPage />} />
              <Route path="/spots/:spotId/edit" element={<EditSpotPage />} />
              <Route path="/spots/:spotId/invite" element={<InviteSpotAdminPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/prizes" element={<PrizesPage />} />
              <Route path="/news" element={<NewsPage />} />
            </Route>
          </Route>

          {/* SUPER_ADMIN only */}
          <Route element={<ProtectedRoute superAdminOnly />}>
            <Route element={<AppLayout />}>
              <Route path="/admins" element={<AdminsPage />} />
              <Route path="/quests" element={<QuestsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/spots" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

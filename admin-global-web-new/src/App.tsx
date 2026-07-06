import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SpotsPage } from './pages/SpotsPage';
import { CreateSpotPage } from './pages/CreateSpotPage';
import { InviteSpotAdminPage } from './pages/InviteSpotAdminPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

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
              <Route path="/spots/:spotId/invite" element={<InviteSpotAdminPage />} />
              <Route
                path="/news"
                element={
                  <PlaceholderPage
                    title="News & Notifications"
                    note="Coming in the next phase — publish news and send global notifications."
                  />
                }
              />
            </Route>
          </Route>

          {/* SUPER_ADMIN only */}
          <Route element={<ProtectedRoute superAdminOnly />}>
            <Route element={<AppLayout />}>
              <Route
                path="/admins"
                element={
                  <PlaceholderPage
                    title="Admins"
                    note="Coming in the next phase — create admin accounts."
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/spots" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

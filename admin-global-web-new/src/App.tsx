import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireSession } from './auth/RequireSession';
import { ScopedRoutes } from './routes';
import { LoginPage } from './pages/LoginPage';
import { UseSpotAppPage } from './pages/UseSpotAppPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { UpgradeRequiredOverlay } from './components/UpgradeRequiredOverlay';

function AppRoutes() {
  const { upgradeRequired } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/use-spot-app" element={<UseSpotAppPage />} />
        <Route
          path="/change-password"
          element={
            <RequireSession allowRestricted>
              <ChangePasswordPage />
            </RequireSession>
          }
        />
        {/* Authenticated console: one route tree per scope. */}
        <Route
          path="/*"
          element={
            <RequireSession>
              <ScopedRoutes />
            </RequireSession>
          }
        />
      </Routes>
      {upgradeRequired && <UpgradeRequiredOverlay />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

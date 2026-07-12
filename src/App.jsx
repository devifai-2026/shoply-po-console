import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Topbar } from './components/layout/Topbar.jsx';
import { Login } from './pages/Login.jsx';
import { Overview } from './pages/Overview.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Tenants } from './pages/Tenants.jsx';
import { TenantNew } from './pages/TenantNew.jsx';
import { TenantDetail } from './pages/TenantDetail.jsx';
import { Builds } from './pages/Builds.jsx';
import { Keystore } from './pages/Keystore.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';

const ConsoleShell = () => {
  const { owner } = useAuth();

  if (!owner) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scroll-smooth p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/"              element={<Overview />} />
              <Route path="/analytics"     element={<Analytics />} />
              <Route path="/tenants"       element={<Tenants />} />
              <Route path="/tenants/new"   element={<TenantNew />} />
              <Route path="/tenants/:slug" element={<TenantDetail />} />
              <Route path="/builds"        element={<Builds />} />
              <Route path="/keystore"      element={<Keystore />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const LoginRoute = () => {
  const { owner } = useAuth();
  if (owner) return <Navigate to="/" replace />;
  return <Login />;
};

const App = () => (
  <ToastProvider>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/*" element={<ConsoleShell />} />
      </Routes>
    </AuthProvider>
  </ToastProvider>
);

export default App;

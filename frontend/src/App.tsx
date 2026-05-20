import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception';
import Clients from './pages/Clients';
import Vehicles from './pages/Vehicles';
import Repairs from './pages/Repairs';
import Quotes from './pages/Quotes';
import Invoices from './pages/Invoices';
import CashFlow from './pages/CashFlow';
import Stock from './pages/Stock';
import Notifications from './pages/Notifications';
import Appointments from './pages/Appointments';
import Users from './pages/Users';
import PublicLayout from './components/PublicLayout';
import PublicPortal from './pages/PublicPortal';
import ClientSpace from './pages/ClientSpace';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const RoleRoute = ({ children, role }: { children: React.ReactNode, role: 'DIRECTEUR' | 'SECRETAIRE' }) => {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to="/staff/reception" />; // Rediriger les secrétaires vers la réception par défaut
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        {/* Routes Publiques (Landing Page & Espace Client) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicPortal />} />
          <Route path="/espace-client" element={<ClientSpace />} />
        </Route>

        {/* Login Staff */}
        <Route path="/login" element={<Login />} />

        {/* Interface Interne Protégée (/staff) */}
        <Route path="/staff" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<RoleRoute role="DIRECTEUR"><Dashboard /></RoleRoute>} />
          <Route path="reception" element={<Reception />} />
          <Route path="clients" element={<Clients />} />
          <Route path="vehicules" element={<Vehicles />} />
          <Route path="reparations" element={<Repairs />} />
          <Route path="devis" element={<Quotes />} />
          <Route path="factures" element={<Invoices />} />
          <Route path="caisse" element={<CashFlow />} />
          <Route path="stock" element={<Stock />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="agenda" element={<Appointments />} />
          <Route path="utilisateurs" element={<RoleRoute role="DIRECTEUR"><Users /></RoleRoute>} />
        </Route>

        {/* Redirections par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

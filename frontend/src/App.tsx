import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import PublicLayout from './components/PublicLayout';
import PublicPortal from './pages/PublicPortal';
import ClientSpace from './pages/ClientSpace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Portail Public */}
        <Route path="/reservation" element={<PublicLayout />}>
          <Route index element={<PublicPortal />} />
        </Route>
        <Route path="/espace-client" element={<PublicLayout />}>
          <Route index element={<ClientSpace />} />
        </Route>

        {/* Interface Interne */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
...
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

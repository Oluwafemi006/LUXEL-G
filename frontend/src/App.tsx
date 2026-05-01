import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Vehicles from './pages/Vehicles';
import Repairs from './pages/Repairs';
import Invoices from './pages/Invoices';
import CashFlow from './pages/CashFlow';
import Stock from './pages/Stock';
import Visits from './pages/Visits';
import Notifications from './pages/Notifications';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="vehicules" element={<Vehicles />} />
          <Route path="reparations" element={<Repairs />} />
          <Route path="factures" element={<Invoices />} />
          <Route path="caisse" element={<CashFlow />} />
          <Route path="stock" element={<Stock />} />
          <Route path="visites" element={<Visits />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

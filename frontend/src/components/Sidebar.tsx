import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Car, 
  Wrench, 
  FileText, 
  Receipt, 
  Wallet, 
  Package, 
  Calendar, 
  Bell, 
  LogOut 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Tableau de bord', icon: LayoutDashboard, path: '/', role: 'DIRECTEUR' },
    { name: 'Réception Client', icon: UserPlus, path: '/reception' },
    { name: 'Gestion Clients', icon: Users, path: '/clients' },
    { name: 'Gestion Véhicules', icon: Car, path: '/vehicules' },
    { name: 'Réparations', icon: Wrench, path: '/reparations' },
    { name: 'Gestion Devis', icon: FileText, path: '/devis' },
    { name: 'Facturation', icon: Receipt, path: '/factures' },
    { name: 'Gestion Caisse', icon: Wallet, path: '/caisse' },
    { name: 'Gestion Stock', icon: Package, path: '/stock' },
    { name: 'Agenda & RDV', icon: Calendar, path: '/agenda' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Utilisateurs', icon: Users, path: '/utilisateurs', role: 'DIRECTEUR' },
  ];

  const filteredItems = menuItems.filter(item => !item.role || item.role === user?.role);

  return (
    <aside className="w-64 bg-white h-screen flex flex-col border-r border-emerald-100/50 shadow-2xl shadow-emerald-900/5 z-30 transition-all duration-700 ease-in-out">
      <div className="p-8">
        <h1 className="text-emerald-600 font-display text-3xl font-black tracking-tighter italic">
          LUXEL<span className="text-slate-900">-G</span>
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            Luxury Elegance
          </p>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-1 py-4 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-500 ease-in-out group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 translate-x-1'
                  : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
              }`
            }
          >
            <item.icon className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 ${window.location.pathname === item.path ? 'animate-pulse' : ''}`} />
            <span className="font-bold text-sm tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-50">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 w-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all duration-500 ease-in-out group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-500" />
          <span className="font-bold text-sm tracking-tight">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

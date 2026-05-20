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
    { name: 'Tableau de bord',  icon: LayoutDashboard, path: '/staff',          role: 'DIRECTEUR' },
    { name: 'Réception Client', icon: UserPlus,         path: '/staff/reception' },
    { name: 'Gestion Clients',  icon: Users,            path: '/staff/clients' },
    { name: 'Gestion Véhicules',icon: Car,              path: '/staff/vehicules' },
    { name: 'Réparations',      icon: Wrench,           path: '/staff/reparations' },
    { name: 'Gestion Devis',    icon: FileText,         path: '/staff/devis' },
    { name: 'Facturation',      icon: Receipt,          path: '/staff/factures' },
    { name: 'Gestion Caisse',   icon: Wallet,           path: '/staff/caisse' },
    { name: 'Gestion Stock',    icon: Package,          path: '/staff/stock' },
    { name: 'Agenda & RDV',     icon: Calendar,         path: '/staff/agenda' },
    { name: 'Notifications',    icon: Bell,             path: '/staff/notifications' },
    { name: 'Utilisateurs',     icon: Users,            path: '/staff/utilisateurs',  role: 'DIRECTEUR' },
  ];

  const filteredItems = menuItems.filter(item => !item.role || item.role === user?.role);

  return (
    /* Sidebar fixée : utilise position fixed, toujours visible */
    <aside
      className="sidebar-fixed bg-white border-r border-slate-200 flex flex-col"
      style={{ width: '256px' }}
    >
      {/* ── Logo ── */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100">
        <NavLink to="/staff" className="block group">
          <h1 className="font-bebas text-3xl text-emerald-600 tracking-wider leading-none">
            LUXEL<span className="text-slate-900">-G</span>
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-0.5 w-6 bg-emerald-500 rounded-full" />
            <p className="font-oswald text-[10px] font-500 text-slate-400 uppercase tracking-[0.25em]">
              Luxury Elegance
            </p>
          </div>
        </NavLink>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/staff'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-250 group text-sm font-oswald font-500 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                  }`}
                />
                <span className="truncate tracking-wide uppercase font-semibold">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-3 bg-white/40 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Déconnexion ── */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-250 text-sm font-oswald font-semibold group uppercase"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200" />
          <span className="tracking-wide">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

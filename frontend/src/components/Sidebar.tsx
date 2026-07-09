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
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  UserCog,
  Settings
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  const menuItems = [
    { name: 'Tableau de bord',  icon: LayoutDashboard, path: '/staff',          role: 'DIRECTEUR' },
    { name: 'Réception Client', icon: UserPlus,         path: '/staff/reception' },
    { name: 'Gestion Clients',  icon: Users,            path: '/staff/clients' },
    { name: 'Gestion Véhicules',icon: Car,              path: '/staff/vehicules' },
    { name: 'Réparations',      icon: Wrench,           path: '/staff/reparations' },
    { name: 'Gestion Devis',    icon: FileText,         path: '/staff/devis' },
    { name: 'Facturation',      icon: Receipt,          path: '/staff/factures' },
    { name: 'Gestion Caisse',   icon: Wallet,           path: '/staff/caisse',        role: 'DIRECTEUR' },
    { name: 'Gestion Stock',    icon: Package,          path: '/staff/stock' },
    { name: 'Agenda & RDV',     icon: Calendar,         path: '/staff/agenda' },
    { name: 'Notifications',    icon: Bell,             path: '/staff/notifications' },
    { name: 'Mon Profil',       icon: UserCog,          path: '/staff/profil' },
    { name: 'Utilisateurs',     icon: Users,            path: '/staff/utilisateurs',  role: 'DIRECTEUR' },
    { name: 'Paramètres',       icon: Settings,         path: '/staff/parametres',    role: 'DIRECTEUR' },
  ];

  const filteredItems = menuItems.filter(item => !item.role || item.role === user?.role);

  return (
    <>
      {/* ── Overlay Mobile ── */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onMobileClose}
      />

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar-fixed bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-50 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          ${isCollapsed ? 'lg:w-[80px]' : 'lg:w-[256px]'} w-[256px]`}
      >
        {/* ── Logo ── */}
        <div className={`flex-shrink-0 px-6 py-5 border-b border-slate-100 flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <NavLink to="/staff" onClick={handleLinkClick} className="block group">
            {isCollapsed ? (
              <div className="flex items-center gap-2">
                <h1 className="font-bebas text-3xl text-emerald-600 tracking-wider leading-none lg:block hidden">L</h1>
                <h1 className="font-bebas text-3xl text-emerald-600 tracking-wider leading-none lg:hidden">LUXEL<span className="text-slate-900">-G</span></h1>
              </div>
            ) : (
              <>
                <h1 className="font-bebas text-3xl text-emerald-600 tracking-wider leading-none">
                  LUXEL<span className="text-slate-900">-G</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5 lg:flex hidden">
                  <div className="h-0.5 w-6 bg-emerald-500 rounded-full" />
                  <p className="font-oswald text-[10px] font-500 text-slate-400 uppercase tracking-[0.25em]">
                    Luxury Elegance
                  </p>
                </div>
              </>
            )}
          </NavLink>
          
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button 
                onClick={onToggle}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors lg:block hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onMobileClose}
              className="p-1.5 rounded-lg bg-rose-50 text-rose-500 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-4 border-b border-slate-50">
             <button 
              onClick={onToggle}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/staff'}
              onClick={handleLinkClick}
              title={isCollapsed ? item.name : ""}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-250 group text-sm font-oswald font-500 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                    }`}
                  />
                  <span className={`truncate tracking-wide uppercase font-semibold ${isCollapsed ? 'lg:hidden' : 'block'}`}>{item.name}</span>
                  {!isCollapsed && isActive && (
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
            title={isCollapsed ? "Déconnexion" : ""}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-250 text-sm font-oswald font-semibold group uppercase ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
          >
            <X className="w-4 h-4 flex-shrink-0 lg:hidden" />
            <LogOut className={`w-4 h-4 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200 ${isCollapsed ? 'block' : 'lg:block'}`} />
            <span className={`tracking-wide ${isCollapsed ? 'lg:hidden' : 'block'}`}>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const menuItems = [
    { name: 'Tableau de bord', icon: 'dashboard', path: '/' },
    { name: 'Gestion Clients', icon: 'group', path: '/clients' },
    { name: 'Gestion Véhicules', icon: 'directions_car', path: '/vehicules' },
    { name: 'Réparations', icon: 'build', path: '/reparations' },
    { name: 'Facturation', icon: 'receipt_long', path: '/factures' },
    { name: 'Gestion Caisse', icon: 'account_balance_wallet', path: '/caisse' },
    { name: 'Gestion Stock', icon: 'inventory_2', path: '/stock' },
    { name: 'Visites Techniques', icon: 'verified', path: '/visites' },
    { name: 'Notifications', icon: 'notifications', path: '/notifications' },
  ];

  return (
    <aside className="w-64 bg-surface-container h-screen flex flex-col border-r border-outline/20">
      <div className="p-6">
        <h1 className="text-primary font-display text-2xl font-extrabold tracking-tight">
          LUXEL<span className="text-on-surface">-G</span>
        </h1>
        <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mt-1">
          Luxury Elegance
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-outline/10">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full text-on-surface-variant hover:bg-error/10 hover:text-error rounded-lg transition-colors">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

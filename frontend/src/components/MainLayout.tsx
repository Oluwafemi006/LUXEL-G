import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Plus, User, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Modal from './Modal';
import RepairForm from './forms/RepairForm';
import GlobalSearch from './GlobalSearch';
import api, { resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling silencieux des notifications toutes les 30 secondes
  const fetchNotifCount = async () => {
    try {
      const res = await api.get('notifications-staff/?lu=false&page_size=50');
      const data = res.data.results ?? (Array.isArray(res.data) ? res.data : []);
      setUnreadCount(res.data.count ?? data.length);
    } catch {
      // Silencieux : pas d'alerte si le réseau échoue
    }
  };

  useEffect(() => {
    fetchNotifCount(); // Appel immédiat
    pollingRef.current = setInterval(fetchNotifCount, 30000); // toutes les 30s
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Rafraîchir le compteur quand on quitte la page notifications (on repasse dessus)
  useEffect(() => {
    if (!location.pathname.includes('notifications')) {
      fetchNotifCount();
    }
  }, [location.pathname]);

  const handleGlobalRepair = async (data: Record<string, unknown>) => {
    try {
      await api.post('reparations/', data);
      setIsRepairModalOpen(false);
      navigate('/staff/reparations');
    } catch (error) {
      console.error('Erreur création OR global:', error);
      alert("Erreur lors de la création de l'ordre de réparation.");
    }
  };

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Utilisateur';
  const displayRole = user?.role === 'DIRECTEUR' ? 'Directeur' : user?.role === 'SECRETAIRE' ? 'Secrétaire' : user?.role || 'Staff';

  return (
    /* Conteneur racine : sidebar fixée à gauche, contenu à droite */
    <div className="flex h-screen bg-[#f4f7f6]">

      {/* ── SIDEBAR (fixée, ne participe pas au scroll) ── */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* ── ZONE DROITE : décalée pour ne pas se cacher sous la sidebar (seulement sur Desktop) ── */}
      <div 
        className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out`}
        style={{ 
          marginLeft: (window.innerWidth >= 1024) 
            ? (isSidebarCollapsed ? '80px' : '256px') 
            : '0' 
        }}
      >

        {/* ── NAVBAR FIXÉE ── sticky dans son flex parent */}
        <header className="navbar-fixed flex-shrink-0 h-16 flex items-center justify-between px-4 lg:px-8 gap-3 lg:gap-6 bg-white border-b border-slate-200">

          <div className="flex items-center gap-4 flex-1">
             {/* Bouton Hamburger Mobile */}
             <button 
               onClick={() => setIsMobileSidebarOpen(true)}
               className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
             >
               <Menu className="w-6 h-6" />
             </button>
             
             {/* Barre de recherche globale (cachée sur très petit mobile pour laisser place aux actions) */}
             <div className="flex-1 max-w-xl">
               <GlobalSearch />
             </div>
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">

            {/* Bouton Nouvel OR (Icone seule sur mobile) */}
            <button
              onClick={() => setIsRepairModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 text-white p-2 lg:px-4 lg:py-2 rounded-lg lg:rounded-md font-bebas text-base tracking-widest uppercase shadow-md hover:bg-emerald-600 transition-all active:scale-95"
              title="Nouvel Ordre de Réparation"
            >
              <Plus className="w-5 h-5 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Nouvel OR</span>
            </button>

            {/* Cloche avec badge dynamique */}
            <button
              onClick={() => { navigate('/staff/notifications'); setUnreadCount(0); }}
              className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-600 rounded-md transition-all"
              title={`${unreadCount} notification(s) non lue(s)`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-rose-500 text-white text-[8px] font-black rounded-full border border-white flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profil utilisateur (Masqué sur mobile compact) */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right leading-none hidden md:block">
                <p className="text-xs font-oswald font-bold text-slate-900 uppercase tracking-wider">{displayName}</p>
                <p className="text-[9px] font-oswald font-medium text-emerald-600 uppercase tracking-widest mt-0.5">{displayRole}</p>
              </div>
              <div
                onClick={() => navigate('/staff/profil')}
                className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all cursor-pointer overflow-hidden"
                title="Mon Profil"
              >
                {user?.photo ? (
                  <img src={resolveMediaUrl(user.photo)} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── ZONE SCROLLABLE ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-8">
            <div key={location.pathname} className="page-transition-wrapper">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Modal Ordre de Réparation rapide */}
      <Modal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        title="Créer un Ordre de Réparation Rapide"
      >
        <RepairForm onSubmit={handleGlobalRepair} onCancel={() => setIsRepairModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default MainLayout;

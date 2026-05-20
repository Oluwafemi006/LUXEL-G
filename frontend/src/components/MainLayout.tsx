import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Plus, User } from 'lucide-react';
import Sidebar from './Sidebar';
import Modal from './Modal';
import RepairForm from './forms/RepairForm';
import GlobalSearch from './GlobalSearch';
import api from '../services/api';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);

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

  return (
    /* Conteneur racine : sidebar fixée à gauche, contenu à droite */
    <div className="flex h-screen bg-[#f4f7f6]">

      {/* ── SIDEBAR (fixée, ne participe pas au scroll) ── */}
      <Sidebar />

      {/* ── ZONE DROITE : décalée de 256px pour ne pas se cacher sous la sidebar ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ marginLeft: '256px' }}>

        {/* ── NAVBAR FIXÉE ── sticky dans son flex parent */}
        <header className="navbar-fixed flex-shrink-0 h-16 flex items-center justify-between px-8 gap-6 bg-white border-b border-slate-200">

          {/* Barre de recherche globale */}
          <GlobalSearch />

          {/* Actions droite */}
          <div className="flex items-center gap-4 flex-shrink-0">

            {/* Bouton Nouvel OR */}
            <button
              onClick={() => setIsRepairModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md font-bebas text-base tracking-widest uppercase shadow-md hover:bg-emerald-600 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Nouvel OR
            </button>

            {/* Cloche */}
            <button
              onClick={() => navigate('/staff/notifications')}
              className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-600 rounded-md transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
            </button>

            {/* Profil utilisateur */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right leading-none">
                <p className="text-xs font-oswald font-bold text-slate-900 uppercase tracking-wider">Eddy Boni</p>
                <p className="text-[9px] font-oswald font-medium text-emerald-600 uppercase tracking-widest mt-0.5">Admin</p>
              </div>
              <div className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* ── ZONE SCROLLABLE ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8">
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

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Bell, User } from 'lucide-react';
import Sidebar from './Sidebar';
import Modal from './Modal';
import RepairForm from './forms/RepairForm';
import api from '../services/api';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);

  const handleGlobalRepair = async (data: Record<string, unknown>) => {
    try {
      await api.post('reparations/', data);
      setIsRepairModalOpen(false);
      navigate('/reparations');
    } catch (error) {
      console.error('Erreur création OR global:', error);
      alert("Erreur lors de la création de l'ordre de réparation.");
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f9f4] overflow-hidden transition-colors duration-1000">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header Ultra Moderne */}
        <header className="h-20 bg-white/70 backdrop-blur-md flex items-center justify-between px-10 border-b border-emerald-100/50 z-20 transition-all duration-700">
          <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100/50 px-6 py-2.5 rounded-2xl w-[450px] text-slate-400 group focus-within:w-[500px] focus-within:border-emerald-500/50 transition-all duration-700 ease-in-out">
            <Search className="w-4 h-4 group-focus-within:text-emerald-500 transition-colors duration-500" />
            <input 
              type="text" 
              placeholder="Rechercher un client, véhicule ou OR..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none font-medium placeholder:text-slate-300"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsRepairModalOpen(true)}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all duration-500 flex items-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
              Nouvel OR
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/notifications')}
                className="p-3 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl transition-all duration-500 relative group"
              >
                <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Eddy Boni</p>
                  <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Administrateur</p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black border border-emerald-200 shadow-inner group cursor-pointer hover:bg-emerald-600 hover:text-white transition-all duration-700">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <Modal 
          isOpen={isRepairModalOpen} 
          onClose={() => setIsRepairModalOpen(false)} 
          title="Créer un Ordre de Réparation Rapide"
        >
          <RepairForm onSubmit={handleGlobalRepair} onCancel={() => setIsRepairModalOpen(false)} />
        </Modal>

        {/* Zone de contenu avec animation d'entrée re-déclenchée à chaque changement de route */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar scroll-smooth">
          <div key={location.pathname} className="page-transition-wrapper h-full">
            <Outlet />
          </div>
        </main>

        {/* Déco d'arrière-plan */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-200/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default MainLayout;

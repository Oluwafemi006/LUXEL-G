import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Modal from './Modal';
import RepairForm from './forms/RepairForm';
import api from '../services/api';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header simple */}
        <header className="h-16 bg-surface flex items-center justify-between px-8 border-b border-outline/10">
          <div className="flex items-center gap-4 bg-surface-container px-4 py-2 rounded-full w-96 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">search</span>
            <input 
              type="text" 
              placeholder="Rechercher un client, véhicule ou OR..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsRepairModalOpen(true)}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold shadow-md hover:bg-primary-container transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nouvel OR
            </button>
            <div className="h-8 w-px bg-outline/10 mx-2"></div>
            <button 
              onClick={() => navigate('/notifications')}
              className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              notifications
            </button>
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-xs font-bold">EB</div>
          </div>
        </header>

        <Modal 
          isOpen={isRepairModalOpen} 
          onClose={() => setIsRepairModalOpen(false)} 
          title="Créer un Ordre de Réparation Rapide"
        >
          <RepairForm onSubmit={handleGlobalRepair} onCancel={() => setIsRepairModalOpen(false)} />
        </Modal>

        {/* Zone de contenu */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

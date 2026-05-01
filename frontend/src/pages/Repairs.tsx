import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import RepairForm from '../components/forms/RepairForm';
import api from '../services/api';

interface Repair {
  id: number;
  vehicule_plate: string;
  categorie: string;
  description: string;
  priorite: string;
  statut: string;
  progression: number;
  technicien_name?: string;
  date_creation: string;
  kilometrage?: number;
}

const Repairs: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const response = await api.get('reparations/');
      const data = Array.isArray(response.data) ? response.data : [];
      setRepairs(data);
      
      if (data.length > 0 && !selectedRepair) {
        setSelectedRepair(data[0]);
      } else if (selectedRepair) {
        const updated = data.find(r => r.id === selectedRepair.id);
        if (updated) setSelectedRepair(updated);
      }
    } catch (error) {
      console.error('Erreur chargement réparations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  const handleUpdateStatus = async (repairId: number, newStatus: string) => {
    try {
      await api.patch(`reparations/${repairId}/`, { statut: newStatus });
      fetchRepairs();
    } catch (error) {
      console.error('Erreur statut:', error);
    }
  };

  const handleUpdateProgress = async (repairId: number, newProgress: number) => {
    try {
      const progression = Math.min(100, Math.max(0, newProgress));
      await api.patch(`reparations/${repairId}/`, { progression });
      fetchRepairs();
    } catch (error) {
      console.error('Erreur progression:', error);
    }
  };

  const handleAddRepair = async (data: any) => {
    try {
      await api.post('reparations/', data);
      setIsModalOpen(false);
      fetchRepairs();
    } catch (error) {
      alert('Erreur lors de la création de l\'OR.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('reparations/export_excel/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'registre_entrees_luxel_g.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Erreur lors de l\'exportation Excel.');
    }
  };

  const filteredRepairs = repairs.filter(r => 
    r.vehicule_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.categorie.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toString().includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Atelier & Maintenance</h1>
          <p className="text-on-surface-variant font-medium">Suivi des ordres de réparation et progression technique.</p>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-white border border-outline/10 text-on-surface-variant px-4 py-3 rounded-xl font-bold hover:bg-surface-container transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">download</span>
            <span className="text-xs uppercase">Registre</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Nouvel OR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* File d'attente (Gauche) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline/10 bg-surface-container/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text"
                placeholder="N° OR, Plaque, Catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-outline/20 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-outline/5">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-primary font-bold">Mise à jour atelier...</div>
            ) : filteredRepairs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs font-bold uppercase opacity-40">Aucun OR en cours.</div>
            ) : filteredRepairs.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedRepair(item)}
                className={`p-4 cursor-pointer transition-all hover:bg-primary/5 flex items-center gap-4 ${selectedRepair?.id === item.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedRepair?.id === item.id ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined">{item.progression === 100 ? 'verified' : 'engineering'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-black text-primary text-sm tracking-tighter">OR-{item.id.toString().padStart(4, '0')}</p>
                  <p className="text-xs font-black text-on-surface truncate">{item.vehicule_plate}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase truncate">{item.categorie}</p>
                </div>
                <div className="text-right">
                   <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      item.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-700' : 
                      item.statut === 'TERMINE' ? 'bg-green-100 text-green-700' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {item.statut === 'EN_COURS' ? 'En cours' : item.statut === 'TERMINE' ? 'Terminé' : item.statut}
                    </span>
                    <div className="w-12 bg-surface-container h-1 rounded-full overflow-hidden mt-2">
                      <div className={`${item.progression === 100 ? 'bg-green-500' : 'bg-primary'} h-full`} style={{ width: `${item.progression}%` }}></div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails de l'Intervention (Droite) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-outline/10 shadow-lg overflow-hidden flex flex-col">
          {selectedRepair ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
              {/* Entête OR */}
              <div className="p-6 bg-primary/[0.03] border-b border-outline/10 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                   <div className="w-20 h-20 rounded-2xl bg-on-surface text-white flex flex-col items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-3xl">assignment</span>
                    <span className="text-[10px] font-black mt-1">DOSSIER</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-mono font-black text-primary italic tracking-tighter">OR-{selectedRepair.id.toString().padStart(4, '0')}</h2>
                    <p className="text-on-surface font-bold text-lg">{selectedRepair.vehicule_plate} - {selectedRepair.categorie}</p>
                    <div className="mt-2 flex gap-3">
                      <span className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${selectedRepair.priorite === 'URGENTE' ? 'bg-red-600 text-white animate-pulse' : 'bg-surface-container text-on-surface-variant'}`}>
                        PRIORITÉ: {selectedRepair.priorite}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                        TECHNICIEN: {selectedRepair.technicien_name || 'NON ASSIGNÉ'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleUpdateStatus(selectedRepair.id, 'TERMINE')}
                    className="p-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm"
                    title="Marquer comme Terminé"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                  </button>
                  <button className="p-2 hover:bg-surface-container rounded-xl transition-colors text-on-surface-variant">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Info & Description */}
                <div className="w-full lg:w-1/2 border-r border-outline/10 p-8 space-y-8 overflow-y-auto">
                   <div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-4">Symptômes & Diagnostic</h3>
                     <div className="p-6 bg-surface-container/20 rounded-2xl border border-outline/5 shadow-inner">
                        <p className="text-sm font-medium leading-relaxed text-on-surface italic">
                          "{selectedRepair.description || "Aucune description détaillée."}"
                        </p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-outline/10 shadow-sm">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase mb-1">Kilométrage</p>
                        <p className="text-lg font-black text-on-surface font-mono">{selectedRepair.kilometrage?.toLocaleString() || '0'} KM</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-outline/10 shadow-sm">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase mb-1">Ouverture</p>
                        <p className="text-sm font-bold text-on-surface">{new Date(selectedRepair.date_creation).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <div className="pt-8">
                      <button 
                        onClick={() => navigate('/factures', { state: { repairId: selectedRepair.id } })}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-on-primary rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs"
                      >
                        <span className="material-symbols-outlined">receipt_long</span>
                        <span>Passer à la Facturation</span>
                      </button>
                   </div>
                </div>

                {/* Progression & Actions */}
                <div className="flex-1 p-8 space-y-8 bg-surface-container/5 overflow-y-auto">
                   <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Avancement Technique</h3>
                        <span className="text-2xl font-black text-primary">{selectedRepair.progression}%</span>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-outline/10 shadow-sm space-y-8">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, selectedRepair.progression - 10)}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl border border-outline/10 hover:bg-surface-container transition-all text-on-surface-variant shadow-sm"
                          >
                            <span className="material-symbols-outlined text-2xl">remove</span>
                          </button>
                          
                          <div className="flex-1 h-4 bg-surface-container rounded-full overflow-hidden p-1 border border-outline/5 shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 shadow-sm ${selectedRepair.progression === 100 ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${selectedRepair.progression}%` }}
                            ></div>
                          </div>

                          <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, selectedRepair.progression + 10)}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl border border-outline/10 hover:bg-surface-container transition-all text-on-surface-variant shadow-sm"
                          >
                            <span className="material-symbols-outlined text-2xl">add</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, 50)}
                            className="py-3 px-4 rounded-xl border border-outline/10 text-[10px] font-black uppercase hover:bg-primary/5 transition-all"
                           >
                            Étape 50%
                           </button>
                           <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, 100)}
                            className="py-3 px-4 rounded-xl border border-outline/10 text-[10px] font-black uppercase hover:bg-green-50 hover:text-green-700 transition-all"
                           >
                            Terminé (100%)
                           </button>
                        </div>
                      </div>

                      <div className="p-6 bg-white rounded-2xl border border-outline/10 shadow-sm flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">info</span>
                         </div>
                         <p className="text-xs font-bold text-on-surface-variant">
                           La progression impacte directement la satisfaction client. Assurez-vous de mettre à jour chaque étape.
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20">
              <span className="material-symbols-outlined text-6xl mb-4">engineering</span>
              <p className="font-black uppercase tracking-[0.3em]">Sélectionnez une réparation</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Créer un Ordre de Réparation">
        <RepairForm onSubmit={handleAddRepair} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Repairs;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  Download, 
  User, 
  Calendar, 
  Gauge, 
  Info,
  Edit,
  ArrowRightCircle
} from 'lucide-react';
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
  devis?: Quote[];
}

interface Quote {
  id: number;
  statut: string;
}

const Repairs: React.FC = () => {
  const navigate = useNavigate();

  const getLatestQuote = (repair: Repair) => {
    if (!repair.devis || repair.devis.length === 0) return null;
    return repair.devis[repair.devis.length - 1];
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRepairs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('reparations/');
      const data = Array.isArray(response.data) ? response.data : [];
      setRepairs(data);
      
      setSelectedRepair(prev => {
        if (!prev && data.length > 0) return data[0];
        if (prev) {
          const updated = data.find(r => r.id === prev.id);
          return updated || prev;
        }
        return prev;
      });
    } catch (error) {
      console.error('Erreur chargement réparations:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  const handleUpdateStatus = async (repairId: number, newStatus: string) => {
    try {
      const payload: any = { statut: newStatus };
      if (newStatus === 'TERMINE') {
        payload.progression = 100;
      }
      await api.patch(`reparations/${repairId}/`, payload);
      fetchRepairs(true); // silent fetch
    } catch (error) {
      console.error('Erreur statut:', error);
    }
  };

  const handleUpdateProgress = async (repairId: number, newProgress: number) => {
    try {
      const progression = Math.min(100, Math.max(0, newProgress));
      const payload: any = { progression };
      if (progression === 100) {
        payload.statut = 'TERMINE';
      } else if (progression > 0) {
        payload.statut = 'EN_COURS';
      }
      await api.patch(`reparations/${repairId}/`, payload);
      fetchRepairs(true); // silent fetch
    } catch (error) {
      console.error('Erreur progression:', error);
    }
  };

  const handleAddRepair = async (data: any) => {
    try {
      if (editingRepair) {
        await api.patch(`reparations/${editingRepair.id}/`, data);
      } else {
        await api.post('reparations/', data);
      }
      setIsModalOpen(false);
      setEditingRepair(null);
      fetchRepairs(true); // silent fetch
    } catch (error) {
      alert('Erreur lors de la création/modification de l\'OR.');
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
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Atelier & Maintenance</h1>
          <p className="text-slate-500 font-medium">Suivi des ordres de réparation et progression technique.</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-white border border-emerald-100/50 text-slate-500 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-500 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Registre</span>
          </button>
          <button 
            onClick={() => navigate('/staff/reception')}
            className="btn-primary-luxury flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvel OR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* File d'attente (Gauche) */}
        <div className="col-span-12 lg:col-span-4 card-luxury overflow-hidden flex flex-col">
          <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="N° OR, Plaque, Catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-emerald-100/50 rounded-2xl outline-none focus:border-emerald-500/50 transition-all duration-500 text-sm font-bold placeholder:text-slate-300 shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-emerald-50/20 custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Chargement atelier...</p>
              </div>
            ) : filteredRepairs.length === 0 ? (
              <div className="p-12 text-center opacity-40 grayscale space-y-4">
                <Wrench className="w-12 h-12 mx-auto text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucun OR en cours</p>
              </div>
            ) : filteredRepairs.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedRepair(item)}
                className={`p-6 cursor-pointer transition-all duration-500 hover:bg-emerald-50/30 flex items-center gap-5 group ${selectedRepair?.id === item.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 translate-x-1' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 ${selectedRepair?.id === item.id ? 'bg-emerald-600 text-white shadow-emerald-200 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                  {item.progression === 100 ? <CheckCircle2 className="w-7 h-7" /> : <Wrench className="w-7 h-7" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-black text-emerald-600 text-base tracking-tighter uppercase">OR-{item.id.toString().padStart(4, '0')}</p>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate mt-0.5">{item.vehicule_plate}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate mt-1">{item.categorie}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                   <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                      item.statut === 'EN_COURS' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                      item.statut === 'TERMINE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.statut === 'EN_COURS' ? 'En cours' : item.statut === 'TERMINE' ? 'Terminé' : item.statut}
                    </span>
                    <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`${item.progression === 100 ? 'bg-emerald-500' : 'bg-emerald-400'} h-full transition-all duration-1000`} 
                        style={{ width: `${item.progression}%` }}
                      ></div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails de l'Intervention (Droite) */}
        <div className="col-span-12 lg:col-span-8 card-luxury overflow-hidden flex flex-col relative">
          {selectedRepair ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-700">
              {/* Entête OR */}
              <div className="p-10 bg-emerald-50/10 border-b border-emerald-50/50 flex justify-between items-start">
                <div className="flex gap-10 items-center">
                   <div className="w-24 h-24 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl rotate-3">
                    <FileText className="w-10 h-10 mb-1" />
                    <span className="text-[8px] font-black tracking-[0.4em] text-emerald-400 uppercase">Fiche</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl font-mono font-black text-emerald-600 italic tracking-tighter">OR-{selectedRepair.id.toString().padStart(4, '0')}</h2>
                      <div className="h-2 w-10 bg-emerald-500 rounded-full opacity-20"></div>
                    </div>
                    <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">{selectedRepair.vehicule_plate} — {selectedRepair.categorie}</p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <span className={`flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-2xl shadow-sm border uppercase tracking-widest ${selectedRepair.priorite === 'URGENTE' ? 'bg-rose-600 text-white border-rose-500 animate-pulse' : 'bg-white text-slate-500 border-slate-100'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        PRIORITÉ: {selectedRepair.priorite}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-white border border-emerald-100/50 px-4 py-2 rounded-2xl shadow-sm uppercase tracking-widest">
                        <User className="w-3 h-3 text-emerald-500" />
                        TECH: {selectedRepair.technicien_name?.toUpperCase() || 'À ASSIGNER'}
                      </span>
                      {getLatestQuote(selectedRepair) ? (
                        <span className={`flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-2xl shadow-sm border uppercase tracking-widest ${
                          getLatestQuote(selectedRepair)?.statut === 'ACCEPTE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          getLatestQuote(selectedRepair)?.statut === 'FACTURE' ? 'bg-slate-900 text-white border-slate-800' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          <BarChart3 className="w-3 h-3" />
                          DEVIS: {getLatestQuote(selectedRepair)?.statut}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 px-4 py-2 rounded-2xl shadow-sm uppercase tracking-widest">
                          <Info className="w-3 h-3" />
                          AUCUN DEVIS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {selectedRepair.statut !== 'TERMINE' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedRepair.id, 'TERMINE')}
                      className="p-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl transition-all shadow-xl shadow-emerald-100 hover:-translate-y-1"
                      title="Marquer comme Terminé"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setEditingRepair(selectedRepair);
                      setIsModalOpen(true);
                    }}
                    className="p-3.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all duration-500"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Info & Description */}
                <div className="w-full lg:w-1/2 border-r border-emerald-50/50 p-10 space-y-10 overflow-y-auto custom-scrollbar bg-emerald-50/5">
                   <div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 ml-2">Diagnostic & Symptômes</h3>
                     <div className="p-8 bg-white rounded-xl border border-emerald-100/30 shadow-inner relative overflow-hidden group">
                        <p className="text-base font-medium leading-relaxed text-slate-600 italic relative z-10">
                          "{selectedRepair.description || "Aucune description détaillée n'a été renseignée pour cet ordre."}"
                        </p>
                        <Wrench className="absolute -right-6 -bottom-6 w-24 h-24 text-emerald-500/5 group-hover:scale-110 transition-transform duration-1000" />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="card-luxury p-6 group">
                        <div className="flex items-center gap-3 mb-4">
                          <Gauge className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kilométrage</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter group-hover:text-emerald-600 transition-colors">{selectedRepair.kilometrage?.toLocaleString() || '0'} <span className="text-xs font-bold text-slate-400">KM</span></p>
                      </div>
                      <div className="card-luxury p-6 group">
                        <div className="flex items-center gap-3 mb-4">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ouverture OR</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-600 transition-colors">{new Date(selectedRepair.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                      </div>
                   </div>

                   <div className="pt-6">
                      <button 
                        onClick={() => navigate('/staff/factures', { state: { repairId: selectedRepair.id } })}
                        className={`w-full flex items-center justify-center gap-4 py-5 rounded-xl font-black shadow-2xl transition-all duration-700 uppercase tracking-[0.2em] text-xs ${
                          selectedRepair.progression === 100 
                          ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1' 
                          : 'bg-slate-900 text-white shadow-slate-200 hover:bg-emerald-600'
                        }`}
                      >
                        <ArrowRightCircle className="w-5 h-5" />
                        <span>{selectedRepair.progression === 100 ? 'Générer la Facture Finale' : 'Préparer la Facturation'}</span>
                      </button>
                   </div>
                </div>

                {/* Progression & Actions */}
                <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar bg-white">
                   <div className="space-y-10">
                      <div className="flex justify-between items-end">
                        <div className="space-y-2">
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Progression des Travaux</h3>
                          <p className="text-6xl font-black text-emerald-600 tracking-tighter italic">{selectedRepair.progression}<span className="text-2xl not-italic text-emerald-200">%</span></p>
                        </div>
                        <div className={`p-4 rounded-3xl ${selectedRepair.progression === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} transition-all duration-700`}>
                          {selectedRepair.progression === 100 ? <CheckCircle2 className="w-10 h-10" /> : <Clock className="w-10 h-10 animate-spin-slow" />}
                        </div>
                      </div>

                      <div className="card-luxury p-10 bg-slate-50/50 space-y-10">
                        <div className="flex items-center gap-8">
                          <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, selectedRepair.progression - 10)}
                            className="w-16 h-16 flex items-center justify-center rounded-xl bg-white border border-emerald-100/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-500 text-slate-400 shadow-xl shadow-emerald-900/5 active:scale-90"
                          >
                            <span className="text-3xl font-black">-</span>
                          </button>
                          
                          <div className="flex-1 h-6 bg-white rounded-full overflow-hidden p-1.5 border border-emerald-100/30 shadow-inner relative group">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 shadow-xl ${selectedRepair.progression === 100 ? 'bg-emerald-500 shadow-emerald-200' : 'bg-emerald-400 shadow-emerald-100'}`}
                              style={{ width: `${selectedRepair.progression}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <span className="text-[10px] font-black text-emerald-900 tracking-widest uppercase">Mise à jour en direct</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, selectedRepair.progression + 10)}
                            className="w-16 h-16 flex items-center justify-center rounded-xl bg-white border border-emerald-100/50 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all duration-500 text-slate-400 shadow-xl shadow-emerald-900/5 active:scale-90"
                          >
                            <span className="text-3xl font-black">+</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, 50)}
                            className="py-4 px-6 rounded-2xl bg-white border border-emerald-100/30 text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all duration-500 shadow-sm"
                           >
                            Étape 50%
                           </button>
                           <button 
                            onClick={() => handleUpdateProgress(selectedRepair.id, 100)}
                            className="py-4 px-6 rounded-2xl bg-slate-900 text-white border border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all duration-500 shadow-lg"
                           >
                            Terminé (100%)
                           </button>
                        </div>
                      </div>

                      <div className="card-luxury p-8 flex items-center gap-6 bg-emerald-600 text-white shadow-emerald-200 group overflow-hidden relative">
                         <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10">
                            <Info className="w-8 h-8" />
                         </div>
                         <div className="relative z-10 flex-1">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Information Atelier</p>
                           <p className="text-sm font-medium leading-tight">
                             La satisfaction client dépend de la précision de votre suivi. Validez chaque étape technique.
                           </p>
                         </div>
                         <Wrench className="absolute -right-4 -top-4 w-20 h-20 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-40 opacity-20 text-slate-400 grayscale">
              <div className="w-24 h-24 bg-emerald-50 rounded-xl flex items-center justify-center mb-10 shadow-inner">
                <Wrench className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-2xl">Atelier Technique</p>
              <p className="text-[10px] font-bold mt-6 tracking-[0.3em]">SÉLECTIONNEZ UN ORDRE DE RÉPARATION</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingRepair(null);
        }} 
        title={editingRepair ? "Modifier l'Ordre de Réparation" : "Créer un Ordre de Réparation"}
      >
        <RepairForm 
          onSubmit={handleAddRepair} 
          onCancel={() => {
            setIsModalOpen(false);
            setEditingRepair(null);
          }} 
          initialData={editingRepair}
        />
      </Modal>
    </div>
  );
};

export default Repairs;

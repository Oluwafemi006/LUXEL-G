import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Car, 
  Settings, 
  Calendar, 
  ChevronRight, 
  History, 
  Wrench, 
  Users,
  Edit,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import Modal from '../components/Modal';
import VehicleForm from '../components/forms/VehicleForm';
import api, { fetchAllPages } from '../services/api';

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee?: number;
  couleur?: string;
  vin?: string;
  client: number;
  client_name?: string;
}

interface Repair {
  id: number;
  categorie: string;
  description: string;
  statut: string;
  date_creation: string;
  facture?: {
    total_ttc: number;
  };
}

const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<Repair[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // AI summary removed: endpoint unavailable

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailMobile, setShowDetailMobile] = useState(false);

  const fetchVehicles = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchAllPages<Vehicle>('vehicules/');
      setVehicles(data);
      
      setSelectedVehicle(prev => {
        const stateId = (location.state as any)?.selectedId;
        if (stateId) {
          const found = data.find((v: any) => v.id === stateId);
          if (found) return found;
        }
        if (!prev && data.length > 0) return data[0];
        if (prev) {
          const updated = data.find((v: any) => v.id === prev.id);
          return updated || prev;
        }
        return prev;
      });
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // AI repair summary removed: endpoint no longer available

  useEffect(() => {
    if (selectedVehicle) {
      setAiSummary(null);
      const fetchHistory = async () => {
        try {
          setHistoryLoading(true);
          const response = await api.get(`vehicules/${selectedVehicle.id}/historique/`);
          setVehicleHistory(response.data);
        } catch (error) {
          console.error('Erreur historique:', error);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [selectedVehicle]);

  const handleAddVehicle = async (data: any) => {
    try {
      if (editingVehicle) {
        await api.patch(`vehicules/${editingVehicle.id}/`, data);
      } else {
        await api.post('vehicules/', data);
      }
      setIsModalOpen(false);
      setEditingVehicle(null);
      fetchVehicles(true);
    } catch (error) {
      alert('Erreur lors de la création/modification du véhicule.');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      (v.immatriculation || "").toLowerCase().includes(s) ||
      (v.marque || "").toLowerCase().includes(s) ||
      (v.modele || "").toLowerCase().includes(s) ||
      (v.client_name || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Parc Automobile</h1>
          <p className="text-slate-500 font-medium">Suivi technique et administratif des véhicules.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary-luxury flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Véhicule</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8 h-auto lg:h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* Liste des Véhicules (Gauche) */}
        <div className={`col-span-12 lg:col-span-4 card-luxury overflow-hidden flex flex-col ${showDetailMobile ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Immatriculation, marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-emerald-100/50 rounded-2xl outline-none focus:border-emerald-500/50 transition-all duration-500 text-sm font-bold placeholder:text-slate-300 shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-emerald-50/20 custom-scrollbar min-h-[400px]">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Analyse du parc...</p>
              </div>
            ) : filteredVehicles.map((v) => (
              <div 
                key={v.id} 
                onClick={() => { setSelectedVehicle(v); setShowDetailMobile(true); }}
                className={`p-6 cursor-pointer transition-all duration-500 hover:bg-emerald-50/30 flex items-center gap-5 group ${selectedVehicle?.id === v.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 lg:translate-x-1' : ''}`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 ${selectedVehicle?.id === v.id ? 'bg-emerald-600 text-white shadow-emerald-200 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                  <Car className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-black text-emerald-600 text-sm sm:text-base tracking-tighter uppercase">{v.immatriculation}</p>
                  <p className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-tight truncate mt-0.5">{v.marque} {v.modele}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate mt-1">{v.client_name}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all duration-500 ${selectedVehicle?.id === v.id ? 'text-emerald-500 translate-x-1' : 'text-slate-200 group-hover:text-slate-400'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Détails du Véhicule (Droite) */}
        <div className={`col-span-12 lg:col-span-8 card-luxury overflow-hidden flex flex-col relative ${showDetailMobile ? 'flex' : 'hidden lg:flex'}`}>
          {selectedVehicle ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-700">
              {/* Entête Fiche Technique */}
              <div className="p-6 sm:p-10 bg-emerald-50/10 border-b border-emerald-50/50 flex flex-col space-y-6">
                <button 
                  onClick={() => setShowDetailMobile(false)}
                  className="lg:hidden flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 self-start"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start text-center sm:text-left">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl rotate-3 group transition-transform duration-700 hover:rotate-0 flex-shrink-0">
                      <Car className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
                      <span className="text-[7px] sm:text-[8px] font-black tracking-[0.4em] text-emerald-400">LUXEL-G</span>
                    </div>
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <h2 className="text-3xl sm:text-5xl font-mono font-black text-emerald-600 italic tracking-tighter uppercase truncate w-full sm:w-auto">{selectedVehicle.immatriculation}</h2>
                        <div className="hidden sm:block h-2 w-10 bg-emerald-500 rounded-full opacity-20"></div>
                      </div>
                      <p className="text-slate-900 font-black text-xl sm:text-2xl uppercase tracking-tighter truncate">{selectedVehicle.marque} {selectedVehicle.modele}</p>
                      <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-3">
                        <span className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-3 sm:px-4 py-2 rounded-2xl shadow-sm">
                          <Users className="w-3 h-3 text-emerald-500" />
                          {selectedVehicle.client_name?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto justify-center">
                    <button 
                      onClick={() => navigate('/staff/reception', { state: { vehicleId: selectedVehicle.id } })}
                      className="p-3 sm:p-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl transition-all shadow-xl shadow-emerald-100"
                      title="Ouvrir une Réception"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingVehicle(selectedVehicle);
                        setIsModalOpen(true);
                      }}
                      className="p-3 sm:p-3.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all duration-500"
                      title="Modifier Véhicule"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Spécifications */}
                <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-emerald-50/50 p-6 sm:p-8 space-y-6 sm:space-y-8 bg-emerald-50/5 overflow-y-auto custom-scrollbar max-h-[300px] lg:max-h-full">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Fiche Technique</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                      <div className="card-luxury p-4 sm:p-5 bg-white/50 backdrop-blur-sm group hover:bg-white transition-all duration-500">
                        <div className="flex items-center gap-3 mb-2 sm:mb-3">
                          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur</p>
                        </div>
                        <p className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">{selectedVehicle.couleur || 'Non spécifiée'}</p>
                      </div>
                      <div className="card-luxury p-4 sm:p-5 bg-white/50 backdrop-blur-sm group hover:bg-white transition-all duration-500">
                        <div className="flex items-center gap-3 mb-2 sm:mb-3">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Millésime</p>
                        </div>
                        <p className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">{selectedVehicle.annee || 'Inconnue'}</p>
                      </div>
                   </div>
                </div>

                {/* Historique */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 sm:space-y-10 custom-scrollbar bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                      <History className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                      Interventions
                    </h3>
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleGenerateAISummary}
                            disabled={aiLoading || vehicleHistory.length === 0}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${aiLoading ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 disabled:opacity-50'}`}
                        >
                            <Sparkles className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
                            {aiLoading ? 'Analyse...' : 'Résumé IA'}
                        </button>
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                          <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-widest">{vehicleHistory.length} Dossiers</span>
                        </div>
                    </div>
                  </div>

                  {aiSummary && (
                    <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">Résumé Intelligent</h4>
                            </div>
                            <p className="text-base sm:text-lg font-medium leading-relaxed italic">
                                "{aiSummary}"
                            </p>
                        </div>
                        <Sparkles className="absolute -right-10 -bottom-10 w-32 h-32 sm:w-40 sm:h-40 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                    </div>
                  )}

                  {historyLoading ? (
                    <div className="py-20 sm:py-40 text-center flex flex-col items-center gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="font-black text-emerald-600 uppercase text-[9px] tracking-widest">Chargement...</p>
                    </div>
                  ) : vehicleHistory.length === 0 ? (
                    <div className="py-20 sm:py-40 text-center text-slate-300 space-y-6 grayscale">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Aucun historique</p>
                    </div>
                  ) : (
                    <div className="space-y-6 sm:space-y-8 relative border-l-4 border-emerald-50 ml-2 sm:ml-3">
                      {vehicleHistory.map((h) => (
                        <div key={h.id} className="relative pl-6 sm:pl-10">
                          <div className="absolute -left-[10px] sm:-left-[14px] top-0 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white border-4 border-emerald-500 shadow-xl shadow-emerald-200"></div>
                          <div className="card-luxury p-5 sm:p-8 hover:bg-emerald-50/20 transition-all duration-700">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                              <span className="font-mono text-[10px] font-black text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 shadow-inner tracking-widest uppercase">OR-{h.id.toString().padStart(4, '0')}</span>
                              <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{new Date(h.date_creation).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <h4 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter mb-2 truncate w-full">{h.categorie}</h4>
                            <p className="text-xs sm:text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed italic">"{h.description}"</p>
                            <div className="mt-6 pt-6 border-t border-emerald-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                               <span className={`px-4 py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                                h.statut === 'TERMINE' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                               }`}>
                                {h.statut === 'TERMINE' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {h.statut}
                               </span>
                               {h.facture && (
                                <div className="text-left sm:text-right w-full sm:w-auto">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Facturé</p>
                                  <p className="text-base sm:text-lg font-black text-slate-900 italic">{Number(h.facture.total_ttc).toLocaleString()} F</p>
                                </div>
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 sm:p-40 opacity-20 text-slate-400 grayscale">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-xl flex items-center justify-center mb-10 shadow-inner">
                <Car className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-xl sm:text-2xl text-center">Parc Automobile</p>
              <p className="text-[10px] font-bold mt-6 tracking-[0.3em] text-center">SÉLECTIONNEZ UN VÉHICULE DANS LA LISTE</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingVehicle(null);
        }} 
        title={editingVehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}
      >
        <VehicleForm 
          onSubmit={handleAddVehicle} 
          onCancel={() => {
            setIsModalOpen(false);
            setEditingVehicle(null);
          }}
          initialData={editingVehicle}
        />
      </Modal>
    </div>
  );
};

export default Vehicles;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Car, 
  Settings, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  History, 
  Wrench, 
  Users,
  Edit,
  Receipt,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';
import Modal from '../components/Modal';
import VehicleForm from '../components/forms/VehicleForm';
import api from '../services/api';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<Repair[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVehicles = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('vehicules/');
      const data = Array.isArray(response.data) ? response.data : [];
      setVehicles(data);
      
      setSelectedVehicle(prev => {
        if (!prev && data.length > 0) return data[0];
        if (prev) {
          const updated = data.find(v => v.id === prev.id);
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

  useEffect(() => {
    if (selectedVehicle) {
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

      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* Liste des Véhicules (Gauche) */}
        <div className="col-span-12 lg:col-span-4 card-luxury overflow-hidden flex flex-col">
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
          
          <div className="flex-1 overflow-y-auto divide-y divide-emerald-50/20 custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Analyse du parc...</p>
              </div>
            ) : filteredVehicles.map((v) => (
              <div 
                key={v.id} 
                onClick={() => setSelectedVehicle(v)}
                className={`p-6 cursor-pointer transition-all duration-500 hover:bg-emerald-50/30 flex items-center gap-5 group ${selectedVehicle?.id === v.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 translate-x-1' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 ${selectedVehicle?.id === v.id ? 'bg-emerald-600 text-white shadow-emerald-200 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                  <Car className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-black text-emerald-600 text-base tracking-tighter uppercase">{v.immatriculation}</p>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate mt-0.5">{v.marque} {v.modele}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate mt-1">{v.client_name}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all duration-500 ${selectedVehicle?.id === v.id ? 'text-emerald-500 translate-x-1' : 'text-slate-200 group-hover:text-slate-400'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Détails du Véhicule (Droite) */}
        <div className="col-span-12 lg:col-span-8 card-luxury overflow-hidden flex flex-col relative">
          {selectedVehicle ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-700">
              {/* Entête Fiche Technique */}
              <div className="p-10 bg-emerald-50/10 border-b border-emerald-50/50 flex justify-between items-start">
                <div className="flex gap-10 items-center">
                   <div className="w-24 h-24 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl rotate-3 group transition-transform duration-700 hover:rotate-0">
                    <Car className="w-10 h-10 mb-1" />
                    <span className="text-[8px] font-black tracking-[0.4em] text-emerald-400">LUXEL-G</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl font-mono font-black text-emerald-600 italic tracking-tighter uppercase">{selectedVehicle.immatriculation}</h2>
                      <div className="h-2 w-10 bg-emerald-500 rounded-full opacity-20"></div>
                    </div>
                    <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">{selectedVehicle.marque} {selectedVehicle.modele}</p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                        <Users className="w-3 h-3 text-emerald-500" />
                        PROPRIÉTAIRE: {selectedVehicle.client_name?.toUpperCase()}
                      </span>
                      {selectedVehicle.vin && (
                        <span className="flex items-center gap-2 text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-4 py-2 rounded-2xl shadow-sm">
                          <ShieldCheck className="w-3 h-3" />
                          VIN: {selectedVehicle.vin}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button 
                    onClick={() => navigate('/staff/reception', { state: { vehicleId: selectedVehicle.id } })}
                    className="p-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl transition-all shadow-xl shadow-emerald-100 hover:-translate-y-1"
                    title="Ouvrir une Réception"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                   <button 
                    onClick={() => navigate('/staff/factures', { state: { vehicleId: selectedVehicle.id } })}
                    className="p-3.5 bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all shadow-xl shadow-slate-900/5 hover:-translate-y-1"
                    title="Voir Factures"
                  >
                    <Receipt className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingVehicle(selectedVehicle);
                      setIsModalOpen(true);
                    }}
                    className="p-3.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all duration-500"
                    title="Modifier Véhicule"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Spécifications */}
                <div className="w-full lg:w-1/3 border-r border-emerald-50/50 p-8 space-y-8 bg-emerald-50/5 overflow-y-auto custom-scrollbar">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Fiche Technique</h3>
                   <div className="space-y-6">
                      <div className="card-luxury p-5 bg-white/50 backdrop-blur-sm group hover:bg-white transition-all duration-500">
                        <div className="flex items-center gap-3 mb-3">
                          <Settings className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur Extérieure</p>
                        </div>
                        <p className="text-base font-black text-slate-900 uppercase tracking-tight">{selectedVehicle.couleur || 'Non spécifiée'}</p>
                      </div>
                      <div className="card-luxury p-5 bg-white/50 backdrop-blur-sm group hover:bg-white transition-all duration-500">
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Millésime / Année</p>
                        </div>
                        <p className="text-base font-black text-slate-900 uppercase tracking-tight">{selectedVehicle.annee || 'Inconnue'}</p>
                      </div>
                      <div className="card-luxury p-5 bg-white/50 backdrop-blur-sm group hover:bg-white transition-all duration-500">
                        <div className="flex items-center gap-3 mb-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N° de Série (VIN)</p>
                        </div>
                        <p className="text-xs font-mono font-black text-emerald-600 tracking-wider break-all">{selectedVehicle.vin || 'Non renseigné'}</p>
                      </div>
                   </div>

                   <div className="p-6 rounded-xl bg-slate-900 text-white space-y-4 shadow-xl">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Statut Administratif</span>
                      </div>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed italic">Véhicule sous contrat de maintenance active chez Luxury Elegance Garage.</p>
                   </div>
                </div>

                {/* Historique */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                      <History className="w-6 h-6 text-emerald-500" />
                      Interventions & Services
                    </h3>
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{vehicleHistory.length} Dossiers</span>
                    </div>
                  </div>

                  {historyLoading ? (
                    <div className="py-40 text-center flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Extraction des données...</p>
                    </div>
                  ) : vehicleHistory.length === 0 ? (
                    <div className="py-40 text-center text-slate-300 space-y-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Wrench className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Aucun historique enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-8 relative border-l-4 border-emerald-50 ml-3">
                      {vehicleHistory.map((h) => (
                        <div key={h.id} className="relative pl-10">
                          <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full bg-white border-4 border-emerald-500 shadow-xl shadow-emerald-200"></div>
                          <div className="card-luxury p-8 hover:bg-emerald-50/20 transition-all duration-700">
                            <div className="flex justify-between items-start mb-4">
                              <span className="font-mono text-xs font-black text-emerald-600 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-inner tracking-widest uppercase">OR-{h.id.toString().padStart(4, '0')}</span>
                              <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{new Date(h.date_creation).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{h.categorie}</h4>
                            <p className="text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed italic">"{h.description}"</p>
                            <div className="mt-8 pt-6 border-t border-emerald-50/50 flex justify-between items-center">
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                                h.statut === 'TERMINE' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                               }`}>
                                {h.statut === 'TERMINE' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {h.statut}
                               </span>
                               {h.facture && (
                                <div className="text-right">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Facturé</p>
                                  <p className="text-lg font-black text-slate-900 italic">{Number(h.facture.total_ttc).toLocaleString()} F</p>
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
            <div className="flex-1 flex flex-col items-center justify-center p-40 opacity-20 text-slate-400 grayscale">
              <div className="w-24 h-24 bg-emerald-50 rounded-xl flex items-center justify-center mb-10 shadow-inner">
                <Car className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-2xl">Parc Automobile</p>
              <p className="text-[10px] font-bold mt-6 tracking-[0.3em]">SÉLECTIONNEZ UN VÉHICULE DANS LA LISTE</p>
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

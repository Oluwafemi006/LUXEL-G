import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [vehicleHistory, setVehicleHistory] = useState<Repair[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('vehicules/');
      const data = Array.isArray(response.data) ? response.data : [];
      setVehicles(data);
      if (data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
    } finally {
      setLoading(false);
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
      await api.post('vehicules/', data);
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error) {
      alert('Erreur lors de l\'ajout du véhicule.');
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Parc Automobile</h1>
          <p className="text-on-surface-variant font-medium">Suivi technique et administratif des véhicules.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Nouveau Véhicule</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Liste des Véhicules (Gauche) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline/10 bg-surface-container/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text"
                placeholder="Immatriculation, marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-outline/20 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-outline/5">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-primary font-bold">Chargement...</div>
            ) : filteredVehicles.map((v) => (
              <div 
                key={v.id} 
                onClick={() => setSelectedVehicle(v)}
                className={`p-4 cursor-pointer transition-all hover:bg-primary/5 flex items-center gap-4 ${selectedVehicle?.id === v.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedVehicle?.id === v.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined">directions_car</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-black text-primary text-sm">{v.immatriculation}</p>
                  <p className="text-xs font-bold text-on-surface truncate">{v.marque} {v.modele}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium truncate">{v.client_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails du Véhicule (Droite) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-outline/10 shadow-lg overflow-hidden flex flex-col">
          {selectedVehicle ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
              {/* Entête Fiche Technique */}
              <div className="p-6 bg-primary/[0.03] border-b border-outline/10 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                   <div className="w-20 h-20 rounded-2xl bg-on-surface text-white flex flex-col items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-3xl">directions_car</span>
                    <span className="text-[10px] font-black mt-1">VÉHICULE</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-mono font-black text-primary italic">{selectedVehicle.immatriculation}</h2>
                    <p className="text-on-surface font-bold text-lg">{selectedVehicle.marque} {selectedVehicle.modele}</p>
                    <div className="mt-2 flex gap-3">
                      <span className="flex items-center gap-1 text-[10px] font-black text-on-surface-variant bg-surface-container px-3 py-1 rounded-full uppercase tracking-widest">
                        PROPRIÉTAIRE: {selectedVehicle.client_name}
                      </span>
                      {selectedVehicle.vin && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                          VIN: {selectedVehicle.vin}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => navigate('/factures', { state: { vehicleId: selectedVehicle.id } })}
                    className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl transition-all"
                    title="Nouvelle Facture"
                  >
                    <span className="material-symbols-outlined">receipt_long</span>
                  </button>
                  <button className="p-2 hover:bg-surface-container rounded-xl transition-colors text-on-surface-variant">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Spécifications */}
                <div className="w-full lg:w-1/3 border-r border-outline/10 p-6 space-y-6 bg-surface-container/5 overflow-y-auto">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Spécifications</h3>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-outline/5 shadow-sm">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase">Couleur</p>
                        <p className="text-sm font-bold text-on-surface">{selectedVehicle.couleur || 'Non spécifiée'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-outline/5 shadow-sm">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase">Année</p>
                        <p className="text-sm font-bold text-on-surface">{selectedVehicle.annee || 'Inconnue'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-outline/5 shadow-sm">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase">N° de Série (VIN)</p>
                        <p className="text-xs font-mono font-black text-primary">{selectedVehicle.vin || 'Non renseigné'}</p>
                      </div>
                   </div>
                </div>

                {/* Historique */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">Interventions & Services</h3>
                    <span className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full font-black">
                      {vehicleHistory.length} Dossiers
                    </span>
                  </div>

                  {historyLoading ? (
                    <div className="py-20 text-center animate-pulse text-on-surface-variant font-bold uppercase text-xs tracking-widest">Mise à jour de l'historique...</div>
                  ) : vehicleHistory.length === 0 ? (
                    <div className="py-20 text-center text-on-surface-variant opacity-40">
                      <p className="text-xs font-bold uppercase tracking-widest">Aucun historique de maintenance.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative border-l-2 border-primary/10 ml-2">
                      {vehicleHistory.map((h) => (
                        <div key={h.id} className="relative pl-6">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm"></div>
                          <div className="bg-white border border-outline/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-mono text-[10px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded">OR-{h.id.toString().padStart(4, '0')}</span>
                              <span className="text-[10px] font-bold text-on-surface-variant">{new Date(h.date_creation).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-black text-on-surface mb-1 uppercase tracking-tight">{h.categorie}</h4>
                            <p className="text-xs text-on-surface-variant line-clamp-2 italic">"{h.description}"</p>
                            <div className="mt-4 pt-4 border-t border-outline/5 flex justify-between items-center">
                               <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                h.statut === 'TERMINE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                               }`}>
                                {h.statut}
                               </span>
                               {h.facture && (
                                <div className="text-right">
                                  <p className="text-[9px] font-black text-on-surface-variant uppercase">Facturé</p>
                                  <p className="text-xs font-black text-primary">{Number(h.facture.total_ttc).toLocaleString()} F</p>
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
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20">
              <span className="material-symbols-outlined text-6xl mb-4">directions_car</span>
              <p className="font-black uppercase tracking-[0.3em]">Sélectionnez un véhicule</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Ajouter un véhicule"
      >
        <VehicleForm 
          onSubmit={handleAddVehicle} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Vehicles;

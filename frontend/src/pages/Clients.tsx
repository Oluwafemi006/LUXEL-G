import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import ClientForm from '../components/forms/ClientForm';
import api from '../services/api';

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}

interface Client {
  id: number;
  nom: string;
  prenoms: string;
  contact: string;
  contact_conducteur?: string;
  email?: string;
  adresse: string;
  date_creation: string;
  vehicule_count: number;
  vehicules_list: Vehicle[];
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

const Clients: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<Repair[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('clients/');
      const data = Array.isArray(response.data) ? response.data : [];
      setClients(data);
      if (data.length > 0 && !selectedClient) {
        setSelectedClient(data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient && selectedClient.vehicules_list && selectedClient.vehicules_list.length > 0) {
      setSelectedVehicle(selectedClient.vehicules_list[0]);
    } else {
      setSelectedVehicle(null);
      setVehicleHistory([]);
    }
  }, [selectedClient]);

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

  const handleAddClient = async (data: any) => {
    try {
      await api.post('clients/', data);
      setIsModalOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error);
      alert('Une erreur est survenue lors de l\'ajout du client.');
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${client.nom} ${client.prenoms}`.toLowerCase();
    return fullName.includes(searchLower) || 
           client.contact.toLowerCase().includes(searchLower) ||
           (client.email && client.email.toLowerCase().includes(searchLower));
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Gestion Clientèle</h1>
          <p className="text-on-surface-variant font-medium">Vue intégrée des dossiers clients et historiques.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Liste des Clients (Colonne Gauche) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline/10 space-y-4 bg-surface-container/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-outline/20 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-outline/5">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-primary font-bold">Chargement...</div>
            ) : filteredClients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className={`p-4 cursor-pointer transition-all hover:bg-primary/5 flex items-center gap-4 ${selectedClient?.id === client.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${selectedClient?.id === client.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                  {(client.nom || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{client.nom} {client.prenoms}</p>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold">
                    <span className="material-symbols-outlined text-[14px]">phone</span>
                    {client.contact}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-black">
                    {client.vehicule_count} VÉH.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails du Client (Colonne Droite) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-outline/10 shadow-lg overflow-hidden flex flex-col">
          {selectedClient ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
              {/* Entête Détails */}
              <div className="p-6 bg-primary/[0.03] border-b border-outline/10 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                   <div className="w-20 h-20 rounded-2xl bg-primary text-on-primary flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">
                    {(selectedClient.nom || "?")[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-on-surface">{selectedClient.nom} {selectedClient.prenoms}</h2>
                    <p className="text-on-surface-variant font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      {selectedClient.adresse}
                    </p>
                    <div className="mt-2 flex gap-3">
                      <span className="flex items-center gap-1 text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        {selectedClient.contact}
                      </span>
                      {selectedClient.email && (
                        <span className="flex items-center gap-1 text-xs font-black text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          {selectedClient.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Liste des Véhicules */}
                <div className="w-1/3 border-r border-outline/10 overflow-y-auto p-4 space-y-4 bg-surface-container/5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2">Parc Automobile</h3>
                  {selectedClient.vehicules_list.map((v) => (
                    <div 
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedVehicle?.id === v.id ? 'bg-white border-primary shadow-md' : 'bg-transparent border-outline/10 hover:border-primary/50'}`}
                    >
                      <p className="font-mono text-sm font-black text-primary">{v.immatriculation}</p>
                      <p className="text-xs font-bold text-on-surface">{v.marque} {v.modele}</p>
                    </div>
                  ))}
                  {selectedClient.vehicules_list.length === 0 && (
                    <p className="text-center py-8 text-xs font-bold text-on-surface-variant">Aucun véhicule.</p>
                  )}
                </div>

                {/* Historique des Réparations */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">Historique de Maintenance</h3>
                    {selectedVehicle && (
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {selectedVehicle.immatriculation}
                      </span>
                    )}
                  </div>

                  {historyLoading ? (
                    <div className="py-20 text-center animate-pulse text-on-surface-variant font-bold uppercase text-xs tracking-widest">Récupération de l'historique...</div>
                  ) : !selectedVehicle ? (
                    <div className="py-20 text-center text-on-surface-variant opacity-40">
                      <span className="material-symbols-outlined text-4xl block mb-2">directions_car</span>
                      <p className="text-xs font-bold">Sélectionnez un véhicule</p>
                    </div>
                  ) : vehicleHistory.length === 0 ? (
                    <div className="py-20 text-center text-on-surface-variant opacity-40">
                      <p className="text-xs font-bold">Aucune intervention enregistrée.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative border-l-2 border-primary/10 ml-2">
                      {vehicleHistory.map((h) => (
                        <div key={h.id} className="relative pl-6">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm"></div>
                          <div className="bg-white border border-outline/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-mono text-[10px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded">OR-{h.id.toString().padStart(4, '0')}</span>
                              <span className="text-[10px] font-bold text-on-surface-variant">{new Date(h.date_creation).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-black text-on-surface mb-1">{h.categorie}</h4>
                            <p className="text-xs text-on-surface-variant line-clamp-2">{h.description}</p>
                            <div className="mt-4 pt-4 border-t border-outline/5 flex justify-between items-center">
                               <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                h.statut === 'TERMINE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                               }`}>
                                {h.statut}
                               </span>
                               {h.facture && (
                                <span className="text-xs font-black text-on-surface">
                                  {Number(h.facture.total_ttc).toLocaleString()} F
                                </span>
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
              <span className="material-symbols-outlined text-6xl mb-4">group</span>
              <p className="font-black uppercase tracking-[0.3em]">Sélectionnez un dossier client</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Ajouter un nouveau client"
      >
        <ClientForm 
          onSubmit={handleAddClient} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Clients;

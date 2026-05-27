import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Edit, 
  History, 
  Wrench, 
  Car, 
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import Modal from '../components/Modal';
import ClientForm from '../components/forms/ClientForm';
import api, { fetchAllPages } from '../services/api';

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
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<Repair[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailMobile, setShowDetailMobile] = useState(false);

  const fetchClients = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchAllPages<Client>('clients/');
      setClients(data);
      
      setSelectedClient(prev => {
        if (!prev && data.length > 0) return data[0];
        if (prev) {
          const updated = data.find((c: any) => c.id === prev.id);
          return updated || prev;
        }
        return prev;
      });
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      if (!silent) setLoading(false);
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
      if (editingClient) {
        await api.patch(`clients/${editingClient.id}/`, data);
      } else {
        await api.post('clients/', data);
      }
      setIsModalOpen(false);
      setEditingClient(null);
      fetchClients(true);
    } catch (error) {
      console.error('Erreur lors de la modification/ajout du client:', error);
      alert('Une erreur est survenue lors de la sauvegarde du client.');
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${client.nom || ""} ${client.prenoms || ""}`.toLowerCase();
    return fullName.includes(searchLower) || 
           (client.contact || "").toLowerCase().includes(searchLower) ||
           (client.email && client.email.toLowerCase().includes(searchLower));
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Gestion Clientèle</h1>
          <p className="text-slate-500 font-medium">Vue intégrée des dossiers clients et historiques.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary-luxury flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8 h-auto lg:h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* Liste des Clients (Colonne Gauche) */}
        <div className={`col-span-12 lg:col-span-4 card-luxury overflow-hidden flex flex-col ${showDetailMobile ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-emerald-50/50 space-y-4 bg-emerald-50/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Rechercher un client..."
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
                <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Initialisation...</p>
              </div>
            ) : filteredClients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => { setSelectedClient(client); setShowDetailMobile(true); }}
                className={`p-6 cursor-pointer transition-all duration-500 hover:bg-emerald-50/30 flex items-center gap-4 group ${selectedClient?.id === client.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 lg:translate-x-1' : ''}`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-all duration-700 ${selectedClient?.id === client.id ? 'bg-emerald-600 text-white shadow-emerald-200 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                  {(client.nom || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-emerald-600 transition-colors duration-500">{client.nom} {client.prenoms}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    {client.contact}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[8px] px-2.5 py-1 rounded-full font-black tracking-widest ${selectedClient?.id === client.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                    {client.vehicule_count} VÉH.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails du Client (Colonne Droite) */}
        <div className={`col-span-12 lg:col-span-8 card-luxury overflow-hidden flex flex-col relative ${showDetailMobile ? 'flex' : 'hidden lg:flex'}`}>
          {selectedClient ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-700">
              {/* Entête Détails */}
              <div className="p-6 sm:p-10 bg-emerald-50/10 border-b border-emerald-50/50 flex flex-col space-y-6">
                <button 
                  onClick={() => setShowDetailMobile(false)}
                  className="lg:hidden flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 self-start"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste
                </button>

                <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start">
                   <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-black shadow-2xl shadow-emerald-200 rotate-3 flex-shrink-0">
                    {(selectedClient.nom || "?")[0]}
                  </div>
                  <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter truncate w-full sm:w-auto">{selectedClient.nom} {selectedClient.prenoms}</h2>
                      <button 
                        onClick={() => {
                          setEditingClient(selectedClient);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-500"
                        title="Modifier Client"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-slate-400 font-bold flex items-center justify-center sm:justify-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{selectedClient.adresse}</span>
                    </p>
                    <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-3">
                      <span className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-3 sm:px-4 py-2 rounded-2xl shadow-sm">
                        <Phone className="w-3 h-3" />
                        {selectedClient.contact}
                      </span>
                      <a 
                        href={`https://wa.me/229${selectedClient.contact.replace(/\D/g, '').startsWith('229') ? selectedClient.contact.replace(/\D/g, '').substring(3) : selectedClient.contact.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-white bg-[#25D366] px-3 sm:px-4 py-2 rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-500 shadow-sm"
                      >
                        <MessageSquare className="w-3 h-3" />
                        WHATSAPP
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
                {/* Liste des Véhicules */}
                <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-emerald-50/50 overflow-y-auto p-6 space-y-6 bg-emerald-50/5 custom-scrollbar max-h-[300px] sm:max-h-full">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Parc Automobile</h3>
                  <div className="space-y-4">
                    {selectedClient.vehicules_list.map((v) => (
                      <div 
                        key={v.id}
                        onClick={() => setSelectedVehicle(v)}
                        className={`p-4 sm:p-6 rounded-xl border transition-all duration-700 cursor-pointer relative group ${selectedVehicle?.id === v.id ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-900/5 sm:translate-x-1' : 'bg-transparent border-emerald-50 hover:border-emerald-200'}`}
                      >
                        <Car className={`absolute right-4 top-4 w-4 h-4 sm:w-5 sm:h-5 transition-all duration-700 ${selectedVehicle?.id === v.id ? 'text-emerald-500 opacity-100 scale-110' : 'text-slate-100 opacity-0 group-hover:opacity-20'}`} />
                        <p className="font-mono text-sm sm:text-base font-black text-emerald-600 tracking-tighter uppercase">{v.immatriculation}</p>
                        <p className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-tight mt-1">{v.marque} {v.modele}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historique des Réparations */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 sm:space-y-10 custom-scrollbar">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                      <History className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                      Historique de Maintenance
                    </h3>
                    {selectedVehicle && (
                      <button
                        onClick={() => navigate('/staff/reception', { state: { clientId: selectedClient.id, vehicleId: selectedVehicle.id, step: 'REPAIR' } })}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-500"
                      >                          
                        <PlusCircle className="w-3 h-3" />
                        NOUVELLE RÉPARATION
                      </button>
                    )}
                  </div>

                  {historyLoading ? (
                    <div className="py-20 sm:py-40 text-center flex flex-col items-center gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="font-black text-emerald-600 uppercase text-[9px] tracking-widest">Synchronisation...</p>
                    </div>
                  ) : !selectedVehicle ? (
                    <div className="py-20 sm:py-40 text-center text-slate-300 space-y-6 grayscale">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Car className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sélectionnez un véhicule</p>
                    </div>
                  ) : vehicleHistory.length === 0 ? (
                    <div className="py-20 sm:py-40 text-center text-slate-300 space-y-6 grayscale">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Aucune intervention</p>
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
                            <h4 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{h.categorie}</h4>
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
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-xl sm:text-2xl text-center">Dossiers Clients</p>
              <p className="text-[10px] font-bold mt-6 tracking-[0.3em] text-center">SÉLECTIONNEZ UN CLIENT DANS LA LISTE</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }} 
        title={editingClient ? "Modifier le dossier client" : "Ajouter un nouveau client"}
      >
        <ClientForm 
          onSubmit={handleAddClient} 
          onCancel={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }} 
          initialData={editingClient}
        />
      </Modal>
    </div>
  );
};

export default Clients;

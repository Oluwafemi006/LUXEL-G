import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Car, 
  Wrench, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft,
  Users,
  Smartphone,
  Info
} from 'lucide-react';
import api from '../services/api';
import ClientForm from '../components/forms/ClientForm';
import VehicleForm from '../components/forms/VehicleForm';
import RepairForm from '../components/forms/RepairForm';

type Step = 'CLIENT' | 'VEHICLE' | 'REPAIR';

interface Client {
  id: number;
  nom: string;
  prenoms: string;
  contact: string;
  vehicules_list?: any[];
}

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  derniere_visite?: {
    date_expiration: string;
    est_proche: boolean;
  };
}

const Reception: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>('CLIENT');
  
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Selection state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchClients();
    };
    init();
  }, []);

  // Gérer l'auto-sélection depuis la navigation
  useEffect(() => {
    const state = location.state as { clientId?: number, vehicleId?: number, step?: Step };
    if (state?.clientId && clients.length > 0) {
      const client = clients.find(c => c.id === state.clientId);
      if (client) {
        setSelectedClient(client);
        if (state.step) {
          setCurrentStep(state.step);
        } else {
          setCurrentStep('VEHICLE');
        }
        
        if (state.vehicleId && client.vehicules_list) {
          const vehicle = client.vehicules_list.find((v: any) => v.id === state.vehicleId);
          if (vehicle) {
            handleVehicleSelect(vehicle);
          }
        }
      }
    } else if (state?.vehicleId && !state?.clientId) {
        // Cas où on a juste le vehicleId (depuis la page Véhicules)
        const fetchAndSelect = async () => {
            try {
                const res = await api.get(`vehicules/${state.vehicleId}/`);
                const fullVehicle = res.data;
                const clientRes = await api.get(`clients/${fullVehicle.client}/`);
                setSelectedClient(clientRes.data);
                setSelectedVehicle(fullVehicle);
                setCurrentStep('REPAIR');
            } catch(e) { console.error(e); }
        };
        fetchAndSelect();
    }
  }, [clients, location.state]);

  const fetchClients = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('clients/');
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsCreatingNew(false);
    setCurrentStep('VEHICLE');
  };

  const handleVehicleSelect = async (vehicle: Vehicle) => {
    try {
      const response = await api.get(`vehicules/${vehicle.id}/`);
      setSelectedVehicle(response.data);
      setIsCreatingNew(false);
      setCurrentStep('REPAIR');
    } catch (error) {
      console.error('Erreur chargement détails véhicule:', error);
      setSelectedVehicle(vehicle);
      setCurrentStep('REPAIR');
    }
  };

  const handleAddClient = async (data: any) => {
    try {
      const response = await api.post('clients/', data);
      const newClient = response.data;
      setSelectedClient(newClient);
      setIsCreatingNew(false);
      setCurrentStep('VEHICLE');
      fetchClients(true);
    } catch (error) {
      alert('Erreur lors de la création du client.');
    }
  };

  const handleAddVehicle = async (data: any) => {
    try {
      // S'assurer que le client est bien lié
      const vehicleData = { ...data, client: selectedClient?.id };
      const response = await api.post('vehicules/', vehicleData);
      setSelectedVehicle(response.data);
      setIsCreatingNew(false);
      setCurrentStep('REPAIR');
    } catch (error) {
      alert('Erreur lors de la création du véhicule.');
    }
  };

  const handleCreateRepair = async (data: any) => {
    try {
      // S'assurer que le véhicule est bien lié
      const repairData = { ...data, vehicule: selectedVehicle?.id };
      const response = await api.post('reparations/', repairData);
      const newRepair = response.data;
      
      if (window.confirm('Réception terminée ! Voulez-vous établir le DEVIS maintenant ?')) {
        navigate('/staff/devis', { state: { repairId: newRepair.id } });
      } else {
        navigate('/staff/reparations');
      }
    } catch (error) {
      alert('Erreur lors de la création de l\'OR.');
    }
  };

  const filteredClients = clients.filter(c => 
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.prenoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact.includes(searchQuery)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header Titre */}
      <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-1000">
         <h1 className="text-5xl font-black text-slate-900 italic tracking-tighter">Réception Client</h1>
         <p className="text-slate-400 font-medium tracking-widest text-xs uppercase">Processus d'admission Luxury Elegance Garage</p>
         <div className="flex justify-center pt-2">
            <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
         </div>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between no-print px-10 relative animate-in fade-in duration-1000 delay-200">
        <div className="absolute top-1/2 left-20 right-20 h-0.5 bg-emerald-50 -z-0 -translate-y-4"></div>
        {[
          { id: 'CLIENT', label: 'Client', icon: User },
          { id: 'VEHICLE', label: 'Véhicule', icon: Car },
          { id: 'REPAIR', label: 'Admission', icon: Wrench },
        ].map((s, index, arr) => {
          const Icon = s.icon;
          const isDone = arr.findIndex(x => x.id === currentStep) > index;
          const isActive = currentStep === s.id;
          
          return (
            <div key={s.id} className="flex flex-col items-center gap-4 relative z-10">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-700 ${
                isActive ? 'bg-emerald-600 text-white scale-110 shadow-2xl shadow-emerald-200 rotate-3' : 
                (isDone ? 'bg-slate-900 text-emerald-400' : 'bg-white border border-emerald-50 text-slate-300 shadow-sm')
              }`}>
                {isDone ? <CheckCircle2 className="w-8 h-8" /> : <Icon className="w-7 h-7" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card-luxury overflow-hidden min-h-[600px] flex flex-col relative animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-400">
        {/* Step 1: CLIENT */}
        {currentStep === 'CLIENT' && (
          <div className="p-12 flex-1 flex flex-col space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between border-b border-emerald-50/50 pb-8">
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Dossier Propriétaire</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Étape 01 — Identification</p>
              </div>
              <button 
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className={`flex items-center gap-3 px-8 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-500 shadow-xl ${isCreatingNew ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white shadow-emerald-200 hover:-translate-y-1 active:scale-95'}`}
              >
                {isCreatingNew ? <ChevronLeft className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                {isCreatingNew ? 'Retour Recherche' : 'Créer nouveau client'}
              </button>
            </div>

            {isCreatingNew ? (
              <div className="animate-in zoom-in-95 duration-700">
                <ClientForm onSubmit={handleAddClient} onCancel={() => setIsCreatingNew(false)} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-8 animate-in fade-in duration-700">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, prénom ou contact..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 rounded-3xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500/50 outline-none font-bold text-lg shadow-inner transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[450px] custom-scrollbar p-1">
                  {filteredClients.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => handleClientSelect(c)}
                      className="p-6 rounded-xl border border-emerald-100/30 bg-white hover:bg-emerald-50/30 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-900/5 cursor-pointer transition-all duration-700 flex items-center gap-6 group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-2xl group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-3 shadow-inner transition-all duration-700 uppercase">
                        {c.nom[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 uppercase tracking-tight text-lg group-hover:text-emerald-700 transition-colors duration-500">{c.nom} {c.prenoms}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                           <Smartphone className="w-3 h-3 text-emerald-500" />
                           {c.contact}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-100 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-500" />
                    </div>
                  ))}
                  {!loading && filteredClients.length === 0 && (
                    <div className="col-span-2 py-20 text-center opacity-30 grayscale space-y-6">
                       <Users className="w-16 h-16 mx-auto text-slate-200" />
                       <p className="font-black uppercase tracking-[0.4em] text-sm">Aucun client ne correspond</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: VEHICLE */}
        {currentStep === 'VEHICLE' && selectedClient && (
          <div className="p-12 flex-1 flex flex-col space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between border-b border-emerald-50/50 pb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Parc Automobile</h2>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Propriétaire: {selectedClient.nom} {selectedClient.prenoms}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentStep('CLIENT')}
                  className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all duration-500"
                > Retour </button>
                <button 
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-500 shadow-xl ${isCreatingNew ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white shadow-emerald-200 hover:-translate-y-1 active:scale-95'}`}
                >
                  {isCreatingNew ? <Search className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  {isCreatingNew ? 'Choisir Existant' : 'Nouvel enregistrement'}
                </button>
              </div>
            </div>

            {isCreatingNew ? (
              <div className="animate-in zoom-in-95 duration-700">
                <VehicleForm 
                  onSubmit={handleAddVehicle} 
                  onCancel={() => setIsCreatingNew(false)} 
                  initialClientId={selectedClient.id}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700">
                {selectedClient.vehicules_list?.map((v: any) => (
                  <div 
                    key={v.id} 
                    onClick={() => handleVehicleSelect(v)}
                    className="card-luxury p-8 bg-white hover:bg-emerald-50/30 hover:border-emerald-500/50 cursor-pointer transition-all duration-700 flex flex-col gap-6 group relative overflow-hidden"
                  >
                    <Car className="absolute -right-6 -bottom-6 w-24 h-24 text-emerald-500/5 group-hover:scale-110 group-hover:text-emerald-500/10 transition-all duration-1000" />
                    <div className="flex justify-between items-start">
                      <span className="px-5 py-2.5 rounded-full bg-slate-900 text-emerald-400 font-mono font-black text-lg tracking-[0.1em] shadow-xl group-hover:scale-105 transition-all duration-700 uppercase">
                        {v.immatriculation}
                      </span>
                      <CheckCircle2 className="w-6 h-6 text-emerald-100 opacity-0 group-hover:opacity-100 group-hover:text-emerald-500 transition-all duration-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{v.marque}</p>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{v.modele}</p>
                    </div>
                  </div>
                ))}
                {(!selectedClient.vehicules_list || selectedClient.vehicules_list.length === 0) && (
                  <div className="col-span-2 py-20 flex flex-col items-center justify-center opacity-30 grayscale space-y-6">
                    <Car className="w-16 h-16 mx-auto text-slate-200" />
                    <p className="font-black uppercase tracking-[0.4em] text-sm text-center">Aucun véhicule rattaché à ce dossier</p>
                    <button onClick={() => setIsCreatingNew(true)} className="px-8 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all duration-500">Ajouter le premier véhicule</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: REPAIR */}
        {currentStep === 'REPAIR' && selectedVehicle && (
          <div className="p-12 flex-1 flex flex-col space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between border-b border-emerald-50/50 pb-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Admission Technique</h2>
                <div className="flex flex-wrap gap-3">
                   <span className="flex items-center gap-2 text-[8px] font-black bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                      <User className="w-3 h-3" />
                      {selectedClient?.nom}
                   </span>
                   <span className="flex items-center gap-2 text-[8px] font-black bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-[0.2em] shadow-sm">
                      <Car className="w-3 h-3" />
                      {selectedVehicle.immatriculation}
                   </span>
                </div>
              </div>
              <button 
                onClick={() => setCurrentStep('VEHICLE')}
                className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all duration-500"
              > Retour </button>
            </div>

            <div className="bg-emerald-50/5 p-8 rounded-xl border border-emerald-100/30 shadow-inner relative overflow-hidden animate-in zoom-in-95 duration-700">
               <RepairForm 
                onSubmit={handleCreateRepair} 
                onCancel={() => setCurrentStep('VEHICLE')} 
                initialVehicleId={selectedVehicle.id}
              />
              <div className="mt-10 p-6 bg-slate-900 rounded-3xl flex items-start gap-4 shadow-2xl relative z-10">
                 <Info className="w-6 h-6 text-emerald-400 shrink-0" />
                 <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                    L'admission technique déclenche l'ouverture d'un Ordre de Réparation (OR) officiel. Assurez-vous de renseigner tous les symptômes signalés par le client.
                 </p>
              </div>
              <Wrench className="absolute -right-10 -bottom-10 w-40 h-40 text-emerald-500/5 rotate-12" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reception;

import React, { useState, useEffect } from 'react';
import { Car, User, Calendar, Settings, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

interface Client {
  id: number;
  nom: string;
  prenoms: string;
}

interface VehicleFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialClientId?: number;
  initialData?: any;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, onCancel, initialClientId, initialData }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | number>('');

  useEffect(() => {
    if (initialData && initialData.client) {
      setSelectedClientId(initialData.client);
    } else if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId, initialData]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('clients/');
        setClients(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    if (initialClientId) {
      data.client = initialClientId.toString();
    }
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Immatriculation</label>
          <div className="relative group">
            <Car className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="immatriculation"
              required
              defaultValue={initialData?.immatriculation || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-mono font-black text-lg text-slate-900 shadow-inner transition-all uppercase tracking-widest"
              placeholder="XX-0000-XX"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Propriétaire (Client)</label>
          <div className="relative group">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <select 
              name="client"
              required
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={!!initialClientId}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all appearance-none disabled:opacity-60"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom} {c.prenoms}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Marque Automobile</label>
          <div className="relative group">
            <Settings className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="marque"
              required
              defaultValue={initialData?.marque || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Ex: Mercedes-Benz, BMW, Toyota"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Modèle / Version</label>
          <div className="relative group">
            <Settings className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="modele"
              required
              defaultValue={initialData?.modele || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Ex: Classe G, X5, Land Cruiser"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Millésime (Année)</label>
          <div className="relative group">
            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="annee"
              type="number"
              defaultValue={initialData?.annee || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Ex: 2024"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Teinte Extérieure</label>
          <div className="relative group">
            <Settings className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="couleur"
              defaultValue={initialData?.couleur || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Ex: Noir Obsidienne, Blanc Arctique"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">N° d'identification (VIN)</label>
        <div className="relative group">
          <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <input 
            name="vin"
            defaultValue={initialData?.vin || ''}
            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-mono font-black text-slate-900 shadow-inner transition-all uppercase tracking-wider"
            placeholder="Numéro de châssis constructeur"
          />
        </div>
      </div>

      <div className="flex gap-6 pt-10 border-t border-emerald-50 mt-12">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-xl border border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all duration-500"
        >
          <X className="w-4 h-4" />
          Annuler
        </button>
        <button 
          type="submit"
          className="flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-600 transition-all duration-700 active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          {initialData ? 'Enregistrer les modifications' : 'Enregistrer le Véhicule'}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;

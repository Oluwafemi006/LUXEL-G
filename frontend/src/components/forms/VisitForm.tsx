import React, { useState, useEffect } from 'react';
import { Car, Calendar, ShieldCheck, Warehouse, Info, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}

interface VisitFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VisitForm: React.FC<VisitFormProps> = ({ onSubmit, onCancel }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('vehicules/');
        setVehicles(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des véhicules:', error);
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const rawData = Object.fromEntries(formData.entries());
    
    // Calculer la date d'expiration (par défaut +1 an pour une visite technique)
    const visitDate = new Date(rawData.date_visite as string);
    const expDate = new Date(visitDate);
    expDate.setFullYear(visitDate.getFullYear() + 1);
    
    const data = {
      ...rawData,
      date_expiration: expDate.toISOString().split('T')[0]
    };
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Véhicule</label>
          <div className="relative group">
            <Car className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <select 
              name="vehicule"
              required
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all appearance-none"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.immatriculation} ({v.marque} {v.modele})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Date de l'Inspection</label>
          <div className="relative group">
            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="date_visite"
              type="date"
              required
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Type de Certification</label>
          <div className="relative group">
            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <select 
              name="type_inspection"
              required
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all appearance-none"
            >
              <option value="annuelle">Visite Technique Annuelle</option>
              <option value="securite">Contrôle de Sécurité Privé</option>
              <option value="pollution">Test d'Émissions / Pollution</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Centre de Contrôle</label>
          <div className="relative group">
            <Warehouse className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="centre"
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Nom de l'organisme (ex: CNSR)"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Notes Additionnelles</label>
        <div className="relative group">
          <Info className="absolute left-6 top-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <textarea 
            name="notes"
            rows={2}
            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-medium text-slate-600 italic shadow-inner transition-all resize-none"
            placeholder="Observations particulières relevées lors de l'inspection..."
          ></textarea>
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
          Certifier la Visite
        </button>
      </div>
    </form>
  );
};

export default VisitForm;

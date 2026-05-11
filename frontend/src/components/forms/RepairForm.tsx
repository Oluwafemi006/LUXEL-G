import React, { useState, useEffect } from 'react';
import { Car, Wrench, Gauge, Droplets, AlertTriangle, User, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}

interface UserType {
  id: number;
  username: string;
}

interface RepairFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialVehicleId?: number;
}

const RepairForm: React.FC<RepairFormProps> = ({ onSubmit, onCancel, initialVehicleId }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | number>('');

  useEffect(() => {
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, uRes] = await Promise.all([
          api.get('vehicules/'),
          api.get('users/')
        ]);
        setVehicles(vRes.data);
        setUsers(uRes.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    if (initialVehicleId) {
      data.vehicule = initialVehicleId.toString();
    }
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Véhicule concerné</label>
          <div className="relative group">
            <Car className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <select 
              name="vehicule"
              required
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              disabled={!!initialVehicleId}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-black text-slate-900 shadow-inner transition-all appearance-none disabled:opacity-60"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Catégorie d'intervention</label>
          <div className="relative group">
            <Wrench className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="categorie"
              list="categories-panne"
              required
              placeholder="Saisir la nature technique..."
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
            />
            <datalist id="categories-panne">
              <option value="Maintenance Routine" />
              <option value="Problème Moteur" />
              <option value="Système de Freinage" />
              <option value="Électricité / Électronique" />
              <option value="Carrosserie & Peinture" />
              <option value="Pneumatique" />
              <option value="Climatisation" />
            </datalist>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Description des Symptômes (Plainte Client)</label>
        <div className="relative group">
           <textarea 
            name="description"
            required
            rows={3}
            className="w-full p-8 rounded-[2rem] bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-medium text-slate-600 italic shadow-inner transition-all resize-none leading-relaxed"
            placeholder="Décrivez les anomalies constatées ou les travaux spécifiques demandés par le propriétaire..."
          ></textarea>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Kilométrage Admission</label>
          <div className="relative group">
            <Gauge className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              type="number"
              name="kilometrage"
              required
              className="w-full pl-16 pr-20 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-black text-slate-900 shadow-inner transition-all"
              placeholder="0"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 uppercase text-[10px] tracking-widest">KM</span>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Niveau de Carburant</label>
          <div className="relative group">
            <Droplets className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <select 
              name="niveau_carburant"
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all appearance-none"
            >
              <option value="Vide">Réserve / Vide</option>
              <option value="1/4">Quart (1/4)</option>
              <option value="1/2">Moitié (1/2)</option>
              <option value="3/4">Trois-Quarts (3/4)</option>
              <option value="Plein">Plein (Full)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Niveau de Priorité</label>
          <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-emerald-50 shadow-inner">
            {['BASSE', 'NORMALE', 'URGENTE'].map((p) => (
              <label key={p} className="flex-1 cursor-pointer">
                <input type="radio" name="priorite" value={p} className="peer hidden" defaultChecked={p === 'NORMALE'} />
                <div className={`text-center py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-500 ${
                  p === 'URGENTE' ? 'peer-checked:bg-rose-600 peer-checked:text-white' : 
                  p === 'NORMALE' ? 'peer-checked:bg-emerald-600 peer-checked:text-white' : 
                  'peer-checked:bg-slate-900 peer-checked:text-white'
                } text-slate-400 hover:bg-white/50`}>
                  {p}
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Assignation Technique</label>
          <div className="relative group">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <select 
              name="technicien"
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all appearance-none"
            >
              <option value="">Sélectionner un technicien</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-6 pt-10 border-t border-emerald-50 mt-12">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] border border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all duration-500"
        >
          <X className="w-4 h-4" />
          Annuler
        </button>
        <button 
          type="submit"
          className="flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-600 transition-all duration-700 active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          Ouvrir l'Ordre de Réparation
        </button>
      </div>
    </form>
  );
};

export default RepairForm;

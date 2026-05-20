import React from 'react';
import { Package, Tag, Layers, Warehouse, X, CheckCircle2 } from 'lucide-react';

interface StockFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const StockForm: React.FC<StockFormProps> = ({ onSubmit, onCancel }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Nom de l'Article / Désignation</label>
        <div className="relative group">
          <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <input 
            name="nom"
            required
            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
            placeholder="Ex: Filtre à huile Mercedes-Benz, Plaquettes Brembo..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Référence Unique (SKU)</label>
          <div className="relative group">
            <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="sku"
              required
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-mono font-black text-emerald-600 tracking-wider shadow-inner transition-all uppercase"
              placeholder="LUX-0000-XX"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Catégorie Inventaire</label>
          <div className="relative group">
            <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <select 
              name="categorie"
              required
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all appearance-none"
            >
              <option value="maintenance">Maintenance & Vidange</option>
              <option value="moteur">Organes Moteur</option>
              <option value="freinage">Systèmes de Freinage</option>
              <option value="suspension">Liaison au Sol / Suspension</option>
              <option value="electrique">Électricité & Électronique</option>
              <option value="carrosserie">Carrosserie & Peinture</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Quantité Initiale</label>
          <input 
            name="quantite"
            type="number"
            required
            min="0"
            className="w-full px-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-black text-2xl text-slate-900 shadow-inner transition-all text-center"
            placeholder="0"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-rose-600 tracking-[0.2em] ml-2">Seuil d'Alerte</label>
          <input 
            name="seuil_alerte"
            type="number"
            required
            min="1"
            className="w-full px-8 py-5 rounded-2xl bg-rose-50/30 border border-rose-100/50 focus:border-rose-500 focus:bg-white outline-none font-black text-2xl text-rose-600 shadow-inner transition-all text-center"
            placeholder="5"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Prix Unitaire (F)</label>
          <input 
            name="prix_unitaire"
            type="number"
            required
            min="0"
            className="w-full px-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-black text-2xl text-emerald-600 shadow-inner transition-all text-right"
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Emplacement Magasin (Rayon)</label>
        <div className="relative group">
          <Warehouse className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <input 
            name="emplacement"
            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-mono font-black text-slate-900 shadow-inner transition-all uppercase"
            placeholder="Ex: RAYON-A1 / ETG-3"
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
          Intégrer à l'Inventaire
        </button>
      </div>
    </form>
  );
};

export default StockForm;

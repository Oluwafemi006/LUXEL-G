import React from 'react';
import { User, Phone, Mail, MapPin, X, CheckCircle2 } from 'lucide-react';

interface ClientFormProps {
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  initialData?: any;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Nom de Famille</label>
          <div className="relative group">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="nom"
              required
              defaultValue={initialData?.nom || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Ex: BONI"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Prénoms</label>
          <div className="relative group">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="prenoms"
              required
              defaultValue={initialData?.prenoms || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Ex: Eddy"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Contact Principal</label>
          <div className="relative group">
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="contact"
              required
              defaultValue={initialData?.contact || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="+229 01 00 00 00 00"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Contact Chauffeur (Optionnel)</label>
          <div className="relative group">
            <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              name="contact_conducteur"
              defaultValue={initialData?.contact_conducteur || ''}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
              placeholder="Numéro mobile"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Adresse Messagerie</label>
        <div className="relative group">
          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <input 
            name="email"
            type="email"
            defaultValue={initialData?.email || ''}
            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all"
            placeholder="client@luxury-garage.com"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Adresse de Résidence</label>
        <div className="relative group">
          <MapPin className="absolute left-6 top-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <textarea 
            name="adresse"
            rows={2}
            defaultValue={initialData?.adresse || ''}
            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 shadow-inner transition-all resize-none"
            placeholder="Localisation complète pour enlèvement/livraison"
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
          {initialData ? 'Enregistrer les modifications' : 'Valider le Dossier'}
        </button>
      </div>
    </form>
  );
};

const Smartphone = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export default ClientForm;

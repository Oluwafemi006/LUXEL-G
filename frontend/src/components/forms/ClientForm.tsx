import React from 'react';

interface ClientFormProps {
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, onCancel }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nom</label>
          <input 
            name="nom"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Nom de famille"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Prénoms</label>
          <input 
            name="prenoms"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Prénoms"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contact Principal</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg">phone</span>
            <input 
              name="contact"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="(+229) 00 00 00 00"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contact Conducteur (Optionnel)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg">person</span>
            <input 
              name="contact_conducteur"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Numéro du chauffeur"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email (Optionnel)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg">mail</span>
          <input 
            name="email"
            type="email"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="exemple@email.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Adresse</label>
        <textarea 
          name="adresse"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
          placeholder="Adresse complète du client"
        ></textarea>
      </div>

      <div className="flex gap-3 pt-4 border-t border-outline/10 mt-8">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-xl border border-outline/20 text-on-surface font-bold hover:bg-surface-container transition-all"
        >
          Annuler
        </button>
        <button 
          type="submit"
          className="flex-1 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary-container transition-all"
        >
          Enregistrer le Client
        </button>
      </div>
    </form>
  );
};

export default ClientForm;

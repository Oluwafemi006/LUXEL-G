import React from 'react';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nom de la Pièce / Article</label>
        <input 
          name="nom"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          placeholder="Ex: Filtre à huile Bosch, Plaquettes de frein..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Référence (SKU)</label>
          <input 
            name="sku"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono"
            placeholder="SKU-0000-XX"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Catégorie</label>
          <select 
            name="categorie"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="maintenance">Maintenance</option>
            <option value="moteur">Moteur</option>
            <option value="freinage">Freinage</option>
            <option value="suspension">Suspension</option>
            <option value="electrique">Électricité</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Quantité Initiale</label>
          <input 
            name="quantite"
            type="number"
            required
            min="0"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Seuil d'Alerte</label>
          <input 
            name="seuil_alerte"
            type="number"
            required
            min="1"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="10"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Prix Unitaire (FCFA)</label>
          <input 
            name="prix_unitaire"
            type="number"
            required
            min="0"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Prix d'achat"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Emplacement (Rayon/Étagère)</label>
        <input 
          name="emplacement"
          className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono"
          placeholder="Ex: A1-R4"
        />
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
          Ajouter au Stock
        </button>
      </div>
    </form>
  );
};

export default StockForm;

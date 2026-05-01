import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Client {
  id: number;
  nom: string;
  prenoms: string;
}

interface VehicleFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, onCancel }) => {
  const [clients, setClients] = useState<Client[]>([]);

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
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Immatriculation</label>
          <input 
            name="immatriculation"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono uppercase"
            placeholder="XX-0000-XX"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Propriétaire (Client)</label>
          <select 
            name="client"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="">Sélectionner un client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.nom} {c.prenoms}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Marque</label>
          <input 
            name="marque"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Ex: Toyota, Tesla, BMW"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Modèle</label>
          <input 
            name="modele"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Ex: Camry, Model 3, X5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Année</label>
          <input 
            name="annee"
            type="number"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="2024"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Couleur</label>
          <input 
            name="couleur"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Ex: Noir Mat, Gris Métallisé"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Numéro de Série (VIN)</label>
        <input 
          name="vin"
          className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono uppercase"
          placeholder="Numéro de châssis"
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
          Enregistrer le Véhicule
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;

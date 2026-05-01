import React, { useState, useEffect } from 'react';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Véhicule</label>
          <select 
            name="vehicule"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="">Sélectionner un véhicule</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.immatriculation} ({v.marque} {v.modele})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date de la Visite</label>
          <input 
            name="date_visite"
            type="date"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Type d'Inspection</label>
          <select 
            name="type_inspection"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="annuelle">Visite Technique Annuelle</option>
            <option value="securite">Contrôle de Sécurité</option>
            <option value="pollution">Test de Pollution</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Centre de Contrôle</label>
          <input 
            name="centre"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Nom du centre (ex: CNSR)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Notes Additionnelles</label>
        <textarea 
          name="notes"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
          placeholder="Remarques particulières..."
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
          Planifier la Visite
        </button>
      </div>
    </form>
  );
};

export default VisitForm;

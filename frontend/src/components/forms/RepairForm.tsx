import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}

interface User {
  id: number;
  username: string;
}

interface RepairFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const RepairForm: React.FC<RepairFormProps> = ({ onSubmit, onCancel }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);

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
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Véhicule (Immatriculation)</label>
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
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Catégorie de Panne</label>
          <select 
            name="categorie"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="Maintenance Routine">Maintenance Routine</option>
            <option value="Problème Moteur">Problème Moteur</option>
            <option value="Système de Freinage">Système de Freinage</option>
            <option value="Électricité / Électronique">Électricité / Électronique</option>
            <option value="Carrosserie">Carrosserie</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description du Problème (Plainte Client)</label>
        <textarea 
          name="description"
          required
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
          placeholder="Décrivez les symptômes ou les travaux demandés..."
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kilométrage au Compteur</label>
          <input 
            type="number"
            name="kilometrage"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Ex: 125000"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Niveau de Carburant</label>
          <select 
            name="niveau_carburant"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="Vide">Vide</option>
            <option value="1/4">1/4</option>
            <option value="1/2">1/2</option>
            <option value="3/4">3/4</option>
            <option value="Plein">Plein</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Priorité</label>
          <div className="flex gap-4 p-1 bg-surface-container/10 rounded-xl border border-outline/20">
            {['BASSE', 'NORMALE', 'URGENTE'].map((p) => (
              <label key={p} className="flex-1 cursor-pointer">
                <input type="radio" name="priorite" value={p} className="peer hidden" defaultChecked={p === 'NORMALE'} />
                <div className="text-center py-2 rounded-lg text-xs font-bold text-on-surface-variant peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-sm transition-all">
                  {p}
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Technicien Assigné</label>
          <select 
            name="technicien"
            className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="">Sélectionner un technicien</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        </div>
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
          Créer l'Ordre de Réparation
        </button>
      </div>
    </form>
  );
};

export default RepairForm;

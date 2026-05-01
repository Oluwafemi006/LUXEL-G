import React from 'react';
import Modal from './Modal';

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}

interface Client {
  id: number;
  nom: string;
  prenoms: string;
  contact: string;
  email?: string;
  adresse: string;
  vehicules_list: Vehicle[];
}

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onVehicleClick: (vehicleId: number, plate: string) => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ isOpen, onClose, client, onVehicleClick }) => {
  if (!client) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Détails Client - ${client.nom} ${client.prenoms}`}>
      <div className="space-y-6">
        {/* Infos Client */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container/20 rounded-xl border border-outline/10">
          <div>
            <p className="text-[10px] font-black uppercase text-on-surface-variant mb-1">Contact</p>
            <p className="text-sm font-bold text-on-surface">{client.contact}</p>
            {client.email && <p className="text-xs text-on-surface-variant">{client.email}</p>}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-on-surface-variant mb-1">Adresse</p>
            <p className="text-sm font-bold text-on-surface">{client.adresse}</p>
          </div>
        </div>

        {/* Liste des Véhicules */}
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Véhicules ({client.vehicules_list.length})</h4>
          <div className="space-y-3">
            {client.vehicules_list.length > 0 ? (
              client.vehicules_list.map((v) => (
                <div 
                  key={v.id}
                  onClick={() => onVehicleClick(v.id, v.immatriculation)}
                  className="flex items-center justify-between p-3 bg-white border border-outline/10 rounded-xl hover:bg-primary/5 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">directions_car</span>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-black text-primary">{v.immatriculation}</p>
                      <p className="text-xs text-on-surface-variant font-bold">{v.marque} {v.modele}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-xs text-on-surface-variant font-bold">Aucun véhicule enregistré.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ClientDetailModal;

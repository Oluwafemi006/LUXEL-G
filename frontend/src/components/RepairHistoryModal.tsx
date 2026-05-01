import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

interface RepairHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  vehiclePlate: string;
}

const RepairHistoryModal: React.FC<RepairHistoryModalProps> = ({ isOpen, onClose, vehicleId, vehiclePlate }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && vehicleId) {
      const fetchHistory = async () => {
        try {
          setLoading(true);
          const response = await api.get(`vehicules/${vehicleId}/historique/`);
          setHistory(response.data);
        } catch (error) {
          console.error('Erreur historique:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, vehicleId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Historique - ${vehiclePlate}`}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {loading ? (
          <p className="text-center py-8 text-on-surface-variant">Chargement de l'historique...</p>
        ) : history.length === 0 ? (
          <p className="text-center py-8 text-on-surface-variant">Aucune réparation enregistrée pour ce véhicule.</p>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-3 space-y-6">
            {history.map((repair) => (
              <div key={repair.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm"></div>
                <div className="bg-surface-container/30 p-4 rounded-xl border border-outline/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      OR #{repair.id.toString().padStart(4, '0')}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {new Date(repair.date_creation).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-on-surface mb-1">{repair.categorie}</h4>
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{repair.description}</p>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className={`px-2 py-1 rounded-full font-semibold ${
                      repair.statut === 'TERMINE' ? 'bg-green-100 text-green-700' :
                      repair.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {repair.statut}
                    </span>
                    {repair.facture && (
                      <span className="font-bold text-on-surface">
                        Total: {Number(repair.facture.total_ttc).toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RepairHistoryModal;

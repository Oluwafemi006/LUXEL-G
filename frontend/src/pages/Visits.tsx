import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import VisitForm from '../components/forms/VisitForm';
import api from '../services/api';

interface Visit {
  id: number;
  vehicule_plate: string;
  date_visite: string;
  date_expiration: string;
  type_inspection: string;
  centre?: string;
}

const Visits: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await api.get('visites/');
      const data = Array.isArray(response.data) ? response.data : [];
      setVisits(data);
      if (data.length > 0 && !selectedVisit) {
        setSelectedVisit(data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement visites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleAddVisit = async (data: any) => {
    try {
      await api.post('visites/', data);
      setIsModalOpen(false);
      fetchVisits();
    } catch (error) {
      alert('Une erreur est survenue lors de la planification.');
    }
  };

  const filteredVisits = visits.filter(v => 
    v.vehicule_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type_inspection.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Visites Techniques</h1>
          <p className="text-on-surface-variant font-medium">Contrôle de conformité et validité des documents.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">event_available</span>
          <span>Planifier une Visite</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Liste des Visites (Gauche) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline/10 bg-surface-container/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text"
                placeholder="Plaque, type d'inspection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-outline/20 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-outline/5">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-primary font-bold">Chargement...</div>
            ) : filteredVisits.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs font-bold uppercase opacity-40">Aucune visite.</div>
            ) : filteredVisits.map((v) => (
              <div 
                key={v.id} 
                onClick={() => setSelectedVisit(v)}
                className={`p-4 cursor-pointer transition-all hover:bg-primary/5 flex items-center gap-4 ${selectedVisit?.id === v.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isExpired(v.date_expiration) ? 'bg-error/10 text-error' : (selectedVisit?.id === v.id ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant')}`}>
                  <span className="material-symbols-outlined">{isExpired(v.date_expiration) ? 'history_toggle_off' : 'verified'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-black text-primary text-sm tracking-tighter">{v.vehicule_plate}</p>
                  <p className="text-xs font-bold text-on-surface truncate">{v.type_inspection}</p>
                  <p className={`text-[10px] font-black uppercase ${isExpired(v.date_expiration) ? 'text-error' : 'text-on-surface-variant'}`}>
                    Exp: {new Date(v.date_expiration).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails de la Visite (Droite) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-outline/10 shadow-lg overflow-hidden flex flex-col">
          {selectedVisit ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
              {/* Entête Fiche */}
              <div className="p-6 bg-primary/[0.03] border-b border-outline/10 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                   <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg ${isExpired(selectedVisit.date_expiration) ? 'bg-error text-white' : 'bg-on-surface text-white'}`}>
                    <span className="material-symbols-outlined text-3xl">fact_check</span>
                    <span className="text-[10px] font-black mt-1 uppercase">Inspection</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-mono font-black text-primary italic tracking-tighter">{selectedVisit.vehicule_plate}</h2>
                    <p className="text-on-surface font-bold text-lg">{selectedVisit.type_inspection}</p>
                    <div className="mt-2 flex gap-3">
                      <span className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isExpired(selectedVisit.date_expiration) ? 'bg-error text-white shadow-lg shadow-error/20' : 'bg-surface-container text-on-surface-variant'}`}>
                        {isExpired(selectedVisit.date_expiration) ? 'EXPIRÉ' : 'VALIDE'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                        CENTRE: {selectedVisit.centre || 'NON SPÉCIFIÉ'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-surface-container rounded-xl transition-colors text-on-surface-variant">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>

              <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-surface-container/5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-outline/10 shadow-sm space-y-4">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Dates du contrôle</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b border-outline/5">
                             <span className="text-xs font-bold text-on-surface-variant">Date de la visite</span>
                             <span className="text-sm font-black text-on-surface">{new Date(selectedVisit.date_visite).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-on-surface-variant">Date d'expiration</span>
                             <span className={`text-sm font-black ${isExpired(selectedVisit.date_expiration) ? 'text-error' : 'text-primary'}`}>
                                {new Date(selectedVisit.date_expiration).toLocaleDateString()}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-outline/10 shadow-sm space-y-4">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Lieu du contrôle</h3>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                             <span className="material-symbols-outlined">location_on</span>
                          </div>
                          <p className="text-sm font-bold text-on-surface">{selectedVisit.centre || "Centre non renseigné"}</p>
                       </div>
                    </div>
                 </div>

                 {isExpired(selectedVisit.date_expiration) ? (
                   <div className="p-8 bg-error/5 border-2 border-dashed border-error/20 rounded-3xl flex flex-col md:flex-row items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-xl shadow-error/20">
                         <span className="material-symbols-outlined text-3xl">priority_high</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                         <h4 className="text-lg font-black text-error uppercase italic">Alerte Conformité</h4>
                         <p className="text-xs font-bold text-on-surface-variant mt-1">La visite technique de ce véhicule est expirée. Le véhicule ne doit plus circuler avant un nouveau contrôle.</p>
                      </div>
                      <button className="px-8 py-3 bg-error text-white rounded-xl text-xs font-black uppercase shadow-lg hover:scale-105 transition-all">
                        Renouveler maintenant
                      </button>
                   </div>
                 ) : (
                   <div className="p-8 bg-primary/5 border border-primary/10 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                         <span className="material-symbols-outlined text-primary">info</span>
                         <h4 className="text-xs font-black uppercase text-primary tracking-widest">Rappel Automatique</h4>
                      </div>
                      <p className="text-xs font-bold text-on-surface-variant leading-relaxed">
                        Un rappel automatique sera envoyé au propriétaire du véhicule 15 jours avant la date d'expiration ({new Date(new Date(selectedVisit.date_expiration).getTime() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}).
                      </p>
                   </div>
                 )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20">
              <span className="material-symbols-outlined text-6xl mb-4">fact_check</span>
              <p className="font-black uppercase tracking-[0.3em]">Sélectionnez une visite technique</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Planifier une visite technique">
        <VisitForm onSubmit={handleAddVisit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Visits;

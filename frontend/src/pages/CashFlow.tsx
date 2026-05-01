import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Mouvement {
  id: number;
  date_mouvement: string;
  type_mouvement: 'RECETTE' | 'DEPENSE';
  categorie: string;
  categorie_display: string;
  montant: string;
  description: string;
  utilisateur_name: string;
  facture_id?: number;
  numero_facture?: string;
}

interface Synthese {
  total_recettes: number;
  total_depenses: number;
  solde: number;
}

const CashFlow: React.FC = () => {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [selectedMouvement, setSelectedMouvement] = useState<Mouvement | null>(null);
  const [synthese, setSynthese] = useState<Synthese>({ total_recettes: 0, total_depenses: 0, solde: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Formulaire nouvelle dépense
  const [newExpense, setNewExpense] = useState({
    categorie: 'ACHAT_PIECES',
    montant: '',
    description: '',
    date_mouvement: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resMouv, resSyn] = await Promise.all([
        api.get('caisse/'),
        api.get('caisse/synthese/')
      ]);
      const data = Array.isArray(resMouv.data) ? resMouv.data : [];
      setMouvements(data);
      setSynthese(resSyn.data);
      if (data.length > 0 && !selectedMouvement) {
        setSelectedMouvement(data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement caisse:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('caisse/', {
        ...newExpense,
        type_mouvement: 'DEPENSE',
        montant: parseFloat(newExpense.montant)
      });
      setIsModalOpen(false);
      setNewExpense({ ...newExpense, montant: '', description: '' });
      fetchData();
    } catch (error) {
      alert('Erreur lors de l\'enregistrement de la dépense.');
    }
  };

  const filteredMouvements = mouvements.filter(m => 
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.categorie_display.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.type_mouvement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Synthèse Rapide */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Journal de Caisse</h1>
          <p className="text-on-surface-variant font-medium">Flux financiers et rentabilité en temps réel.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="flex bg-surface-container/50 border border-outline/10 p-1 rounded-2xl">
              <div className="px-4 py-2 text-center border-r border-outline/10">
                 <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Solde</p>
                 <p className="text-sm font-black text-primary">{synthese.solde.toLocaleString()} F</p>
              </div>
              <div className="px-4 py-2 text-center">
                 <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Dépenses</p>
                 <p className="text-sm font-black text-red-600">{synthese.total_depenses.toLocaleString()} F</p>
              </div>
           </div>
           <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">remove_circle</span>
            <span className="text-sm">Enregistrer Dépense</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Liste des Mouvements (Gauche) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline/10 bg-surface-container/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text"
                placeholder="Description, catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-outline/20 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-outline/5">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-primary font-bold">Synchronisation caisse...</div>
            ) : filteredMouvements.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs font-bold uppercase opacity-40">Aucun mouvement.</div>
            ) : filteredMouvements.map((m) => (
              <div 
                key={m.id} 
                onClick={() => setSelectedMouvement(m)}
                className={`p-4 cursor-pointer transition-all hover:bg-primary/5 flex items-center gap-4 ${selectedMouvement?.id === m.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.type_mouvement === 'RECETTE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <span className="material-symbols-outlined text-sm">
                    {m.type_mouvement === 'RECETTE' ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-on-surface truncate uppercase tracking-tight">{m.categorie_display}</p>
                  <p className="text-[10px] font-bold text-on-surface-variant">{new Date(m.date_mouvement).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                   <p className={`text-sm font-black ${m.type_mouvement === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(m.montant).toLocaleString()} F
                   </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails du Mouvement (Droite) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-outline/10 shadow-lg overflow-hidden flex flex-col">
          {selectedMouvement ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
              {/* Entête Transaction */}
              <div className="p-6 bg-primary/[0.03] border-b border-outline/10 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                   <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg ${selectedMouvement.type_mouvement === 'RECETTE' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    <span className="material-symbols-outlined text-3xl">payments</span>
                    <span className="text-[10px] font-black mt-1 uppercase">{selectedMouvement.type_mouvement}</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-on-surface tracking-tighter italic">#{selectedMouvement.id.toString().padStart(6, '0')}</h2>
                    <p className="text-on-surface font-bold text-lg">{selectedMouvement.categorie_display}</p>
                    <div className="mt-2 flex gap-3">
                      <span className="flex items-center gap-1 text-[10px] font-black text-on-surface-variant bg-surface-container px-3 py-1 rounded-full uppercase tracking-widest">
                        AGENT: {selectedMouvement.utilisateur_name || 'SYSTÈME'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                        {new Date(selectedMouvement.date_mouvement).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-on-surface-variant uppercase mb-1">Montant de la transaction</p>
                   <p className={`text-3xl font-black ${selectedMouvement.type_mouvement === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMouvement.type_mouvement === 'RECETTE' ? '+' : '-'} {Number(selectedMouvement.montant).toLocaleString()} F
                   </p>
                </div>
              </div>

              <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-surface-container/5">
                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-4">Description / Justification</h3>
                   <div className="p-6 bg-white rounded-3xl border border-outline/10 shadow-sm">
                      <p className="text-sm font-medium leading-relaxed text-on-surface italic">
                        "{selectedMouvement.description || "Aucune description fournie pour cette transaction."}"
                      </p>
                   </div>
                 </div>

                 {selectedMouvement.numero_facture && (
                   <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center">
                            <span className="material-symbols-outlined">receipt_long</span>
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-primary uppercase">Facture Liée</h4>
                            <p className="text-xs font-bold text-on-surface-variant">{selectedMouvement.numero_facture}</p>
                         </div>
                      </div>
                      <button className="px-6 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all">
                        Voir la Facture
                      </button>
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-white rounded-2xl border border-outline/10 text-center">
                       <p className="text-[9px] font-black text-on-surface-variant uppercase mb-1">Moyen de paiement</p>
                       <p className="text-sm font-black text-on-surface uppercase">Espèces / MomoPay</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-outline/10 text-center">
                       <p className="text-[9px] font-black text-on-surface-variant uppercase mb-1">Référence Interne</p>
                       <p className="text-sm font-black text-on-surface uppercase">TRX-{selectedMouvement.id}</p>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20">
              <span className="material-symbols-outlined text-6xl mb-4">account_balance_wallet</span>
              <p className="font-black uppercase tracking-[0.3em]">Consulter le détail du flux</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouvelle Dépense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-black text-on-surface border-b border-outline/10 pb-4">Enregistrer une Sortie</h2>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Catégorie de dépense</label>
                  <select 
                    value={newExpense.categorie}
                    onChange={(e) => setNewExpense({ ...newExpense, categorie: e.target.value })}
                    className="w-full bg-surface-container/50 border border-outline/20 rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-sm"
                  >
                    <option value="ACHAT_PIECES">Achat de pièces</option>
                    <option value="SALAIRES">Salaires / Avances</option>
                    <option value="LOYER">Loyer / Charges</option>
                    <option value="CARBURATION">Carburant</option>
                    <option value="AUTRE_DEPENSE">Autre Dépense</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Montant décaissé (FCFA)</label>
                  <input 
                    type="number"
                    required
                    value={newExpense.montant}
                    onChange={(e) => setNewExpense({ ...newExpense, montant: e.target.value })}
                    className="w-full bg-surface-container/50 border border-outline/20 rounded-xl px-4 py-3 outline-none focus:border-primary font-black text-xl text-red-600"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Motif du décaissement</label>
                  <textarea 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full bg-surface-container/50 border border-outline/20 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm font-medium"
                    placeholder="Détails..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold border border-outline/20 hover:bg-surface-container transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl font-black bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all"
                  >
                    Valider la Sortie
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PlusCircle, 
  MinusCircle, 
  Wallet, 
  Receipt, 
  User, 
  Calendar, 
  ArrowRightCircle, 
  History,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header & Synthèse Rapide */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Journal de Caisse</h1>
          <p className="text-slate-500 font-medium">Flux financiers et rentabilité Luxury Elegance Garage.</p>
        </div>
        
        <div className="flex gap-6 items-center">
           <div className="flex bg-white border border-emerald-100/50 p-1.5 rounded-[1.5rem] shadow-sm">
              <div className="px-6 py-2 text-center border-r border-emerald-50">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Solde Net</p>
                 <p className="text-sm font-black text-emerald-600">{synthese.solde.toLocaleString()} F</p>
              </div>
              <div className="px-6 py-2 text-center">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Dépenses</p>
                 <p className="text-sm font-black text-rose-600">{synthese.total_depenses.toLocaleString()} F</p>
              </div>
           </div>
           <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all duration-700 hover:-translate-y-1 active:scale-95"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Sortie Caisse</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* Liste des Mouvements (Gauche) */}
        <div className="col-span-12 lg:col-span-4 card-luxury overflow-hidden flex flex-col">
          <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Description, catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-emerald-100/50 rounded-2xl outline-none focus:border-emerald-500/50 transition-all duration-500 text-sm font-bold placeholder:text-slate-300 shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-emerald-50/20 custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Synchronisation...</p>
              </div>
            ) : filteredMouvements.length === 0 ? (
              <div className="p-12 text-center opacity-40 grayscale space-y-4">
                <History className="w-12 h-12 mx-auto text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucune transaction</p>
              </div>
            ) : filteredMouvements.map((m) => (
              <div 
                key={m.id} 
                onClick={() => setSelectedMouvement(m)}
                className={`p-6 cursor-pointer transition-all duration-500 hover:bg-emerald-50/30 flex items-center gap-5 group ${selectedMouvement?.id === m.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 translate-x-1' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 ${m.type_mouvement === 'RECETTE' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                  {m.type_mouvement === 'RECETTE' ? <ArrowDownCircle className="w-6 h-6" /> : <ArrowUpCircle className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate uppercase tracking-widest group-hover:text-emerald-600 transition-colors duration-500">{m.categorie_display}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(m.date_mouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                </div>
                <div className="text-right">
                   <p className={`text-sm font-black italic tracking-tight ${m.type_mouvement === 'RECETTE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {m.type_mouvement === 'RECETTE' ? '+' : '-'} {Number(m.montant).toLocaleString()} F
                   </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails du Mouvement (Droite) */}
        <div className="col-span-12 lg:col-span-8 card-luxury overflow-hidden flex flex-col relative">
          {selectedMouvement ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-700">
              {/* Entête Transaction */}
              <div className="p-10 bg-emerald-50/10 border-b border-emerald-50/50 flex justify-between items-start">
                <div className="flex gap-10 items-center">
                   <div className={`w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl rotate-3 transition-transform duration-700 hover:rotate-0 ${selectedMouvement.type_mouvement === 'RECETTE' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-rose-600 text-white shadow-rose-200'}`}>
                    <Wallet className="w-10 h-10 mb-1" />
                    <span className="text-[8px] font-black tracking-[0.3em] uppercase">{selectedMouvement.type_mouvement}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h2 className="text-4xl font-mono font-black text-slate-900 italic tracking-tighter uppercase">TRX-{selectedMouvement.id.toString().padStart(6, '0')}</h2>
                      <div className={`h-2 w-10 rounded-full opacity-20 ${selectedMouvement.type_mouvement === 'RECETTE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>
                    <p className="text-slate-500 font-black text-xl uppercase tracking-widest">{selectedMouvement.categorie_display}</p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                        <User className="w-3 h-3 text-emerald-500" />
                        AGENT: {selectedMouvement.utilisateur_name?.toUpperCase() || 'SYSTÈME'}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-4 py-2 rounded-2xl shadow-sm uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedMouvement.date_mouvement).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60">Montant Certifié</p>
                   <p className={`text-5xl font-black italic tracking-tighter ${selectedMouvement.type_mouvement === 'RECETTE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedMouvement.type_mouvement === 'RECETTE' ? '+' : '-'} {Number(selectedMouvement.montant).toLocaleString()} <span className="text-xl not-italic">F</span>
                   </p>
                </div>
              </div>

              <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar bg-emerald-50/5">
                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 ml-2">Description & Justificatif</h3>
                   <div className="p-8 bg-white rounded-[2.5rem] border border-emerald-100/30 shadow-inner relative overflow-hidden group">
                      <p className="text-lg font-medium leading-relaxed text-slate-600 italic relative z-10">
                        "{selectedMouvement.description || "Aucune justification détaillée enregistrée."}"
                      </p>
                      <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-500/5 group-hover:scale-110 transition-transform duration-1000" />
                   </div>
                 </div>

                 {selectedMouvement.numero_facture && (
                   <div className="card-luxury p-8 bg-slate-900 text-white flex items-center justify-between group overflow-hidden relative">
                      <div className="flex items-center gap-6 relative z-10">
                         <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30 shadow-2xl">
                            <Receipt className="w-8 h-8 text-emerald-400" />
                         </div>
                         <div>
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Document de Référence</h4>
                            <p className="text-xl font-black italic tracking-tighter uppercase">{selectedMouvement.numero_facture}</p>
                         </div>
                      </div>
                      <button className="relative z-10 flex items-center gap-2 px-8 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all duration-500 shadow-xl shadow-white/5 active:scale-95">
                        <ArrowRightCircle className="w-4 h-4" />
                        Consulter
                      </button>
                      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                    <div className="card-luxury p-6 bg-white flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                          <Info className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'entrée</p>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Espèces / MOMO / Virement</p>
                       </div>
                    </div>
                    <div className="card-luxury p-6 bg-white flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                          <Receipt className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Transaction</p>
                          <p className="text-sm font-black text-emerald-600 font-mono">UUID-{selectedMouvement.id.toString().padStart(6, '0')}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-40 opacity-20 text-slate-400 grayscale">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner">
                <Wallet className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-2xl">Module Caisse</p>
              <p className="text-[10px] font-bold mt-6 tracking-[0.3em]">SÉLECTIONNEZ UNE TRANSACTION DANS LE JOURNAL</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouvelle Dépense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-emerald-100/50 animate-in zoom-in duration-700 overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ArrowUpCircle className="w-10 h-10 text-rose-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Décaissement</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Enregistrement d'une sortie de caisse</p>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2">Catégorie de dépense</label>
                  <input 
                    value={newExpense.categorie}
                    onChange={(e) => setNewExpense({ ...newExpense, categorie: e.target.value })}
                    list="categories-depense"
                    placeholder="Saisir ou choisir..."
                    className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 font-bold text-sm shadow-inner transition-all duration-500"
                  />
                  <datalist id="categories-depense">
                    <option value="ACHAT_PIECES">Achat de pièces</option>
                    <option value="SALAIRES">Salaires / Avances</option>
                    <option value="LOYER">Loyer / Charges</option>
                    <option value="CARBURATION">Carburant</option>
                    <option value="AUTRE_DEPENSE">Autre Dépense</option>
                  </datalist>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2">Montant décaissé (FCFA)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      value={newExpense.montant}
                      onChange={(e) => setNewExpense({ ...newExpense, montant: e.target.value })}
                      className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-8 py-5 outline-none focus:border-rose-500 font-black text-3xl text-rose-600 shadow-inner"
                      placeholder="0"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-rose-200 uppercase tracking-widest">FCFA</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2">Motif du décaissement</label>
                  <textarea 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 text-sm font-medium shadow-inner"
                    placeholder="Précisez la nature de la dépense..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all duration-500"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-600 text-white shadow-xl shadow-rose-200 hover:bg-rose-700 hover:-translate-y-1 transition-all duration-700 active:scale-95"
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

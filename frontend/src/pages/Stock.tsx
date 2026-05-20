import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  AlertTriangle, 
  PlusCircle, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Tag, 
  Layers, 
  ShieldCheck,
  Warehouse,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  FileSpreadsheet,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import StockForm from '../components/forms/StockForm';
import api from '../services/api';

interface StockItem {
  id: number;
  nom: string;
  sku: string;
  categorie: string;
  quantite: number;
  stock_initial: number;
  seuil_alerte: number;
  prix_unitaire: string;
  emplacement?: string;
  entrees_total: number;
  sorties_total: number;
  stock_theorique: number;
  ecart: number;
  mouvements: any[];
}

const Stock: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Form states
  const [restockData, setRestockData] = useState({ quantite: '', prix_achat_total: '', description: '' });
  const [adjustData, setAdjustData] = useState({ quantite_physique: '' });

  const fetchStock = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('stock/');
      const data = Array.isArray(response.data) ? response.data : [];
      setStock(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      } else if (selectedItem) {
        const updated = data.find(i => i.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      }
    } catch (error) {
      console.error('Erreur chargement stock:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !restockData.quantite || !restockData.prix_achat_total) return;
    try {
      await api.post(`stock/${selectedItem.id}/approvisionner/`, {
        quantite: parseInt(restockData.quantite),
        prix_achat_total: parseFloat(restockData.prix_achat_total),
        description: restockData.description
      });
      setIsRestockModalOpen(false);
      setRestockData({ quantite: '', prix_achat_total: '', description: '' });
      fetchStock(true);
    } catch (error) {
      alert('Erreur lors de l\'approvisionnement.');
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjustData.quantite_physique) return;
    try {
      await api.post(`stock/${selectedItem.id}/ajuster_inventaire/`, {
        quantite_physique: parseInt(adjustData.quantite_physique)
      });
      setIsAdjustModalOpen(false);
      setAdjustData({ quantite_physique: '' });
      fetchStock(true);
    } catch (error) {
      alert('Erreur lors de l\'ajustement.');
    }
  };

  const exportStockExcel = async () => {
    try {
      const response = await api.get('stock/export_excel/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Inventaire_Luxury_G.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Erreur lors de l\'export.');
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.nom.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return showOnlyLowStock ? (matchesSearch && item.quantite < item.seuil_alerte) : matchesSearch;
  });

  const lowStockCount = stock.filter(i => i.quantite < i.seuil_alerte).length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      {/* Header Luxury */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Opérations Inventaire</p>
          </div>
          <h1 className="text-6xl font-black text-slate-900 italic tracking-tighter leading-none">Stock & Logistique.</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={exportStockExcel}
            className="flex items-center gap-3 px-6 py-4 bg-white border border-emerald-100 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/5 hover:bg-emerald-50 transition-all duration-700 active:scale-95 group"
          >
            <FileSpreadsheet className="w-4 h-4 group-hover:rotate-12 transition-transform duration-700" />
            Export Excel
          </button>
          <button 
            onClick={() => setShowOnlyLowStock(!showOnlyLowStock)} 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-700 shadow-xl border ${showOnlyLowStock ? 'bg-rose-600 text-white border-rose-500 shadow-rose-200 -translate-y-1' : 'bg-white text-slate-400 border-slate-100 hover:text-rose-600 shadow-slate-200/50'}`}
          >
            <AlertTriangle className={`w-4 h-4 ${showOnlyLowStock ? 'animate-pulse' : ''}`} />
            Alertes ({lowStockCount})
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn-primary-luxury flex items-center gap-3 shadow-emerald-200"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Liste des Articles (Style Luxury) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="card-luxury p-6 bg-white transition-all duration-1000 hover:shadow-emerald-500/10">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors duration-700 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Réf ou Nom de pièce..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all duration-700 text-sm font-bold shadow-inner" 
              />
            </div>
          </div>
          
          <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto no-scrollbar pr-2">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-black text-emerald-600 uppercase text-[10px] tracking-[0.4em] animate-pulse">Sync Inventaire</p>
              </div>
            ) : filteredStock.length === 0 ? (
              <div className="p-12 text-center opacity-30 grayscale space-y-6 animate-in zoom-in duration-1000">
                <Warehouse className="w-16 h-16 mx-auto text-slate-300" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aucune référence trouvée</p>
              </div>
            ) : filteredStock.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)} 
                className={`card-luxury p-6 cursor-pointer flex items-center gap-5 group relative overflow-hidden transition-all duration-700 ${selectedItem?.id === item.id ? 'border-emerald-600 ring-2 ring-emerald-500/20 translate-x-2' : ''} ${item.quantite < item.seuil_alerte ? 'bg-rose-50/50' : 'bg-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 ${item.quantite < item.seuil_alerte ? 'bg-rose-100 text-rose-600 shadow-rose-200' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-6'}`}>
                  <Package className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-emerald-600 transition-colors duration-700">{item.nom}</p>
                  <p className="text-[10px] text-emerald-600 font-black font-mono tracking-widest mt-1 opacity-70">{item.sku}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className={`text-2xl font-black italic tracking-tighter transition-all duration-700 ${item.quantite < item.seuil_alerte ? 'text-rose-600 animate-pulse scale-110' : 'text-slate-900 group-hover:text-emerald-600'}`}>{item.quantite}</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">PCS</p>
                </div>
                {selectedItem?.id === item.id && <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600 transition-all duration-700"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Détails Expert (Fiche Luxury) */}
        <div className="col-span-12 lg:col-span-8">
          {selectedItem ? (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-1000">
              {/* Header Fiche */}
              <div className="card-luxury p-10 bg-white relative overflow-hidden group">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                  <div className="flex gap-10 items-center">
                    <div className="w-28 h-28 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-1000">
                      <Package className="w-12 h-12 mb-1 text-emerald-400" />
                      <span className="text-[8px] font-black tracking-[0.4em] text-white uppercase">S/N</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase transition-all duration-1000 group-hover:text-emerald-600">{selectedItem.nom}</h2>
                        <div className="h-2 w-12 bg-emerald-500 rounded-full opacity-20 transition-all duration-1000 group-hover:w-20 group-hover:opacity-100"></div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-5 py-2.5 rounded-2xl shadow-sm uppercase tracking-widest transition-all duration-700 hover:bg-emerald-600 hover:text-white">
                          <Tag className="w-3.5 h-3.5" />
                          SKU: {selectedItem.sku}
                        </span>
                        <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm uppercase tracking-widest transition-all duration-700 hover:bg-slate-900 hover:text-white">
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                          {selectedItem.categorie.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setIsRestockModalOpen(true)} 
                      className="btn-primary-luxury flex items-center justify-center gap-3 px-8 py-5 transition-all duration-700 hover:shadow-emerald-500/20 active:scale-95"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Réapprovisionner</span>
                    </button>
                    <button 
                      onClick={() => setIsAdjustModalOpen(true)} 
                      className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all duration-700 active:scale-95"
                    >
                      <RefreshCcw className="w-5 h-5" />
                      <span>Faire l'inventaire</span>
                    </button>
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-[2s]"></div>
              </div>

              {/* Panneau de Stats Excel Style */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="card-luxury p-8 bg-white space-y-4 group hover:border-emerald-500 transition-all duration-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Stock Initial
                   </p>
                   <p className="text-4xl font-black italic tracking-tighter text-slate-900">{selectedItem.stock_initial}</p>
                   <p className="text-[9px] font-bold text-slate-400 italic">Position en début de période</p>
                </div>
                <div className="card-luxury p-8 bg-white space-y-4 group hover:border-blue-500 transition-all duration-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Plus className="w-3.5 h-3.5 text-blue-500" /> Cumul Entrées
                   </p>
                   <p className="text-4xl font-black italic tracking-tighter text-blue-600">+{selectedItem.entrees_total}</p>
                   <p className="text-[9px] font-bold text-slate-400 italic">Achats & Retours</p>
                </div>
                <div className="card-luxury p-8 bg-white space-y-4 group hover:border-orange-500 transition-all duration-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Minus className="w-3.5 h-3.5 text-orange-500" /> Cumul Sorties
                   </p>
                   <p className="text-4xl font-black italic tracking-tighter text-orange-600">-{selectedItem.sorties_total}</p>
                   <p className="text-[9px] font-bold text-slate-400 italic">Réparations & Ventes</p>
                </div>
              </div>

              {/* État de l'Inventaire (Théorique vs Physique) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="card-luxury p-10 bg-slate-900 text-white relative overflow-hidden group">
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.4em]">Stock Physique Réel</p>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 transition-all duration-1000 group-hover:scale-125 group-hover:rotate-12" />
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className={`text-9xl font-black italic tracking-tighter leading-none transition-all duration-1000 ${selectedItem.quantite < selectedItem.seuil_alerte ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                        {selectedItem.quantite}
                      </span>
                      <span className="text-xl font-bold opacity-30 italic">UNITÉS</span>
                    </div>
                    <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Théorique</p>
                        <p className="text-xl font-black italic">{selectedItem.stock_theorique}</p>
                      </div>
                      <div className="h-10 w-px bg-white/10"></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Écart Inventaire</p>
                        <p className={`text-xl font-black italic ${selectedItem.ecart === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {selectedItem.ecart > 0 ? '+' : ''}{selectedItem.ecart}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Warehouse className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 rotate-12 transition-transform duration-[4s] group-hover:rotate-45" />
                </div>

                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Fiche Financière & Localisation</h3>
                  <div className="card-luxury p-10 space-y-8 bg-white transition-all duration-1000 hover:shadow-emerald-500/10">
                     <div className="space-y-6">
                        <div className="flex justify-between items-center group/line">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-emerald-50 rounded-2xl group-hover/line:bg-emerald-600 transition-all duration-700">
                                <Tag className="w-5 h-5 text-emerald-600 group-hover/line:text-white" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix de Vente Unit.</span>
                          </div>
                          <span className="text-2xl font-black text-slate-900 italic">{Number(selectedItem.prix_unitaire).toLocaleString()} F</span>
                        </div>

                        <div className="flex justify-between items-center group/line">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-rose-50 rounded-2xl group-hover/line:bg-rose-600 transition-all duration-700">
                                <AlertTriangle className="w-5 h-5 text-rose-600 group-hover/line:text-white" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seuil de Sécurité</span>
                          </div>
                          <span className="text-2xl font-black text-rose-600 italic">{selectedItem.seuil_alerte}</span>
                        </div>

                        <div className="flex justify-between items-center group/line">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-blue-50 rounded-2xl group-hover/line:bg-blue-600 transition-all duration-700">
                                <ShieldCheck className="w-5 h-5 text-blue-600 group-hover/line:text-white" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emplacement</span>
                          </div>
                          <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedItem.emplacement || 'NON DÉFINI'}</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Historique des Mouvements (Timeline Luxury) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="h-1 w-6 bg-emerald-500 rounded-full"></div>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Journal des Mouvements</h3>
                </div>
                <div className="card-luxury bg-white overflow-hidden transition-all duration-1000 hover:shadow-emerald-500/10">
                   <div className="divide-y divide-emerald-50/50">
                      {selectedItem.mouvements && selectedItem.mouvements.length > 0 ? (
                        selectedItem.mouvements.slice(0, 10).map((mv) => (
                          <div key={mv.id} className="p-6 flex items-center justify-between group hover:bg-emerald-50/20 transition-all duration-700">
                             <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-700 ${mv.type_mouvement === 'ENTREE' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : mv.type_mouvement === 'SORTIE' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                   {mv.type_mouvement === 'ENTREE' ? <ArrowUpRight className="w-6 h-6" /> : mv.type_mouvement === 'SORTIE' ? <ArrowDownLeft className="w-6 h-6" /> : <RefreshCcw className="w-6 h-6" />}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{mv.description || (mv.type_mouvement === 'ENTREE' ? 'Réassortiment' : 'Consommation Atelier')}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                     {new Date(mv.date_mouvement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} • Par {mv.utilisateur_name || 'Système'}
                                   </p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={`text-lg font-black italic tracking-tighter ${mv.type_mouvement === 'ENTREE' ? 'text-emerald-600' : mv.type_mouvement === 'SORTIE' ? 'text-orange-600' : 'text-blue-600'}`}>
                                   {mv.type_mouvement === 'ENTREE' ? '+' : mv.type_mouvement === 'SORTIE' ? '-' : ''}{mv.quantite}
                                </p>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center opacity-30 italic text-slate-400 text-xs">Aucun mouvement récent enregistré.</div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full card-luxury bg-white flex flex-col items-center justify-center p-40 opacity-20 text-slate-400 grayscale group hover:opacity-40 transition-all duration-[2s]">
              <div className="w-32 h-32 bg-emerald-50 rounded-xl flex items-center justify-center mb-10 shadow-inner group-hover:rotate-12 transition-transform duration-1000">
                <Warehouse className="w-16 h-16 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.6em] text-3xl">Inventaire Central</p>
              <p className="text-[10px] font-bold mt-8 tracking-[0.4em] animate-pulse">SÉLECTIONNEZ UNE RÉFÉRENCE POUR DÉTAILS</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvel Article"><StockForm onSubmit={async (data: any) => { try { await api.post('stock/', data); setIsModalOpen(false); fetchStock(true); } catch (error) { alert('Erreur ajout article.'); } }} onCancel={() => setIsModalOpen(false)} /></Modal>

      {/* Modal Réapprovisionnement Luxury */}
      {isRestockModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-700">
          <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl border border-emerald-100/50 animate-in zoom-in-95 duration-1000 overflow-hidden relative">
            <button onClick={() => setIsRestockModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-all duration-700 hover:rotate-90"><XCircle className="w-7 h-7" /></button>
            <form onSubmit={handleRestock} className="p-12 space-y-12">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner text-emerald-600 transition-all duration-1000 hover:scale-110 hover:rotate-6">
                  <ShoppingCart className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Réassortiment Expert</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{selectedItem.nom}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2 group-focus-within:translate-x-2 transition-transform duration-700">Unités à ajouter</label>
                  <div className="relative">
                    <input type="number" value={restockData.quantite} onChange={(e) => setRestockData({...restockData, quantite: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-8 py-6 outline-none font-black text-4xl shadow-inner transition-all duration-700" placeholder="0" required autoFocus />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-200 uppercase tracking-widest text-xs">PCS</span>
                  </div>
                </div>

                <div className="space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2 group-focus-within:translate-x-2 transition-transform duration-700">Prix d'achat global</label>
                  <div className="relative">
                    <input type="number" value={restockData.prix_achat_total} onChange={(e) => setRestockData({...restockData, prix_achat_total: e.target.value})} className="w-full bg-emerald-50/50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-8 py-6 outline-none font-black text-4xl text-emerald-600 shadow-inner transition-all duration-700" placeholder="0" required />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-emerald-200 uppercase tracking-widest text-xs">FCFA</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 group-focus-within:translate-x-2 transition-transform duration-700">Commentaire / Origine</label>
                  <input type="text" value={restockData.description} onChange={(e) => setRestockData({...restockData, description: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-8 py-4 outline-none font-bold text-sm shadow-inner transition-all duration-700" placeholder="Ex: Arrivage fournisseur France..." />
              </div>

              <div className="flex gap-6 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsRestockModalOpen(false)} 
                  className="flex-1 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 border-2 border-slate-100 hover:bg-slate-50 transition-all duration-700 active:scale-95"
                >
                  Annuler l'entrée
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all duration-700 active:scale-95"
                >
                  Valider en Caisse & Stock
                </button>
              </div>
            </form>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      )}

      {/* Modal Ajustement Inventaire Luxury */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-700">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-blue-100/50 animate-in zoom-in-95 duration-1000 overflow-hidden relative">
            <button onClick={() => setIsAdjustModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-all duration-700 hover:rotate-90"><XCircle className="w-7 h-7" /></button>
            <form onSubmit={handleAdjust} className="p-12 space-y-12">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner text-blue-600 transition-all duration-1000 hover:scale-110 hover:-rotate-6">
                  <RefreshCcw className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Inventaire Physique</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{selectedItem.nom}</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <span>Stock Théorique</span>
                      <span className="text-slate-900">{selectedItem.stock_theorique} PCS</span>
                   </div>
                   <p className="text-[9px] font-medium text-slate-400 italic">Le stock calculé par le système basé sur les entrées/sorties.</p>
                </div>

                <div className="space-y-3 group text-center">
                  <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest group-focus-within:translate-y-[-2px] transition-transform duration-700">Quantité comptée en rayon</label>
                  <input type="number" value={adjustData.quantite_physique} onChange={(e) => setAdjustData({...adjustData, quantite_physique: e.target.value})} className="w-full bg-blue-50/50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-8 py-8 outline-none font-black text-6xl text-blue-600 shadow-inner transition-all duration-700 text-center" placeholder="0" required autoFocus />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full px-8 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white shadow-2xl hover:bg-blue-600 transition-all duration-700 active:scale-95"
              >
                Mettre à jour & Enregistrer l'Écart
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;

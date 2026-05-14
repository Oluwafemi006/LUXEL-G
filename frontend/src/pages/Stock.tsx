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
  Info, 
  Layers, 
  ShieldCheck,
  TrendingDown,
  Warehouse
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
  seuil_alerte: number;
  prix_unitaire: string;
  emplacement?: string;
}

const Stock: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Form state for restocking
  const [restockData, setRestockData] = useState({ quantite: '', prix_achat_total: '' });

  const fetchStock = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    try {
      const quantite = Math.max(0, newQty);
      await api.patch(`stock/${itemId}/`, { quantite });
      fetchStock();
    } catch (error) {
      console.error('Erreur quantité:', error);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !restockData.quantite || !restockData.prix_achat_total) return;
    try {
      await api.post(`stock/${selectedItem.id}/approvisionner/`, {
        quantite: parseInt(restockData.quantite),
        prix_achat_total: parseFloat(restockData.prix_achat_total)
      });
      alert('Approvisionnement réussi et dépense enregistrée en caisse !');
      setIsRestockModalOpen(false);
      setRestockData({ quantite: '', prix_achat_total: '' });
      fetchStock();
    } catch (error) {
      alert('Erreur lors de l\'approvisionnement.');
    }
  };

  const handleAddStock = async (data: any) => {
    try {
      await api.post('stock/', data);
      setIsModalOpen(false);
      fetchStock();
    } catch (error) {
      alert('Erreur ajout article.');
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.nom.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return showOnlyLowStock ? (matchesSearch && item.quantite < item.seuil_alerte) : matchesSearch;
  });

  const lowStockCount = stock.filter(i => i.quantite < i.seuil_alerte).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Inventaire & Stock</h1>
          <p className="text-slate-500 font-medium">Gestion intelligente connectée au flux de caisse.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowOnlyLowStock(!showOnlyLowStock)} 
            className={`flex items-center gap-2 px-5 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 shadow-sm border ${showOnlyLowStock ? 'bg-rose-600 text-white border-rose-500 shadow-rose-200 translate-y-[-2px]' : 'bg-white text-slate-400 border-slate-100 hover:text-rose-600'}`}
          >
            <AlertTriangle className={`w-4 h-4 ${showOnlyLowStock ? 'animate-pulse' : ''}`} />
            ALERTES ({lowStockCount})
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn-primary-luxury flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* Liste des Articles (Gauche) */}
        <div className="col-span-12 lg:col-span-4 card-luxury overflow-hidden flex flex-col">
          <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="SKU, Nom de pièce..." 
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
                <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Scanning inventaire...</p>
              </div>
            ) : filteredStock.length === 0 ? (
              <div className="p-12 text-center opacity-40 grayscale space-y-4">
                <Warehouse className="w-12 h-12 mx-auto text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucun article trouvé</p>
              </div>
            ) : filteredStock.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)} 
                className={`p-6 cursor-pointer transition-all duration-500 hover:bg-emerald-50/30 flex items-center gap-5 group ${selectedItem?.id === item.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 translate-x-1' : ''} ${item.quantite < item.seuil_alerte ? 'bg-rose-50/10' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 ${item.quantite < item.seuil_alerte ? 'bg-rose-100 text-rose-600 shadow-rose-200' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                  <Package className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-emerald-600 transition-colors duration-500">{item.nom}</p>
                  <p className="text-[10px] text-emerald-600 font-black font-mono tracking-wider mt-1">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black italic tracking-tighter ${item.quantite < item.seuil_alerte ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>{item.quantite}</p>
                  {item.quantite < item.seuil_alerte && <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Bas</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails de l'Article (Droite) */}
        <div className="col-span-12 lg:col-span-8 card-luxury overflow-hidden flex flex-col relative">
          {selectedItem ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-700">
              {/* Header Fiche Article */}
              <div className="p-10 bg-emerald-50/10 border-b border-emerald-50/50 flex justify-between items-start">
                <div className="flex gap-10 items-center">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl rotate-3 group transition-transform duration-700 hover:rotate-0">
                    <Package className="w-10 h-10 mb-1" />
                    <span className="text-[8px] font-black tracking-[0.4em] text-emerald-400 uppercase">ITEM</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase">{selectedItem.nom}</h2>
                      <div className="h-2 w-10 bg-emerald-500 rounded-full opacity-20"></div>
                    </div>
                    <p className="text-emerald-600 font-black font-mono text-xl tracking-[0.2em] uppercase">{selectedItem.sku}</p>
                    <div className="pt-2">
                       <span className="flex items-center w-fit gap-2 text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm uppercase tracking-widest">
                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                        CATÉGORIE: {selectedItem.categorie.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRestockModalOpen(true)} 
                  className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 transition-all duration-500"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Approvisionner</span>
                </button>
              </div>

              <div className="flex-1 p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-emerald-50/5 overflow-y-auto custom-scrollbar">
                {/* Stats & Valeur */}
                <div className="space-y-8">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">État Technique</h3>
                  
                   <div className="card-luxury p-10 bg-white group hover:shadow-emerald-500/10 transition-all duration-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-8">Unités en Rayon</p>
                    <div className="flex items-center justify-center gap-10">
                      <button 
                        onClick={() => handleUpdateQuantity(selectedItem.id, selectedItem.quantite - 1)} 
                        className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-500 text-slate-400 shadow-inner active:scale-90 flex items-center justify-center"
                      >
                        <Minus className="w-8 h-8" />
                      </button>
                      
                      <div className="relative group/qty">
                        <span className={`text-8xl font-black italic tracking-tighter transition-all duration-700 ${selectedItem.quantite < selectedItem.seuil_alerte ? 'text-rose-600 drop-shadow-lg' : 'text-emerald-600'}`}>
                          {selectedItem.quantite}
                        </span>
                        <div className="absolute -right-4 -top-4 w-4 h-4 rounded-full bg-emerald-500 animate-ping opacity-20"></div>
                      </div>

                      <button 
                        onClick={() => handleUpdateQuantity(selectedItem.id, selectedItem.quantite + 1)} 
                        className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all duration-500 text-slate-400 shadow-inner active:scale-90 flex items-center justify-center"
                      >
                        <Plus className="w-8 h-8" />
                      </button>
                    </div>
                    {selectedItem.quantite < selectedItem.seuil_alerte && (
                       <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 justify-center">
                          <TrendingDown className="w-4 h-4 text-rose-600" />
                          <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Seuil de sécurité atteint</p>
                       </div>
                    )}
                  </div>

                  <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                       <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.4em] mb-4">Valorisation Stock</p>
                       <p className="text-5xl font-black italic tracking-tighter text-emerald-400">
                        {(Number(selectedItem.prix_unitaire) * selectedItem.quantite).toLocaleString()} <span className="text-xl not-italic text-white/50">F</span>
                       </p>
                    </div>
                    <Warehouse className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
                  </div>
                </div>

                {/* Détails Tarifaires */}
                <div className="space-y-8">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Fiche Tarifaire</h3>
                   <div className="card-luxury p-10 space-y-10">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center group/line">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-emerald-50 rounded-lg group-hover/line:bg-emerald-600 transition-colors duration-500">
                                <Tag className="w-4 h-4 text-emerald-600 group-hover/line:text-white" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix de Vente</span>
                          </div>
                          <span className="text-xl font-black text-slate-900 italic">{Number(selectedItem.prix_unitaire).toLocaleString()} F</span>
                        </div>

                        <div className="flex justify-between items-center group/line">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-rose-50 rounded-lg group-hover/line:bg-rose-600 transition-colors duration-500">
                                <AlertTriangle className="w-4 h-4 text-rose-600 group-hover/line:text-white" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seuil d'alerte</span>
                          </div>
                          <span className="text-xl font-black text-rose-600 italic">{selectedItem.seuil_alerte} <span className="text-[10px] not-italic text-slate-300">Unités</span></span>
                        </div>

                        <div className="flex justify-between items-center group/line">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-50 rounded-lg group-hover/line:bg-blue-600 transition-colors duration-500">
                                <ShieldCheck className="w-4 h-4 text-blue-600 group-hover/line:text-white" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emplacement</span>
                          </div>
                          <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">{selectedItem.emplacement || 'ZONE-A1'}</span>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-emerald-50/50">
                         <div className="flex items-start gap-4 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/30">
                            <Info className="w-6 h-6 text-emerald-500 shrink-0" />
                            <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                              Chaque approvisionnement rattaché à cet article créera automatiquement un mouvement de type "Dépense" dans votre journal de caisse.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-40 opacity-20 text-slate-400 grayscale">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner">
                <Package className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-2xl">Inventaire Central</p>
              <p className="text-[10px] font-bold mt-6 tracking-[0.3em]">SÉLECTIONNEZ UN ARTICLE DANS LA LISTE</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvel Article"><StockForm onSubmit={handleAddStock} onCancel={() => setIsModalOpen(false)} /></Modal>

      {isRestockModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-emerald-100/50 animate-in zoom-in duration-700 overflow-hidden">
            <form onSubmit={handleRestock} className="p-10 space-y-10">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-emerald-600">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Réassortiment</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{selectedItem.nom}</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2">Quantité à ajouter</label>
                  <div className="relative">
                    <input type="number" value={restockData.quantite} onChange={(e) => setRestockData({...restockData, quantite: e.target.value})} className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-8 py-5 outline-none focus:border-emerald-500 font-black text-3xl shadow-inner transition-all duration-500" placeholder="0" required autoFocus />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-200 uppercase tracking-widest">UNITÉS</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2">Prix d'achat total (Caisse)</label>
                  <div className="relative">
                    <input type="number" value={restockData.prix_achat_total} onChange={(e) => setRestockData({...restockData, prix_achat_total: e.target.value})} className="w-full bg-emerald-50/50 border border-emerald-100/50 rounded-2xl px-8 py-5 outline-none focus:border-emerald-500 font-black text-3xl text-emerald-600 shadow-inner transition-all duration-500" placeholder="0" required />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-emerald-200 uppercase tracking-widest">FCFA</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsRestockModalOpen(false)} 
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all duration-500"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all duration-700 active:scale-95"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;

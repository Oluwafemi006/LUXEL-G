import React, { useState, useEffect } from 'react';
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
  const [stock, setStock] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('stock/');
      const data = Array.isArray(response.data) ? response.data : [];
      setStock(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du stock:', error);
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
      
      // Update local state to reflect change immediately
      setStock(prev => prev.map(item => item.id === itemId ? { ...item, quantite } : item));
      if (selectedItem?.id === itemId) {
        setSelectedItem({ ...selectedItem, quantite });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
    }
  };

  const handleAddStock = async (data: any) => {
    try {
      await api.post('stock/', data);
      setIsModalOpen(false);
      fetchStock();
    } catch (error) {
      alert('Une erreur est survenue lors de l\'ajout de l\'article.');
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = 
      (item.nom || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const isLowStock = item.quantite < item.seuil_alerte;
    
    if (showOnlyLowStock) return matchesSearch && isLowStock;
    return matchesSearch;
  });

  const lowStockCount = stock.filter(item => item.quantite < item.seuil_alerte).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Inventaire & Stock</h1>
          <p className="text-on-surface-variant font-medium">Gestion des pièces détachées et consommables.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all ${
              showOnlyLowStock 
                ? 'bg-error text-on-primary shadow-lg shadow-error/20' 
                : 'bg-surface-container text-on-surface-variant border border-outline/10 hover:bg-outline/5'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{showOnlyLowStock ? 'warning' : 'filter_list'}</span>
            ALERTES ({lowStockCount})
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add_box</span>
            <span>Nouvelle Pièce</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Liste des Articles (Colonne Gauche) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline/10 bg-surface-container/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text"
                placeholder="Nom, référence SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-outline/20 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-outline/5">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-primary font-bold">Chargement...</div>
            ) : filteredStock.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs font-bold uppercase">Aucun article.</div>
            ) : filteredStock.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`p-4 cursor-pointer transition-all hover:bg-primary/5 flex items-center gap-4 ${selectedItem?.id === item.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''} ${item.quantite < item.seuil_alerte ? 'bg-error/[0.02]' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.quantite < item.seuil_alerte ? 'bg-error/10 text-error' : (selectedItem?.id === item.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant')}`}>
                  <span className="material-symbols-outlined text-lg">{item.quantite < item.seuil_alerte ? 'warning' : 'settings_b_roll'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{item.nom}</p>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-black font-mono">
                    {item.sku}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${item.quantite < item.seuil_alerte ? 'text-error' : 'text-on-surface'}`}>{item.quantite}</p>
                  <p className="text-[9px] font-bold text-on-surface-variant">UNITÉS</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails de l'Article (Colonne Droite) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-outline/10 shadow-lg overflow-hidden flex flex-col">
          {selectedItem ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
              {/* Entête Article */}
              <div className="p-6 bg-primary/[0.03] border-b border-outline/10 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                   <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg ${selectedItem.quantite < selectedItem.seuil_alerte ? 'bg-error text-on-primary' : 'bg-primary text-on-primary'}`}>
                    <span className="material-symbols-outlined text-3xl">{selectedItem.quantite < selectedItem.seuil_alerte ? 'report' : 'inventory_2'}</span>
                    <span className="text-[10px] font-black mt-1">STOCK</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-on-surface">{selectedItem.nom}</h2>
                    <p className="text-on-surface-variant font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                      REF: <span className="font-mono text-primary">{selectedItem.sku}</span>
                    </p>
                    <div className="mt-2 flex gap-3">
                      <span className="flex items-center gap-1 text-[10px] font-black text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                        CATÉGORIE: {selectedItem.categorie}
                      </span>
                      {selectedItem.emplacement && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                          <span className="material-symbols-outlined text-[14px]">grid_view</span>
                          {selectedItem.emplacement}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-surface-container rounded-xl transition-colors text-on-surface-variant">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Statistiques Stock */}
                <div className="w-1/3 border-r border-outline/10 overflow-y-auto p-6 space-y-6 bg-surface-container/5">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">État de l'inventaire</h3>
                   
                   <div className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-outline/10 shadow-sm text-center">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase mb-2">Quantité Disponible</p>
                        <div className="flex items-center justify-center gap-4">
                           <button 
                            onClick={() => handleUpdateQuantity(selectedItem.id, selectedItem.quantite - 1)}
                            className="w-10 h-10 rounded-xl border border-outline/10 hover:bg-surface-container transition-all text-on-surface-variant"
                           >
                            <span className="material-symbols-outlined">remove</span>
                           </button>
                           <span className={`text-3xl font-black ${selectedItem.quantite < selectedItem.seuil_alerte ? 'text-error' : 'text-primary'}`}>
                            {selectedItem.quantite}
                           </span>
                           <button 
                            onClick={() => handleUpdateQuantity(selectedItem.id, selectedItem.quantite + 1)}
                            className="w-10 h-10 rounded-xl border border-outline/10 hover:bg-surface-container transition-all text-on-surface-variant"
                           >
                            <span className="material-symbols-outlined">add</span>
                           </button>
                        </div>
                        <p className="text-[10px] font-bold text-on-surface-variant mt-2">Seuil d'alerte: {selectedItem.seuil_alerte}</p>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-outline/10 shadow-sm">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase mb-1">Valeur Unitaire</p>
                        <p className="text-xl font-black text-on-surface">{Number(selectedItem.prix_unitaire).toLocaleString()} F</p>
                      </div>

                      <div className="p-4 bg-primary text-on-primary rounded-2xl shadow-lg shadow-primary/20">
                        <p className="text-[9px] font-black uppercase opacity-60 mb-1">Valeur Totale Stock</p>
                        <p className="text-xl font-black">{(Number(selectedItem.prix_unitaire) * selectedItem.quantite).toLocaleString()} F</p>
                      </div>
                   </div>
                </div>

                {/* Détails supplémentaires & Historique (Simulé pour l'UI) */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">Mouvements de Stock</h3>
                    
                    <div className="space-y-4">
                      {/* Placeholder pour les futurs mouvements de stock */}
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">download</span>
                        </div>
                        <div className="flex-1 bg-white border border-outline/10 p-4 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-black text-on-surface uppercase tracking-tight">Entrée initiale</span>
                            <span className="text-[10px] font-bold text-on-surface-variant">Aujourd'hui</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">Mise à jour manuelle de l'inventaire.</p>
                        </div>
                      </div>
                    </div>

                    {selectedItem.quantite < selectedItem.seuil_alerte && (
                      <div className="mt-12 p-6 bg-error/5 border-2 border-dashed border-error/20 rounded-2xl flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-error text-on-primary flex items-center justify-center shadow-lg shadow-error/20">
                          <span className="material-symbols-outlined text-2xl">priority_high</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-error uppercase">Réapprovisionnement Urgent</h4>
                          <p className="text-xs text-on-surface-variant font-medium mt-1">Le stock est descendu en dessous du seuil de sécurité ({selectedItem.seuil_alerte} unités). Veuillez passer commande.</p>
                        </div>
                        <button className="px-4 py-2 bg-error text-on-primary rounded-xl text-[10px] font-black uppercase shadow-md hover:scale-105 transition-all">
                          Passer Commande
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20">
              <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
              <p className="font-black uppercase tracking-[0.3em]">Sélectionnez une pièce détachée</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Ajouter un article"
      >
        <StockForm 
          onSubmit={handleAddStock} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Stock;

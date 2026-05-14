import React, { useState, useEffect, useRef } from 'react';
import { Search, Package } from 'lucide-react';

interface StockItem {
  id: number;
  nom: string;
  sku: string;
  quantite: number;
  prix_unitaire: number;
}

interface StockSearchInputProps {
  stock: StockItem[];
  onSelect: (item: StockItem) => void;
  placeholder?: string;
  className?: string;
}

const StockSearchInput: React.FC<StockSearchInputProps> = ({ stock, onSelect, placeholder = "Sélectionner depuis l'inventaire...", className = "" }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredStock = stock.filter(item => 
    item.nom.toLowerCase().includes(query.toLowerCase()) || 
    item.sku.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex items-center bg-emerald-50/30 rounded-xl border border-emerald-100/50 px-4 focus-within:border-emerald-500/50 focus-within:bg-white transition-all duration-500 shadow-inner group">
        <Search className="w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none py-2.5 px-3 text-[11px] font-black text-slate-900 placeholder:text-slate-300 uppercase tracking-tighter"
        />
      </div>

      {isOpen && (query.length > 0 || filteredStock.length > 0) && (
        <div className="absolute z-[60] w-[120%] left-0 mt-2 bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-2 border-b border-emerald-50 bg-emerald-50/10 flex items-center gap-2">
             <Package className="w-3 h-3 text-emerald-500" />
             <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Résultats Inventaire</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-emerald-50/30">
            {filteredStock.length > 0 ? (
              filteredStock.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    setQuery('');
                    setIsOpen(false);
                  }}
                  className="px-5 py-4 hover:bg-emerald-50/50 cursor-pointer transition-all duration-300 flex flex-col gap-1 group"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-black text-slate-900 uppercase group-hover:text-emerald-600 transition-colors">{item.nom}</p>
                    <p className="text-[9px] font-black text-emerald-600 font-mono tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">{item.sku}</p>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div className="flex items-center gap-2">
                       <div className={`h-1.5 w-1.5 rounded-full ${item.quantite > 0 ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`}></div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.quantite} disponibles</p>
                    </div>
                    <p className="text-xs font-black text-slate-900 italic tracking-tighter">{Number(item.prix_unitaire).toLocaleString()} F</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-100 mx-auto" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Référence introuvable</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearchInput;

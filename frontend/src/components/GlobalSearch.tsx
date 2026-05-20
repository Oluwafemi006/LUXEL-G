import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Car, Wrench, X, Loader2 } from 'lucide-react';
import api from '../services/api';

interface SearchResult {
  clients: { id: number; nom: string; prenoms: string; contact: string }[];
  vehicules: { id: number; immatriculation: string; marque: string; modele: string; client_nom: string }[];
  reparations: { id: number; description: string; statut: string; immatriculation: string; client_nom: string }[];
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  EN_COURS:   { label: 'En cours',   color: 'bg-blue-100 text-blue-700' },
  TERMINE:    { label: 'Terminé',    color: 'bg-emerald-100 text-emerald-700' },
  ANNULE:     { label: 'Annulé',     color: 'bg-rose-100 text-rose-700' },
};

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalResults = results
    ? results.clients.length + results.vehicules.length + results.reparations.length
    : 0;

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<SearchResult>('search/', { params: { q } });
      setResults(data);
      setOpen(true);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    navigate(path);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-96">
      {/* Input */}
      <div className={`flex items-center gap-3 bg-slate-50 border px-4 py-1.5 rounded-md transition-all duration-300 ${
        open ? 'border-emerald-500 bg-white shadow-md shadow-emerald-50' : 'border-slate-200'
      }`}>
        {loading
          ? <Loader2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 animate-spin" />
          : <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results && setOpen(true)}
          placeholder="RECHERCHER UN CLIENT, VÉHICULE..."
          className="bg-transparent border-none focus:ring-0 text-xs w-full outline-none font-oswald font-semibold text-slate-700 placeholder:text-slate-400 uppercase tracking-widest"
        />
        {query && (
          <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="hidden md:flex items-center gap-0.5 text-[10px] font-mono text-slate-300 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 flex-shrink-0">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {open && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden max-h-[480px] overflow-y-auto">

          {totalResults === 0 ? (
            <div className="px-5 py-8 text-center">
              <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-oswald font-semibold text-slate-400 uppercase tracking-widest">
                Aucun résultat pour « {query} »
              </p>
            </div>
          ) : (
            <>
              {/* Clients */}
              {results.clients.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Users className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-oswald">
                      Clients ({results.clients.length})
                    </span>
                  </div>
                  {results.clients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleNavigate('/staff/clients')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left border-b border-slate-50 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bebas flex-shrink-0 group-hover:scale-105 transition-transform">
                        {c.nom[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-oswald font-bold text-slate-900 truncate uppercase tracking-wide">
                          {c.nom} {c.prenoms}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{c.contact}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Véhicules */}
              {results.vehicules.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Car className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-oswald">
                      Véhicules ({results.vehicules.length})
                    </span>
                  </div>
                  {results.vehicules.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleNavigate('/staff/vehicules')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-oswald font-bold text-slate-900 tracking-widest">
                          {v.immatriculation}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {v.marque} {v.modele} — <span className="text-emerald-600">{v.client_nom}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Réparations */}
              {results.reparations.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Wrench className="w-3 h-3 text-orange-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-oswald">
                      Réparations ({results.reparations.length})
                    </span>
                  </div>
                  {results.reparations.map(r => {
                    const statut = STATUT_LABELS[r.statut] ?? { label: r.statut, color: 'bg-slate-100 text-slate-600' };
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleNavigate('/staff/reparations')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left border-b border-slate-50 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-oswald font-bold text-slate-900 tracking-wider">
                              OR-{r.id} — {r.immatriculation}
                            </p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest flex-shrink-0 ${statut.color}`}>
                              {statut.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{r.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-oswald uppercase tracking-widest">
                  {totalResults} résultat{totalResults > 1 ? 's' : ''} — Appuyez sur <kbd className="font-mono bg-white border border-slate-200 px-1 rounded">Échap</kbd> pour fermer
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

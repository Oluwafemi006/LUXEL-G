import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  PlusCircle, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Receipt, 
  Printer, 
  Mail, 
  Share2, 
  Save, 
  ArrowRightCircle, 
  ChevronRight,
  Wrench,
  Car,
  Users,
  Info,
  Trash2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Modal from '../components/Modal';
import api, { fetchAllPages } from '../services/api';
import StockSearchInput from '../components/StockSearchInput';

interface LaborLine {
  id: string | number;
  description: string;
  montant: number;
}

interface PartLine {
  id: string | number;
  article_stock?: number | null;
  reference: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
}

interface StockItem {
  id: number;
  nom: string;
  sku: string;
  quantite: number;
  prix_unitaire: number;
  seuil_alerte: number;
}

interface Repair {
  id: number;
  vehicule_plate: string;
  categorie: string;
  description: string;
  statut: string;
  date_creation: string;
  client_name?: string;
  client_contact?: string;
  email?: string;
  kilometrage?: number;
  travaux: LaborLine[];
  pieces: PartLine[];
}

interface Quote {
  id: number;
  reparation: number;
  numero_devis: string;
  statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'FACTURE';
  total_ht: number;
  tva: number;
  total_ttc: number;
  date_creation: string;
  date_validite?: string;
  client_name?: string;
  vehicule_plate?: string;
  notes?: string;
}

const Quotes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE'>('LIST');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [currentQuoteId, setCurrentQuoteId] = useState<number | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  
  // États de saisie
  const [kmsEntree, setKmsEntree] = useState('');
  const [laborLines, setLaborLines] = useState<LaborLine[]>([]);
  const [partLines, setPartLines] = useState<PartLine[]>([]);
  const [notes, setNotes] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAISuggestionModalOpen, setIsAISuggestionModalOpen] = useState(false);
  const [activePartLineId, setActivePartLineId] = useState<string | number | null>(null);

  const selectAISuggestion = (suggestion: any) => {
    if (activePartLineId) {
        updatePart(activePartLineId, 'description', suggestion.nom);
        if (suggestion.reference_standard) updatePart(activePartLineId, 'reference', suggestion.reference_standard);
        if (suggestion.prix_indicatif) updatePart(activePartLineId, 'prix_unitaire', suggestion.prix_indicatif);
    }
    setIsAISuggestionModalOpen(false);
    setAiSuggestions([]);
    setActivePartLineId(null);
  };

  const fetchRepairs = async () => {
    try {
      setRepairs(await fetchAllPages<Repair>('reparations/'));
    } catch (error) {
      console.error('Erreur chargement repairs:', error);
    }
  };

  const fetchQuotes = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setQuotes(await fetchAllPages<Quote>('devis/'));
    } catch (error) {
      console.error('Erreur chargement devis:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchStock = async () => {
    try {
      setStock(await fetchAllPages<StockItem>('stock/'));
    } catch (error) {
      console.error('Erreur chargement stock:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchQuotes(), fetchRepairs(), fetchStock()]);
    };
    init();
  }, []);

  // Gérer l'auto-sélection depuis la navigation
  useEffect(() => {
    const state = location.state as { repairId?: number };
    if (state?.repairId && repairs.length > 0) {
      const repair = repairs.find(r => r.id === state.repairId);
      if (repair) {
        setViewMode('CREATE');
        handleSelectRepair(repair);
      }
    }
  }, [repairs, location.state]);

  const handleViewQuote = async (quote: Quote) => {
    try {
      setLoading(true);
      const resRepair = await api.get(`reparations/${quote.reparation}/`);
      const repairData = resRepair.data;
      setSelectedRepair(repairData);
      setCurrentQuoteId(quote.id);
      setCurrentQuote(quote);
      setKmsEntree(repairData.kilometrage?.toString() || '');
      setNotes(quote.notes || '');
      
      setLaborLines(repairData.travaux.length > 0 ? repairData.travaux : [{ id: 'tmp1', description: '', montant: 0 }]);
      setPartLines(repairData.pieces.length > 0 ? repairData.pieces : [{ id: 'tmp1', reference: '', description: '', quantite: 1, prix_unitaire: 0, article_stock: null }]);
      
      setViewMode('CREATE');
      setShowDetailMobile(true);
    } catch (error) {
      console.error('Erreur chargement détails devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentQuoteId) return;
    try {
      const response = await api.get(`devis/${currentQuoteId}/download_pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Devis_${currentQuote?.numero_devis || 'Brouillon'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Erreur lors du téléchargement du PDF.');
    }
  };

  const handleSendEmail = async () => {
    if (!currentQuoteId) return;
    try {
      await api.post(`devis/${currentQuoteId}/envoyer_email/`);
      alert('Devis envoyé par email avec succès !');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erreur lors de l\'envoi de l\'email.';
      alert(msg);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!selectedRepair || !currentQuote) return;
    
    let phone = selectedRepair.client_contact?.replace(/\D/g, '') || '';
    if (phone.startsWith('00229')) phone = phone.substring(2);
    if (!phone.startsWith('229')) phone = '229' + phone;
    
    const { data } = await api.get(`devis/${currentQuote.id}/share_link/`);
    const pdfUrl = data.url;
    const message = `Bonjour ${selectedRepair.client_name}, LUXEL-G vous a envoyé un devis estimé à ${Number(currentQuote.total_ttc).toLocaleString()} F pour votre véhicule ${selectedRepair.vehicule_plate}.\n\n📄 Consulter le devis ici : ${pdfUrl}\n\nNous attendons votre retour pour débuter les travaux.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSelectRepair = (repair: Repair) => {
    setSelectedRepair(repair);
    setKmsEntree(repair.kilometrage?.toString() || '');
    setLaborLines(repair.travaux.length > 0 ? repair.travaux : [{ id: 'tmp1', description: '', montant: 0 }]);
    setPartLines(repair.pieces.length > 0 ? repair.pieces : [{ id: 'tmp1', reference: '', description: '', quantite: 1, prix_unitaire: 0, article_stock: null }]);
    
    const existingQuote = quotes.find(q => q.reparation === repair.id);
    if (existingQuote) {
      setCurrentQuoteId(existingQuote.id);
      setCurrentQuote(existingQuote);
      setNotes(existingQuote.notes || '');
    } else {
      setCurrentQuoteId(null);
      setCurrentQuote(null);
      setNotes('');
    }
    setShowDetailMobile(true);
  };

  const handleConvertToInvoice = async () => {
    if (!currentQuoteId) return;
    if (!window.confirm('Voulez-vous transformer ce devis en facture proforma ?')) return;
    
    try {
      const response = await api.post(`devis/${currentQuoteId}/transformer_en_facture/`);
      const newInvoice = response.data;
      alert('Devis transformé en facture avec succès !');
      navigate('/staff/factures', { state: { repairId: newInvoice.reparation } });
    } catch (error) {
      console.error('Erreur transformation:', error);
      alert('Erreur lors de la transformation.');
    }
  };

  const totalLabor = useMemo(() => laborLines.reduce((sum, line) => sum + Number(line.montant), 0), [laborLines]);
  const totalParts = useMemo(() => partLines.reduce((sum, line) => sum + (Number(line.quantite) * Number(line.prix_unitaire)), 0), [partLines]);
  const grandTotal = totalLabor + totalParts;

  const addLaborLine = () => setLaborLines([...laborLines, { id: `tmp${Date.now()}`, description: '', montant: 0 }]);
  const addPartLine = () => setPartLines([...partLines, { id: `tmp${Date.now()}`, reference: '', description: '', quantite: 1, prix_unitaire: 0, article_stock: null }]);

  const removeLaborLine = async (id: string | number) => {
    if (typeof id === 'number') {
      if (!window.confirm('Voulez-vous vraiment supprimer cette ligne ?')) return;
      try {
        await api.delete(`travaux/${id}/`);
      } catch (error) {
        console.error('Erreur suppression ligne:', error);
        return;
      }
    }
    setLaborLines(laborLines.filter(l => l.id !== id));
  };

  const removePartLine = async (id: string | number) => {
    if (typeof id === 'number') {
      if (!window.confirm('Voulez-vous vraiment supprimer cette pièce ?')) return;
      try {
        await api.delete(`pieces-reparation/${id}/`);
      } catch (error) {
        console.error('Erreur suppression pièce:', error);
        return;
      }
    }
    setPartLines(partLines.filter(p => p.id !== id));
  };

  const updateLabor = (id: string | number, field: keyof LaborLine, value: any) => {
    setLaborLines(laborLines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const updatePart = (id: string | number, field: keyof PartLine, value: any) => {
    setPartLines(partLines.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleStockSelect = (id: string | number, stockId: string) => {
    const item = stock.find(s => s.id.toString() === stockId);
    if (item) {
      setPartLines(partLines.map(p => p.id === id ? { 
        ...p, 
        article_stock: item.id,
        description: item.nom,
        reference: item.sku,
        prix_unitaire: item.prix_unitaire
      } : p));
    }
  };

  const handleSaveQuote = async (newStatut?: string) => {
    if (!selectedRepair) return;
    try {
      await api.patch(`reparations/${selectedRepair.id}/`, { kilometrage: parseInt(kmsEntree) || 0 });

      const quoteData = {
        reparation: selectedRepair.id,
        statut: newStatut || (currentQuote?.statut || 'BROUILLON'),
        total_ht: grandTotal,
        tva: 0,
        total_ttc: grandTotal,
        notes: notes
      };
      
      let quoteId = currentQuoteId;
      if (quoteId) {
        const res = await api.patch(`devis/${quoteId}/`, quoteData);
        setCurrentQuote(res.data);
      } else {
        const resQuote = await api.post('devis/', quoteData);
        quoteId = resQuote.data.id;
        setCurrentQuoteId(quoteId);
        setCurrentQuote(resQuote.data);
      }

      // Sauvegarde des lignes (uniquement si remplies)
      for (const line of laborLines) {
        if (line.description.trim() && line.montant > 0) {
          if (typeof line.id === 'string' && line.id.startsWith('tmp')) {
            await api.post('travaux/', { description: line.description, montant: line.montant, reparation: selectedRepair.id });
          } else {
            await api.patch(`travaux/${line.id}/`, { description: line.description, montant: line.montant });
          }
        }
      }
      for (const line of partLines) {
        if (line.description.trim() && line.prix_unitaire > 0) {
          const partData = { 
            reference: line.reference, 
            description: line.description, 
            quantite: line.quantite, 
            prix_unitaire: line.prix_unitaire, 
            reparation: selectedRepair.id,
            article_stock: line.article_stock
          };
          if (typeof line.id === 'string' && line.id.startsWith('tmp')) {
            await api.post('pieces-reparation/', partData);
          } else {
            await api.patch(`pieces-reparation/${line.id}/`, partData);
          }
        }
      }

      alert('Enregistrement réussi !');
      fetchQuotes(true);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => 
      q.numero_devis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.vehicule_plate?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [quotes, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <style>
        {` @media print { aside, header, .no-print, button, .tabs-quote { display: none !important; } body { background: white !important; } .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; } .lg\\:col-span-3 { display: none !important; } .lg\\:col-span-9 { width: 100% !important; border: none !important; } .p-8 { padding: 0 !important; } } `}
      </style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Gestion des Devis</h1>
          <p className="text-slate-500 font-medium">Propositions commerciales et estimations tarifaires.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-lg border border-emerald-100/50 shadow-sm tabs-quote">
          <button 
            onClick={() => setViewMode('LIST')} 
            className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${viewMode === 'LIST' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}
          > 
            LISTE 
          </button>
          <button 
            onClick={() => { setViewMode('CREATE'); setSelectedRepair(null); setCurrentQuoteId(null); setCurrentQuote(null); setKmsEntree(''); setLaborLines([]); setPartLines([]); setNotes(''); }} 
            className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${viewMode === 'CREATE' && !currentQuoteId ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}
          > 
            NOUVEAU 
          </button>
        </div>
      </div>

      {viewMode === 'LIST' ? (
        <div className="card-luxury overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
          <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/10 flex items-center justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Rechercher par client, immatriculation ou N°..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-emerald-100/50 rounded-2xl outline-none focus:border-emerald-500/50 transition-all duration-500 text-sm font-bold placeholder:text-slate-300 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 bg-emerald-100/50 px-4 py-2 rounded-xl">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{quotes.length} Devis</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black border-b border-emerald-50/30">
                  <th className="px-8 py-5">N° Devis</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5">Véhicule & Client</th>
                  <th className="px-8 py-5 text-right">Montant TTC</th>
                  <th className="px-8 py-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/20">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center animate-pulse text-emerald-600 font-black uppercase text-xs tracking-widest">Initialisation...</td></tr>
                ) : filteredQuotes.map((q) => (
                  <tr key={q.id} onClick={() => handleViewQuote(q)} className="hover:bg-emerald-50/30 transition-all duration-500 cursor-pointer group">
                    <td className="px-8 py-6">
                      <p className="font-mono font-black text-emerald-600 group-hover:scale-105 transition-transform duration-500 origin-left uppercase">{q.numero_devis || `ESTIM-OR-${q.reparation}`}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center w-fit gap-2 shadow-sm ${
                        q.statut === 'ACCEPTE' ? 'bg-emerald-600 text-white shadow-emerald-200' : 
                        q.statut === 'REFUSE' ? 'bg-rose-600 text-white shadow-rose-200' : 
                        q.statut === 'FACTURE' ? 'bg-slate-900 text-white shadow-slate-900/10' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {q.statut === 'ACCEPTE' ? <CheckCircle2 className="w-3 h-3" /> : q.statut === 'REFUSE' ? <XCircle className="w-3 h-3" /> : q.statut === 'FACTURE' ? <Receipt className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                        {q.statut === 'BROUILLON' ? 'PROFORMA' : q.statut}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-sm text-slate-900 uppercase tracking-tight">{q.vehicule_plate}</p>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">{q.client_name}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-black text-slate-900 text-base italic">{Number(q.total_ttc).toLocaleString()} F</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(q.date_creation).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {/* Liste OR à gauche */}
          <div className={`col-span-12 lg:col-span-3 space-y-6 no-print ${showDetailMobile ? 'hidden lg:block' : 'block'}`}>
            <div className="card-luxury overflow-hidden flex flex-col max-h-[750px]">
              <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/20">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-emerald-800">OR Sans Devis</h3>
              </div>
              <div className="overflow-y-auto custom-scrollbar divide-y divide-emerald-50/30">
                {repairs.filter(r => !quotes.some(q => q.reparation === r.id)).map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => handleSelectRepair(r)} 
                    className={`p-6 cursor-pointer transition-all duration-500 flex flex-col gap-1 ${selectedRepair?.id === r.id ? 'bg-emerald-600 text-white shadow-inner scale-[0.98] rounded-xl mx-2 my-2' : 'hover:bg-emerald-50/50'}`}
                  >
                    <div className="flex justify-between items-center">
                      <p className={`font-mono text-[10px] font-black ${selectedRepair?.id === r.id ? 'text-emerald-100' : 'text-emerald-600'}`}>OR-{r.id.toString().padStart(4, '0')}</p>
                      {selectedRepair?.id === r.id && <ChevronRight className="w-4 h-4 text-white" />}
                    </div>
                    <p className={`text-sm font-black uppercase tracking-tight ${selectedRepair?.id === r.id ? 'text-white' : 'text-slate-900'}`}>{r.vehicule_plate}</p>
                    <p className={`text-[10px] font-bold ${selectedRepair?.id === r.id ? 'text-emerald-200' : 'text-slate-400'} truncate`}>{r.client_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Devis à droite */}
          <div className={`col-span-12 lg:col-span-9 card-luxury p-6 sm:p-12 space-y-8 sm:space-y-10 flex flex-col relative ${showDetailMobile ? 'block' : 'hidden lg:block'}`}>
            {selectedRepair ? (
              <div className="animate-in fade-in duration-700 space-y-8 sm:space-y-10">
                {/* Bouton Retour Mobile */}
                <button 
                  onClick={() => setShowDetailMobile(false)}
                  className="lg:hidden flex items-center gap-2 mb-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 self-start no-print"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste
                </button>

                {/* Header Devis */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 sm:pb-10 border-b-4 border-emerald-500/10">
                  <div className="space-y-2">
                    <h2 className="text-4xl sm:text-5xl font-black text-emerald-600 italic tracking-tighter">LUXEL<span className="text-slate-900">-G</span></h2>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-10 bg-emerald-50 rounded-full"></div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Estimation Technique</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-3 w-full sm:w-auto">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter tracking-[0.1em]">Devis Estimatif</h2>
                    <div className="font-mono text-xs sm:text-sm font-black text-emerald-600 bg-emerald-50 px-4 sm:px-6 py-2 rounded-full inline-block border border-emerald-100 shadow-inner">
                      {currentQuote?.numero_devis || `ESTIM-OR-${selectedRepair.id}`}
                    </div>
                  </div>
                </div>

                {/* Infos Client & Véhicule */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 bg-slate-50/50 p-6 sm:p-8 rounded-xl border border-emerald-100/30 shadow-inner relative overflow-hidden">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest opacity-70 flex items-center gap-2">
                      <Users className="w-3 h-3" /> Client
                    </label>
                    <div>
                      <p className="text-base sm:text-lg font-black text-slate-900 uppercase truncate">{selectedRepair.client_name}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{selectedRepair.client_contact}</p>
                    </div>
                  </div>
                  <div className="space-y-3 sm:border-x border-emerald-100/50 sm:px-10 text-left sm:text-center">
                    <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest opacity-70 flex items-center sm:justify-center gap-2">
                      <Car className="w-3 h-3" /> Véhicule
                    </label>
                    <div>
                      <p className="text-lg sm:text-xl font-black text-emerald-600 font-mono truncate">{selectedRepair.vehicule_plate}</p>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{kmsEntree} KM</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-left sm:text-right">
                    <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest opacity-70 flex items-center sm:justify-end gap-2">
                      <Info className="w-3 h-3" /> Statut
                    </label>
                    <p className={`text-sm font-black uppercase italic ${currentQuote?.statut === 'ACCEPTE' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {currentQuote?.statut || 'BROUILLON'}
                    </p>
                  </div>
                </div>

                {/* Tableaux Lignes */}
                <div className="space-y-10">
                  {/* Main d'œuvre */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-emerald-100/50 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
                        <Wrench className="w-4 h-4" /> I. Travaux
                      </h3>
                      <button onClick={addLaborLine} className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-200 no-print">
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {laborLines.map(line => (
                        <div key={line.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center group">
                          <input value={line.description} onChange={(e) => updateLabor(line.id, 'description', e.target.value)} className="w-full sm:flex-1 bg-white border border-emerald-50 rounded-2xl px-4 sm:px-6 py-3 text-sm font-bold outline-none shadow-sm" placeholder="Description..."/>
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-40">
                              <input type="number" value={line.montant || ''} onChange={(e) => updateLabor(line.id, 'montant', parseInt(e.target.value) || 0)} className="w-full text-right bg-emerald-50/50 border border-emerald-100/30 rounded-2xl px-4 sm:px-6 py-3 text-sm font-black outline-none" placeholder="0"/>
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-400">F</span>
                            </div>
                            <button onClick={() => removeLaborLine(line.id)} className="p-2 text-rose-400 hover:text-rose-600 no-print">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pièces */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-emerald-100/50 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" /> II. Pièces
                      </h3>
                      <button onClick={addPartLine} className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-200 no-print">
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-emerald-50/30">
                            <th className="py-4 px-4">Désignation</th>
                            <th className="py-4 text-center w-24">Qté</th>
                            <th className="py-4 text-right w-32">P. Unit.</th>
                            <th className="py-4 text-right w-32">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50/20">
                          {partLines.map(line => (
                            <tr key={line.id} className="group">
                              <td className="py-4 px-4 relative">
                                <button onClick={() => removePartLine(line.id)} className="absolute -left-4 top-1/2 -translate-y-1/2 p-2 text-rose-400 no-print opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="flex flex-col gap-2">
                                  <input value={line.description} onChange={(e) => updatePart(line.id, 'description', e.target.value)} className="w-full bg-transparent outline-none font-black text-sm text-slate-900 uppercase" placeholder="Pièce..."/>
                                  <StockSearchInput 
                                    stock={stock} 
                                    onSelect={(item) => handleStockSelect(line.id, item.id.toString())} 
                                    className="no-print mt-1"
                                  />
                                </div>
                              </td>
                              <td className="py-4">
                                <div className="flex flex-col items-center">
                                  <input type="number" value={line.quantite} onChange={(e) => updatePart(line.id, 'quantite', parseInt(e.target.value) || 0)} className="w-16 bg-slate-100/50 rounded-xl py-1 text-center font-black text-sm outline-none"/>
                                </div>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <input type="number" value={line.prix_unitaire || ''} onChange={(e) => updatePart(line.id, 'prix_unitaire', parseInt(e.target.value) || 0)} className="w-24 bg-transparent outline-none text-right font-bold text-sm" placeholder="0"/>
                                  <span className="text-[10px] font-black text-slate-300">F</span>
                                </div>
                              </td>
                              <td className="py-4 text-right">
                                <span className="font-black text-emerald-600 italic text-sm">{(line.quantite * line.prix_unitaire).toLocaleString()} F</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-2">Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    className="w-full bg-emerald-50/20 border border-emerald-100/50 rounded-xl p-4 sm:p-6 text-sm font-medium outline-none shadow-inner" 
                    rows={3} 
                    placeholder="Précisions..."
                  />
                </div>

                {/* Actions et Total */}
                <div className="pt-8 flex flex-col xl:flex-row justify-between items-end gap-8 border-t-4 border-emerald-500/10 mt-6">
                  <div className="flex flex-wrap gap-3 sm:gap-4 no-print w-full xl:w-auto">
                    <button onClick={() => handleSaveQuote()} className="flex-1 sm:flex-none bg-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                      <Save className="w-4 h-4" /> Sauver
                    </button>
                    {currentQuoteId && currentQuote?.statut !== 'FACTURE' && (
                      <button onClick={handleConvertToInvoice} className="flex-1 sm:flex-none bg-slate-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                        <ArrowRightCircle className="w-4 h-4" /> Facturer
                      </button>
                    )}
                    
                    {currentQuoteId && (
                      <div className="flex gap-2 w-full sm:w-auto justify-center">
                        <button onClick={handleDownloadPDF} title="PDF" className="p-3 sm:p-4 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm">
                          <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={handleWhatsAppShare} title="WhatsApp" className="p-3 sm:p-4 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shadow-sm">
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button onClick={handleSendEmail} title="Email" className="p-3 sm:p-4 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 shadow-sm">
                          <Mail className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-full xl:w-80 bg-slate-900 text-white p-6 sm:p-8 rounded-xl shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Montant Global</span>
                        <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">{(grandTotal).toLocaleString()} F</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 sm:p-40 opacity-20 text-slate-400 grayscale">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-xl flex items-center justify-center mb-10 shadow-inner">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
                </div>
                <p className="font-black uppercase tracking-[0.5em] text-xl sm:text-2xl text-center">Module Devis</p>
                <p className="text-[10px] font-bold mt-6 tracking-[0.3em] text-center">SÉLECTIONNEZ UN ORDRE DE RÉPARATION</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal 
        isOpen={viewMode === 'CREATE' && !selectedRepair} 
        onClose={() => setViewMode('LIST')} 
        title="Nouveau Devis"
      >
        <div className="p-10 text-center space-y-6">
           <Wrench className="w-16 h-16 mx-auto text-emerald-500 opacity-20" />
           <p className="text-sm font-medium text-slate-500">Veuillez d'abord sélectionner un Ordre de Réparation dans la liste de gauche pour générer un devis.</p>
           <button onClick={() => setViewMode('LIST')} className="btn-primary-luxury">Retour à la liste</button>
        </div>
      </Modal>

      {/* Modal Suggestions IA Luxury */}
      {isAISuggestionModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-700">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-emerald-100/50 animate-in zoom-in-95 duration-700 overflow-hidden">
            <div className="p-8 sm:p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Assistant Pièces IA</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stock local et Intelligence Artificielle</p>
                  </div>
                </div>
                <button onClick={() => setIsAISuggestionModalOpen(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all">
                  <XCircle className="w-6 h-6 text-slate-300" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {aiSuggestions.map((s, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => selectAISuggestion(s)}
                    className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                           <h3 className="text-lg font-black text-slate-900 uppercase group-hover:text-emerald-600 transition-colors">{s.nom}</h3>
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${s.source === 'STOCK_LOCAL' ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                             {s.source === 'STOCK_LOCAL' ? 'En Stock' : 'Suggestion IA'}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{s.role}"</p>
                        <div className="flex gap-4">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Info className="w-3 h-3" /> {s.categorie}
                           </span>
                           {s.reference_standard && (
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 font-mono">
                                REF: {s.reference_standard}
                            </span>
                           )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-900 italic tracking-tighter">{Number(s.prix_indicatif).toLocaleString()} F</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Prix Estimé</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl flex items-center gap-6">
                 <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-emerald-400" />
                 </div>
                 <div className="flex-1">
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Expertise Garage</p>
                   <p className="text-xs text-slate-400 font-medium">
                     L'IA vous aide à ne plus faire d'erreurs sur les noms de pièces. Vérifiez toujours la compatibilité réelle.
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;

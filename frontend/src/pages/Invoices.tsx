import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

interface LaborLine {
  id: string | number;
  description: string;
  montant: number;
}

interface PartLine {
  id: string | number;
  reference: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
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

interface Invoice {
  id: number;
  reparation: number;
  numero_facture: string;
  type: 'PROFORMA' | 'DEFINITIVE';
  total_ht: number;
  tva: number;
  total_ttc: number;
  montant_paye: number;
  statut_paiement: 'NON_PAYE' | 'PARTIEL' | 'SOLDE';
  date_creation: string;
  client_name?: string;
  vehicule_plate?: string;
}

const Invoices: React.FC = () => {
  const location = useLocation();
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE'>('LIST');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('ESPECE');
  
  // États de saisie
  const [isDefinitive, setIsDefinitive] = useState(false);
  const [kmsEntree, setKmsEntree] = useState('');
  const [laborLines, setLaborLines] = useState<LaborLine[]>([]);
  const [partLines, setPartLines] = useState<PartLine[]>([]);

  const openPaymentModal = (invoice: Invoice) => {
    setPaymentAmount((invoice.total_ttc - invoice.montant_paye).toString());
    setIsPaymentModalOpen(true);
  };

  const fetchRepairs = async () => {
    try {
      const response = await api.get('reparations/');
      setRepairs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur chargement repairs:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('factures/');
      setInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchRepairs();
  }, []);

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      setLoading(true);
      const resRepair = await api.get(`reparations/${invoice.reparation}/`);
      const repairData = resRepair.data;
      setSelectedRepair(repairData);
      setCurrentInvoiceId(invoice.id);
      setCurrentInvoice(invoice);
      setIsDefinitive(invoice.type === 'DEFINITIVE');
      setKmsEntree(repairData.kilometrage?.toString() || '');
      
      setLaborLines(repairData.travaux.length > 0 ? repairData.travaux : [{ id: 'tmp1', description: '', montant: 0 }]);
      setPartLines(repairData.pieces.length > 0 ? repairData.pieces : [{ id: 'tmp1', reference: '', description: '', quantite: 1, prix_unitaire: 0 }]);
      
      setViewMode('CREATE');
    } catch (error) {
      console.error('Erreur chargement détails facture:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepair = (repair: Repair) => {
    setSelectedRepair(repair);
    setKmsEntree(repair.kilometrage?.toString() || '');
    // Auto-remplissage immédiat
    setLaborLines(repair.travaux.length > 0 ? repair.travaux : [{ id: 'tmp1', description: '', montant: 0 }]);
    setPartLines(repair.pieces.length > 0 ? repair.pieces : [{ id: 'tmp1', reference: '', description: '', quantite: 1, prix_unitaire: 0 }]);
    
    // Vérifier si une facture existe déjà pour cet OR
    const existingInvoice = invoices.find(inv => inv.reparation === repair.id);
    if (existingInvoice) {
      setCurrentInvoiceId(existingInvoice.id);
      setCurrentInvoice(existingInvoice);
      setIsDefinitive(existingInvoice.type === 'DEFINITIVE');
    } else {
      setCurrentInvoiceId(null);
      setCurrentInvoice(null);
      setIsDefinitive(false);
    }
  };

  const handleValidateDefinitive = async () => {
    if (!currentInvoiceId) return;
    if (!window.confirm('Voulez-vous vraiment valider cette facture comme DÉFINITIVE ? Cette action est irréversible.')) return;
    
    try {
      const response = await api.post(`factures/${currentInvoiceId}/valider/`);
      alert('Facture validée avec succès !');
      fetchInvoices();
      setCurrentInvoice(response.data);
      setIsDefinitive(true);
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation.');
    }
  };

  const handleRecordPayment = async () => {
    if (!currentInvoiceId || !paymentAmount || !currentInvoice) return;
    
    const amount = parseFloat(paymentAmount);
    const resteAPayer = currentInvoice.total_ttc - currentInvoice.montant_paye;

    if (amount > resteAPayer) {
      alert(`Erreur : Le montant saisi (${amount.toLocaleString()} F) dépasse le reste à payer (${resteAPayer.toLocaleString()} F).`);
      return;
    }

    try {
      const response = await api.post(`factures/${currentInvoiceId}/enregistrer_paiement/`, {
        montant: amount,
        mode_paiement: paymentMode
      });
      alert('Paiement enregistré et mouvement de caisse créé !');
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      fetchInvoices();
      setCurrentInvoice(response.data);
      // Recharger les détails de la facture
      if (selectedRepair) {
        const resRepair = await api.get(`reparations/${selectedRepair.id}/`);
        setSelectedRepair(resRepair.data);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erreur lors de l\'enregistrement du paiement.';
      alert(msg);
    }
  };

  // Gérer la redirection depuis Repairs
  useEffect(() => {
    if (location.state && repairs.length > 0) {
      const { repairId } = location.state as { repairId?: number };
      if (repairId) {
        const repair = repairs.find(r => r.id === repairId);
        if (repair) {
          setViewMode('CREATE');
          handleSelectRepair(repair);
        }
      }
    }
  }, [location.state, repairs]);

  // Calculs automatiques
  const totalLabor = useMemo(() => laborLines.reduce((sum, line) => sum + Number(line.montant), 0), [laborLines]);
  const totalParts = useMemo(() => partLines.reduce((sum, line) => sum + (Number(line.quantite) * Number(line.prix_unitaire)), 0), [partLines]);
  const grandTotal = totalLabor + totalParts;

  // Fonctions de gestion des lignes
  const addLaborLine = () => setLaborLines([...laborLines, { id: `tmp${Date.now()}`, description: '', montant: 0 }]);
  const addPartLine = () => setPartLines([...partLines, { id: `tmp${Date.now()}`, reference: '', description: '', quantite: 1, prix_unitaire: 0 }]);

  const updateLabor = (id: string | number, field: keyof LaborLine, value: any) => {
    setLaborLines(laborLines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const updatePart = (id: string | number, field: keyof PartLine, value: any) => {
    setPartLines(partLines.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSaveInvoice = async () => {
    if (!selectedRepair) return;
    try {
      await api.patch(`reparations/${selectedRepair.id}/`, { kilometrage: parseInt(kmsEntree) || 0 });

      const invoiceData = {
        reparation: selectedRepair.id,
        type: isDefinitive ? 'DEFINITIVE' : 'PROFORMA',
        total_ht: grandTotal,
        tva: 0,
        total_ttc: grandTotal
      };
      
      let invoiceId = currentInvoiceId;
      if (invoiceId) {
        const res = await api.patch(`factures/${invoiceId}/`, invoiceData);
        setCurrentInvoice(res.data);
      } else {
        const resInvoice = await api.post('factures/', invoiceData);
        invoiceId = resInvoice.data.id;
        setCurrentInvoiceId(invoiceId);
        setCurrentInvoice(resInvoice.data);
      }

      // Sauvegarde des lignes
      for (const line of laborLines) {
        if (line.description && line.montant > 0) {
          if (typeof line.id === 'string' && line.id.startsWith('tmp')) {
            await api.post('travaux/', { description: line.description, montant: line.montant, reparation: selectedRepair.id });
          } else {
            await api.patch(`travaux/${line.id}/`, { description: line.description, montant: line.montant });
          }
        }
      }
      for (const line of partLines) {
        if (line.description && line.prix_unitaire > 0) {
          if (typeof line.id === 'string' && line.id.startsWith('tmp')) {
            await api.post('pieces-reparation/', { 
              reference: line.reference, 
              description: line.description, 
              quantite: line.quantite, 
              prix_unitaire: line.prix_unitaire, 
              reparation: selectedRepair.id 
            });
          } else {
            await api.patch(`pieces-reparation/${line.id}/`, { 
              reference: line.reference, 
              description: line.description, 
              quantite: line.quantite, 
              prix_unitaire: line.prix_unitaire 
            });
          }
        }
      }

      alert('Enregistrement réussi !');
      fetchInvoices();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <style>
        {`
          @media print {
            aside, header, .no-print, button, .tabs-invoice { display: none !important; }
            body { background: white !important; }
            .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .grid { display: block !important; }
            .lg\\:col-span-3 { display: none !important; }
            .lg\\:col-span-9 { width: 100% !important; border: none !important; shadow: none !important; }
            .p-8 { padding: 0 !important; }
            .rounded-2xl { border-radius: 0 !important; }
            .shadow-xl { box-shadow: none !important; }
          }
        `}
      </style>

      {/* Header avec onglets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Facturation & Caisse</h1>
          <p className="text-on-surface-variant font-medium">Gestion des encaissements et documents financiers.</p>
        </div>
        <div className="flex bg-surface-container p-1 rounded-xl border border-outline/10 tabs-invoice">
          <button 
            onClick={() => setViewMode('LIST')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'LIST' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}
          > TOUTES LES FACTURES </button>
          <button 
            onClick={() => {
              setViewMode('CREATE');
              setSelectedRepair(null);
              setCurrentInvoiceId(null);
              setCurrentInvoice(null);
              setIsDefinitive(false);
              setKmsEntree('');
              setLaborLines([]);
              setPartLines([]);
            }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'CREATE' && !currentInvoiceId ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}
          > NOUVELLE FACTURE </button>
        </div>
      </div>

      {viewMode === 'LIST' ? (
        <div className="bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container/30 border-b border-outline/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">N° Facture</th>
                  <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">État</th>
                  <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Véhicule / Client</th>
                  <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right">Montant TTC</th>
                  <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right">Reste à payer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-xs font-black uppercase tracking-widest text-on-surface-variant">
                      Chargement des factures...
                    </td>
                  </tr>
                ) : invoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    onClick={() => handleViewInvoice(inv)}
                    className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono font-black text-primary">{inv.numero_facture || 'DOC-BROUILLON'}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${inv.type === 'DEFINITIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        inv.statut_paiement === 'SOLDE' ? 'bg-green-600 text-white' : 
                        inv.statut_paiement === 'PARTIEL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {inv.statut_paiement.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-on-surface">{inv.vehicule_plate}</p>
                      <p className="text-xs text-on-surface-variant font-medium">{inv.client_name}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-on-surface text-sm">
                      {Number(inv.total_ttc).toLocaleString()} F
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black ${inv.statut_paiement === 'SOLDE' ? 'text-green-600' : 'text-red-600'}`}>
                        {(inv.total_ttc - inv.montant_paye).toLocaleString()} F
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-4 no-print">
            <div className="bg-white rounded-2xl border border-outline/10 shadow-sm overflow-hidden flex flex-col max-h-[700px]">
              <div className="p-4 border-b border-outline/10 bg-surface-container/10">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">OR en attente</h3>
              </div>
              <div className="overflow-y-auto">
                {repairs.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => handleSelectRepair(r)}
                    className={`p-4 border-b border-outline/5 cursor-pointer transition-all ${selectedRepair?.id === r.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-surface-container/20'}`}
                  >
                    <p className="font-mono text-xs font-black text-primary">OR-{r.id.toString().padStart(4, '0')}</p>
                    <p className="text-sm font-bold text-on-surface">{r.vehicule_plate}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant truncate">{r.client_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl border border-outline/10 shadow-xl overflow-hidden flex flex-col">
            {selectedRepair ? (
              <div className="p-8 space-y-8 animate-in fade-in duration-300">
                <div className="flex justify-end no-print">
                   <div className="flex bg-surface-container p-1 rounded-lg border border-outline/10">
                    <button 
                      onClick={() => setIsDefinitive(false)}
                      disabled={currentInvoice?.type === 'DEFINITIVE'}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${!isDefinitive ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant disabled:opacity-50'}`}
                    > PROFORMA </button>
                    <button 
                      onClick={() => setIsDefinitive(true)}
                      disabled={currentInvoice?.type === 'DEFINITIVE'}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${isDefinitive ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant disabled:opacity-50'}`}
                    > DÉFINITIVE </button>
                  </div>
                </div>

                <div className="flex justify-between items-start pb-8 border-b-2 border-primary/10">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-primary italic tracking-tighter">LUXEL-G</h2>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">Luxury Elegance Garage</p>
                  </div>
                  <div className="text-right space-y-1">
                    <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight">{isDefinitive ? 'Facture Définitive' : 'Facture Proforma'}</h2>
                    <p className="font-mono text-sm font-bold text-primary bg-primary/5 px-3 py-1 rounded-full inline-block">
                      {currentInvoice?.numero_facture || `TEMP-OR-${selectedRepair.id}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 bg-surface-container/10 p-6 rounded-xl border border-outline/5 shadow-inner">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">Client</label>
                    <p className="text-sm font-bold text-on-surface">{selectedRepair.client_name}</p>
                    <p className="text-xs text-on-surface-variant font-bold">{selectedRepair.client_contact}</p>
                  </div>
                  <div className="space-y-2 border-x border-outline/10 px-8 text-center">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">Véhicule</label>
                    <p className="text-sm font-black text-primary font-mono">{selectedRepair.vehicule_plate}</p>
                    <p className="text-xs font-bold">{kmsEntree} KM</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">Statut Règlement</label>
                    <p className={`text-xs font-black uppercase ${currentInvoice?.statut_paiement === 'SOLDE' ? 'text-green-600' : 'text-red-600'}`}>
                      {currentInvoice?.statut_paiement?.replace('_', ' ') || 'NON CRÉÉE'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Travaux */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-outline/10 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary">I. Travaux & Main d'œuvre</h3>
                      {!isDefinitive && <button onClick={addLaborLine} className="text-[9px] font-black bg-primary text-on-primary px-2 py-1 rounded shadow-sm no-print">AJOUTER</button>}
                    </div>
                    {laborLines.map(line => (
                      <div key={line.id} className="flex gap-4 items-center">
                        <input disabled={isDefinitive} value={line.description} onChange={(e) => updateLabor(line.id, 'description', e.target.value)} className="flex-1 bg-transparent border-b border-outline/5 py-1 text-sm font-medium outline-none focus:border-primary disabled:opacity-60" placeholder="Description..."/>
                        <input disabled={isDefinitive} type="number" value={line.montant || ''} onChange={(e) => updateLabor(line.id, 'montant', parseInt(e.target.value) || 0)} className="w-24 text-right bg-transparent border-b border-outline/5 py-1 text-sm font-black outline-none focus:border-primary disabled:opacity-60" placeholder="0"/>
                      </div>
                    ))}
                  </div>

                  {/* Pièces */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-outline/10 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary">II. Pièces & Fournitures</h3>
                      {!isDefinitive && <button onClick={addPartLine} className="text-[9px] font-black bg-primary text-on-primary px-2 py-1 rounded shadow-sm no-print">AJOUTER</button>}
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[9px] font-black text-on-surface-variant uppercase">
                          <th className="py-2">Description</th>
                          <th className="py-2 text-center w-12">Qté</th>
                          <th className="py-2 text-right w-24">P.U</th>
                          <th className="py-2 text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partLines.map(line => (
                          <tr key={line.id} className="border-b border-outline/5">
                            <td className="py-2"><input disabled={isDefinitive} value={line.description} onChange={(e) => updatePart(line.id, 'description', e.target.value)} className="w-full bg-transparent outline-none font-medium disabled:opacity-60" placeholder="Nom pièce..."/></td>
                            <td className="py-2"><input disabled={isDefinitive} type="number" value={line.quantite} onChange={(e) => updatePart(line.id, 'quantite', parseInt(e.target.value) || 0)} className="w-full bg-transparent outline-none text-center font-black disabled:opacity-60"/></td>
                            <td className="py-2"><input disabled={isDefinitive} type="number" value={line.prix_unitaire || ''} onChange={(e) => updatePart(line.id, 'prix_unitaire', parseInt(e.target.value) || 0)} className="w-full bg-transparent outline-none text-right font-black disabled:opacity-60" placeholder="0"/></td>
                            <td className="py-2 text-right font-black text-primary">{(line.quantite * line.prix_unitaire).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row justify-between items-end gap-6 border-t-2 border-outline/10">
                  <div className="flex gap-3 no-print">
                    {currentInvoiceId && isDefinitive && currentInvoice && currentInvoice.statut_paiement !== 'SOLDE' && (
                      <button 
                        onClick={() => openPaymentModal(currentInvoice)}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-green-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">payments</span>
                        Encaisser
                      </button>
                    )}
                    {currentInvoiceId && !isDefinitive && (
                      <button 
                        onClick={handleValidateDefinitive}
                        className="bg-primary text-on-primary px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Valider Définitive
                      </button>
                    )}
                    <button 
                      onClick={handleSaveInvoice}
                      disabled={isDefinitive}
                      className="bg-surface-container text-on-surface px-6 py-3 rounded-xl font-black text-xs uppercase border border-outline/10 hover:bg-outline/5 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">save</span>
                      {currentInvoiceId ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="bg-white text-on-surface px-6 py-3 rounded-xl font-black text-xs uppercase border border-outline/10 hover:bg-surface-container transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      Imprimer
                    </button>
                  </div>

                  <div className="w-full md:w-80 space-y-3 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface-variant uppercase">Total HT</span>
                      <span className="text-on-surface">{grandTotal.toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface-variant uppercase">Déjà payé</span>
                      <span className="text-green-600">{(currentInvoice?.montant_paye || 0).toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2 border-primary/20">
                      <span className="text-sm font-black text-primary uppercase tracking-widest">NET À PAYER</span>
                      <span className="text-2xl font-black text-primary">{(grandTotal - (currentInvoice?.montant_paye || 0)).toLocaleString()} F</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4">receipt_long</span>
                <p className="font-black uppercase tracking-[0.3em]">Établir un document financier</p>
                <p className="text-xs font-bold mt-2">Sélectionnez un ordre de réparation à gauche.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Paiement */}
      {isPaymentModalOpen && currentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black text-on-surface">Encaissement</h2>
                <p className="text-xs font-bold text-on-surface-variant mt-1">
                  Reste à payer : <span className="text-primary">{(currentInvoice.total_ttc - currentInvoice.montant_paye).toLocaleString()} F</span>
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Mode de Paiement</label>
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full bg-surface-container/50 border border-outline/20 rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-sm">
                    <option value="ESPECE">Espèce</option>
                    <option value="MOMOPAY">MomoPay</option>
                    <option value="VIREMENT">Virement Bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Montant versé (FCFA)</label>
                  <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full bg-surface-container/50 border border-outline/20 rounded-xl px-4 py-3 outline-none focus:border-primary font-black text-xl text-primary" placeholder="0" autoFocus />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold border border-outline/20 hover:bg-surface-container transition-all">Annuler</button>
                  <button onClick={handleRecordPayment} className="flex-1 px-6 py-3 rounded-xl font-black bg-green-600 text-white shadow-lg hover:bg-green-700 transition-all">Valider</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;

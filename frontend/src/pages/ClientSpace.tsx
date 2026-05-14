import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  UserPlus, 
  CheckCircle2, 
  Car, 
  Star, 
  LogOut, 
  Smartphone,
  History,
  Wrench,
  Clock,
  Info,
  ShieldCheck,
  User,
  ArrowRight,
  Layers,
  FileText,
  Download,
  Calendar,
  AlertCircle,
  Camera,
  MessageSquare,
  Phone,
  Settings,
  Bell
} from 'lucide-react';
import api from '../services/api';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}

interface Repair {
  id: number;
  vehicule_plate: string;
  categorie: string;
  description: string;
  statut: string;
  progression: number;
  date_creation: string;
  date_fin_estimee?: string;
}

interface Invoice {
  id: number;
  numero_facture: string;
  type: string;
  total_ttc: number;
  montant_paye: number;
  statut_paiement: string;
  date_creation: string;
  vehicule_plate: string;
}

interface Appointment {
  id: number;
  date_rdv: string;
  service_demande: string;
  statut: string;
  notes?: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  date_envoi: string;
  lu: boolean;
}

interface Maintenance {
  id: number;
  type_maintenance: string;
  date_prochaine_prevue: string;
  km_prochain_prevu: number;
}

const ClientSpace: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientData, setClientData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VEHICLES' | 'REPAIRS' | 'INVOICES' | 'APPOINTMENTS' | 'PROFILE'>('OVERVIEW');

  // État pour la photo de profil
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  // États pour l'avis
  const [showAvisForm, setShowAvisForm] = useState(false);
  const [avisData, setAvisData] = useState({
    note: 5,
    commentaire: '',
    reparation: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    nom: '',
    prenoms: '',
    contact: '',
    adresse: '',
    email: ''
  });

  // États pour l'inscription
  const [registerData, setRegisterData] = useState({
    nom: '',
    prenoms: '',
    contact: '',
    adresse: ''
  });

  // Vérifier si une session existe au chargement
  useEffect(() => {
    const savedPhone = localStorage.getItem('client_phone');
    if (savedPhone) {
      handleLogin(savedPhone);
    }
  }, []);

  useEffect(() => {
    if (clientData?.client) {
      setEditData({
        nom: clientData.client.nom || '',
        prenoms: clientData.client.prenoms || '',
        contact: clientData.client.contact || '',
        adresse: clientData.client.adresse || '',
        email: clientData.client.email || ''
      });
    }
  }, [clientData]);

  const handleLogin = async (overridePhone?: string) => {
    const targetPhone = overridePhone || phone;
    if (!targetPhone) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.get(`client-space/data/?phone=${targetPhone}`);
      setClientData(response.data);
      setIsLoggedIn(true);
      localStorage.setItem('client_phone', targetPhone);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAvisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const savedPhone = localStorage.getItem('client_phone');
      await api.post('client-space/submit_avis/', { ...avisData, phone: savedPhone });
      setShowAvisForm(false);
      setAvisData({ note: 5, commentaire: '', reparation: '' });
      handleLogin(savedPhone || ''); // Rafraîchir les données
      alert('Merci pour votre avis !');
    } catch (err) {
      alert('Erreur lors de l\'envoi de l\'avis.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('client-space/register/', registerData);
      // Connexion automatique après inscription
      handleLogin(registerData.contact);
    } catch (err: any) {
      setError('Erreur lors de la création du compte. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const savedPhone = localStorage.getItem('client_phone') || '';
      
      const formData = new FormData();
      formData.append('phone', savedPhone);
      formData.append('nom', editData.nom);
      formData.append('prenoms', editData.prenoms);
      formData.append('contact', editData.contact);
      formData.append('adresse', editData.adresse);
      formData.append('email', editData.email);
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const response = await api.patch('client-space/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setClientData((prev: any) => ({
        ...prev,
        client: response.data
      }));
      
      if (editData.contact && editData.contact !== savedPhone) {
        localStorage.setItem('client_phone', editData.contact);
      }
      setEditMode(false);
      setSelectedPhoto(null);
      alert('Vos informations ont été mises à jour.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de mettre à jour votre profil.');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: number) => {
    try {
      const savedPhone = localStorage.getItem('client_phone');
      const response = await api.get(`client-space/download-invoice/?phone=${savedPhone}&invoice_id=${invoiceId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Erreur lors du téléchargement de la facture.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('client_phone');
    setIsLoggedIn(false);
    setClientData(null);
    setPhone('');
    setView('LOGIN');
    setActiveTab('OVERVIEW');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f0f9f4] animate-in fade-in duration-1000">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-emerald-100/50 space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-1000">
          <div className="text-center space-y-4 relative z-10">
            <div className="w-20 h-20 bg-slate-900 text-emerald-400 rounded-[1.75rem] flex items-center justify-center mx-auto shadow-2xl rotate-3 transition-all duration-1000 hover:rotate-0 mb-8">
              {view === 'LOGIN' ? <Lock className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase transition-all duration-1000">
               {view === 'LOGIN' ? 'Espace Client' : 'Adhésion Luxe'}
            </h1>
            <p className="text-slate-400 font-medium text-sm leading-relaxed italic opacity-80">
               {view === 'LOGIN' 
                 ? 'Veuillez saisir votre numéro de téléphone pour accéder à votre garage numérique.' 
                 : 'Rejoignez le cercle privilégié Luxury Elegance Garage.'}
            </p>
          </div>

          {view === 'LOGIN' ? (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-8 relative z-10">
              <div className="space-y-3 group">
                <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2 transition-transform duration-500 group-focus-within:translate-x-2">Numéro de Téléphone</label>
                <div className="relative">
                  <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors duration-700 w-5 h-5" />
                  <input 
                    type="tel" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold text-lg shadow-inner transition-all duration-700"
                    placeholder="Ex: 0102030405"
                  />
                </div>
              </div>
              {error && (
                 <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in shake duration-700">
                    <Info className="w-4 h-4 text-rose-600" />
                    <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">{error}</p>
                 </div>
              )}
              <button 
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all duration-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-700" />}
                <span>{loading ? 'Authentification...' : 'Accéder à mon espace'}</span>
              </button>
              <div className="text-center pt-2">
                 <button type="button" onClick={() => setView('REGISTER')} className="text-[10px] font-black text-emerald-600 hover:text-slate-900 hover:underline uppercase tracking-widest transition-colors duration-700">Nouveau client ? Créer un compte</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6 relative z-10">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2 group-focus-within:translate-x-1 transition-transform duration-500">Nom</label>
                     <input required type="text" value={registerData.nom} onChange={e => setRegisterData({...registerData, nom: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner transition-all duration-700" />
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2 group-focus-within:translate-x-1 transition-transform duration-500">Prénoms</label>
                     <input required type="text" value={registerData.prenoms} onChange={e => setRegisterData({...registerData, prenoms: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner transition-all duration-700" />
                  </div>
               </div>
               <div className="space-y-2 group">
                  <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2 group-focus-within:translate-x-1 transition-transform duration-500">Téléphone</label>
                  <input required type="tel" value={registerData.contact} onChange={e => setRegisterData({...registerData, contact: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner transition-all duration-700" placeholder="Ex: 0192629860" />
               </div>
               <div className="space-y-2 group">
                  <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2 group-focus-within:translate-x-1 transition-transform duration-500">Adresse Résidence</label>
                  <input required type="text" value={registerData.adresse} onChange={e => setRegisterData({...registerData, adresse: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner transition-all duration-700" />
               </div>
               {error && <p className="text-rose-600 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}
               <button 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all duration-700 mt-4 active:scale-95 flex items-center justify-center gap-4"
              >
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                <span>{loading ? 'Création...' : 'Valider mon inscription'}</span>
              </button>
              <div className="text-center pt-2">
                 <button type="button" onClick={() => setView('LOGIN')} className="text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors duration-700 uppercase tracking-widest">Retour à la connexion</button>
              </div>
            </form>
          )}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const soldeImpaye = Number(clientData.solde_impaye);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-1000 selection:bg-emerald-200 relative">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-emerald-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl rotate-3 overflow-hidden border-4 border-white transition-all duration-700 group-hover:rotate-0 group-hover:scale-105">
              {clientData.client.photo ? (
                <img src={`http://localhost:8000${clientData.client.photo}`} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                clientData.client.nom[0]
              )}
            </div>
            <button onClick={() => setActiveTab('PROFILE')} className="absolute -right-2 -bottom-2 p-2 bg-slate-900 text-white rounded-full shadow-xl hover:bg-emerald-600 transition-colors duration-500">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic transition-all duration-700 hover:text-emerald-600">
              Bonjour, {clientData.client.prenoms}
            </h1>
            <div className="flex flex-wrap gap-4">
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 transition-all duration-700 hover:bg-emerald-50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Membre Certifié
              </p>
              {soldeImpaye > 0 && (
                <p className="text-rose-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> Solde Impayé : {soldeImpaye.toLocaleString()} F
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleLogout} className="p-4 bg-white border border-rose-100 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-900/5 hover:bg-rose-600 hover:text-white transition-all duration-700 group active:scale-90">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white p-2 rounded-[2rem] border border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-x-auto no-scrollbar gap-2 transition-all duration-1000 hover:shadow-emerald-500/10">
        {[
          { id: 'OVERVIEW', label: 'Vue d\'ensemble', icon: Layers },
          { id: 'VEHICLES', label: 'Mes Véhicules', icon: Car },
          { id: 'REPAIRS', label: 'Mes Réparations', icon: Wrench },
          { id: 'INVOICES', label: 'Mes Factures', icon: FileText },
          { id: 'APPOINTMENTS', label: 'Mes Rendez-vous', icon: Calendar },
          { id: 'PROFILE', label: 'Mon Profil', icon: User }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-700 whitespace-nowrap active:scale-95 ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {/* Active Repairs Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="h-1 w-6 bg-emerald-500 rounded-full transition-all duration-700 group-hover:w-12"></div>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] transition-colors duration-700 group-hover:text-emerald-600">Interventions en cours</h2>
                </div>
                <div className="grid gap-6">
                  {clientData.reparations.filter((r: Repair) => r.statut !== 'TERMINE' && r.statut !== 'ANNULE').length > 0 ? (
                    clientData.reparations.filter((r: Repair) => r.statut !== 'TERMINE' && r.statut !== 'ANNULE').map((r: Repair) => (
                      <div key={r.id} className="card-luxury p-8 bg-white group overflow-hidden relative border-l-8 border-l-emerald-600 transition-all duration-1000 hover:shadow-emerald-500/10">
                        <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="space-y-2">
                            <span className="font-mono text-[10px] font-black text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full transition-all duration-700 group-hover:bg-emerald-600 group-hover:text-white">OR-{r.id.toString().padStart(4, '0')}</span>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter transition-all duration-700 group-hover:text-emerald-700">{r.vehicule_plate}</h3>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-700 ${r.statut === 'EN_COURS' ? 'bg-blue-600 text-white shadow-blue-200 group-hover:scale-110' : 'bg-orange-500 text-white shadow-orange-200 group-hover:scale-110'}`}>
                            <Clock className="w-3 h-3 animate-spin-slow" /> {r.statut.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="space-y-4 relative z-10">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Progression technique</span>
                            <span className="text-emerald-600 group-hover:scale-110 transition-transform">{r.progression}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full transition-all duration-[2s] ease-out" style={{ width: `${r.progression}%` }}></div>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16 transition-all duration-1000 group-hover:scale-150"></div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 bg-slate-50 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200 text-slate-400 transition-all duration-1000 hover:border-emerald-300 hover:bg-emerald-50/30">
                      <p className="text-[10px] font-black uppercase tracking-widest italic">Aucun véhicule actuellement à l'atelier.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Maintenance Alerts */}
              <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all duration-1000 hover:shadow-emerald-900/20 group">
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 transition-transform duration-1000 group-hover:rotate-12 group-hover:scale-125" />
                    <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Entretien Préventif</h2>
                  </div>
                  {clientData.alertes.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {clientData.alertes.map((a: Maintenance) => (
                        <div key={a.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4 hover:bg-white/10 transition-all duration-700 hover:-translate-y-2 hover:border-emerald-500/30">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{a.type_maintenance}</p>
                          <p className="text-2xl font-black italic tracking-tighter">{new Date(a.date_prochaine_prevue).toLocaleDateString()}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase italic">Seuil : {a.km_prochain_prevu.toLocaleString()} KM</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Aucune alerte de maintenance immédiate. Bonne route !</p>
                  )}
                </div>
                <Wrench className="absolute -right-10 -bottom-10 w-40 h-40 text-white/5 rotate-12 transition-transform duration-[4s] group-hover:rotate-45" />
              </section>
            </div>
          )}

          {activeTab === 'VEHICLES' && (
            <div className="grid md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-1000">
              {clientData.vehicules.map((v: Vehicle) => (
                <div key={v.id} className="card-luxury p-8 flex items-center gap-6 group hover:border-emerald-500 transition-all duration-1000">
                  <div className="w-20 h-20 bg-slate-900 text-emerald-400 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 group-hover:bg-emerald-600 group-hover:text-white">
                    <Car className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-black text-emerald-600 tracking-tighter uppercase transition-colors duration-700 group-hover:text-slate-900">{v.immatriculation}</p>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity duration-700">{v.marque} {v.modele}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'REPAIRS' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-1000">
              {clientData.reparations.map((r: Repair) => (
                <div key={r.id} className="card-luxury p-8 bg-white flex flex-col md:flex-row gap-8 items-start md:items-center group transition-all duration-1000 hover:shadow-emerald-500/10">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-all duration-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-12">
                    <History className="w-8 h-8" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.date_creation).toLocaleDateString()}</p>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all duration-700 ${r.statut === 'TERMINE' ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white'}`}>{r.statut.replace('_', ' ')}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors duration-700">{r.vehicule_plate} - {r.categorie}</h4>
                    <p className="text-sm text-slate-500 font-medium italic">"{r.description}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'INVOICES' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-1000">
              {clientData.factures.map((inv: Invoice) => (
                <div key={inv.id} className="card-luxury p-8 bg-white flex flex-col md:flex-row justify-between items-center gap-6 group transition-all duration-1000 hover:shadow-emerald-500/10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-all duration-700 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-sm font-black text-emerald-600 transition-colors duration-700 group-hover:text-slate-900">{inv.numero_facture || 'Proforma'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(inv.date_creation).toLocaleDateString()} • {inv.vehicule_plate}</p>
                      <p className="text-lg font-black italic tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors duration-700">{Number(inv.total_ttc).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-4 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all duration-700 ${inv.statut_paiement === 'SOLDE' ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                      {inv.statut_paiement.replace('_', ' ')}
                    </span>
                    <button onClick={() => downloadInvoice(inv.id)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all duration-700 active:scale-95">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'APPOINTMENTS' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-1000">
              {clientData.rdvs.length > 0 ? clientData.rdvs.map((rdv: Appointment) => (
                <div key={rdv.id} className="card-luxury p-8 bg-white border-l-8 border-l-emerald-600 group transition-all duration-1000 hover:shadow-emerald-500/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-emerald-600 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" />
                      <p className="text-xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-emerald-600 transition-colors duration-700">{new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-700 ${rdv.statut === 'CONFIRME' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white group-hover:bg-amber-600'}`}>
                      {rdv.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2 transition-all duration-700 group-hover:bg-emerald-50/50">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Service demandé</p>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors duration-700">{rdv.service_demande}</p>
                    {rdv.notes && <p className="text-xs text-slate-400 italic">"{rdv.notes}"</p>}
                  </div>
                </div>
              )) : (
                <div className="p-12 bg-slate-50 rounded-[2.5rem] text-center text-slate-400 transition-all duration-1000 hover:bg-emerald-50/30">
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Vous n'avez aucun rendez-vous programmé.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PROFILE' && (
            <section className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-1000 transition-all duration-1000 hover:shadow-emerald-500/5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Mon profil</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Informations personnelles</h2>
                 </div>
                 <button onClick={() => setEditMode((prev) => !prev)} className="px-6 py-3 bg-emerald-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] transition-all duration-700 hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-200">
                   {editMode ? 'Annuler' : 'Modifier mon profil'}
                 </button>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                 <div className="flex flex-col items-center gap-6 pb-8 border-b border-slate-100">
                    <div className="relative group">
                       <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-all duration-1000 group-hover:rotate-3 group-hover:scale-105">
                          {selectedPhoto ? (
                             <img src={URL.createObjectURL(selectedPhoto)} alt="New" className="w-full h-full object-cover" />
                          ) : clientData.client.photo ? (
                             <img src={`http://localhost:8000${clientData.client.photo}`} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                             <User className="w-12 h-12 text-emerald-300 transition-transform duration-700 group-hover:scale-125" />
                          )}
                       </div>
                       {editMode && (
                          <label className="absolute inset-0 bg-slate-900/60 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-sm">
                             <Camera className="w-8 h-8 text-white mb-2" />
                             <span className="text-[8px] font-black uppercase text-white tracking-widest">Changer</span>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedPhoto(e.target.files ? e.target.files[0] : null)} />
                          </label>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 group">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 group-focus-within:text-emerald-600 transition-colors duration-700">Nom</label>
                       <input readOnly={!editMode} value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} className={`w-full px-6 py-4 rounded-2xl font-bold text-sm outline-none transition-all duration-700 ${editMode ? 'bg-slate-50 border-2 border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border-2 border-transparent'}`} />
                    </div>
                    <div className="space-y-3 group">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 group-focus-within:text-emerald-600 transition-colors duration-700">Prénoms</label>
                       <input readOnly={!editMode} value={editData.prenoms} onChange={e => setEditData({...editData, prenoms: e.target.value})} className={`w-full px-6 py-4 rounded-2xl font-bold text-sm outline-none transition-all duration-700 ${editMode ? 'bg-slate-50 border-2 border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border-2 border-transparent'}`} />
                    </div>
                    <div className="space-y-3 group">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 group-focus-within:text-emerald-600 transition-colors duration-700">Téléphone</label>
                       <input readOnly={!editMode} value={editData.contact} onChange={e => setEditData({...editData, contact: e.target.value})} className={`w-full px-6 py-4 rounded-2xl font-bold text-sm outline-none transition-all duration-700 ${editMode ? 'bg-slate-50 border-2 border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border-2 border-transparent'}`} />
                    </div>
                    <div className="space-y-3 group">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 group-focus-within:text-emerald-600 transition-colors duration-700">Email</label>
                       <input readOnly={!editMode} type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className={`w-full px-6 py-4 rounded-2xl font-bold text-sm outline-none transition-all duration-700 ${editMode ? 'bg-slate-50 border-2 border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border-2 border-transparent'}`} />
                    </div>
                    <div className="space-y-3 md:col-span-2 group">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 group-focus-within:text-emerald-600 transition-colors duration-700">Adresse</label>
                       <input readOnly={!editMode} value={editData.adresse} onChange={e => setEditData({...editData, adresse: e.target.value})} className={`w-full px-6 py-4 rounded-2xl font-bold text-sm outline-none transition-all duration-700 ${editMode ? 'bg-slate-50 border-2 border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border-2 border-transparent'}`} />
                    </div>
                 </div>

                 {editMode && (
                    <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-emerald-600 transition-all duration-700 shadow-2xl shadow-slate-200 active:scale-95">
                       {loading ? 'Traitement en cours...' : 'Enregistrer mon nouveau profil'}
                    </button>
                 )}
              </form>
           </section>
          )}

        </div>

        {/* Right Sidebar: Notifications & Feedback */}
        <div className="col-span-12 lg:col-span-4 space-y-10 animate-in slide-in-from-right-8 duration-1000">
           <section className="space-y-6">
              <div className="flex items-center gap-3 group cursor-default">
                 <div className="h-1 w-6 bg-emerald-500 rounded-full transition-all duration-700 group-hover:w-12"></div>
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] transition-colors duration-700 group-hover:text-emerald-600">Notifications</h2>
              </div>
              <div className="space-y-4">
                 {clientData.notifications.map((n: Notification) => (
                   <div key={n.id} className="p-6 bg-white rounded-3xl border border-emerald-50 shadow-sm hover:shadow-xl transition-all duration-1000 space-y-2 group overflow-hidden relative">
                      <div className="flex justify-between items-center mb-1 relative z-10">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full transition-all duration-700 group-hover:bg-emerald-600 group-hover:text-white">{n.type.replace('_', ' ')}</span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">{new Date(n.date_envoi).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic uppercase tracking-tight relative z-10 transition-colors duration-700 group-hover:text-slate-900">"{n.message}"</p>
                      <Bell className="absolute -right-4 -bottom-4 w-12 h-12 text-emerald-500/5 transition-all duration-1000 group-hover:scale-150 group-hover:rotate-12 group-hover:text-emerald-500/10" />
                   </div>
                 ))}
              </div>
           </section>

           <section className="space-y-6">
              <div className="flex justify-between items-center px-2 group">
                 <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-emerald-500 rounded-full transition-all duration-700 group-hover:w-12"></div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] transition-colors duration-700 group-hover:text-emerald-600">Signature Client</h2>
                 </div>
                 <button onClick={() => setShowAvisForm(!showAvisForm)} className="flex items-center gap-2 text-[8px] font-black text-emerald-600 hover:text-slate-900 transition-all duration-700 uppercase tracking-widest group">
                    <Star className="w-3 h-3 group-hover:fill-emerald-600 transition-all duration-700" /> Témoigner
                 </button>
              </div>

              {showAvisForm && (
                <form onSubmit={handleAvisSubmit} className="p-8 bg-emerald-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-200 space-y-6 animate-in slide-in-from-top-6 duration-1000">
                   <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setAvisData({...avisData, note: star})} className={`transition-all duration-700 hover:scale-125 ${star <= avisData.note ? 'text-orange-400' : 'text-white/20'}`}>
                           <Star className={`w-8 h-8 ${star <= avisData.note ? 'fill-orange-400' : ''}`} />
                        </button>
                      ))}
                   </div>
                   <textarea required value={avisData.commentaire} onChange={e => setAvisData({...avisData, commentaire: e.target.value})} className="w-full p-6 rounded-2xl bg-white text-slate-900 outline-none font-medium text-xs shadow-inner transition-all duration-700 focus:ring-2 focus:ring-slate-900/10" placeholder="Votre expérience..." rows={3}></textarea>
                   <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all duration-700 shadow-xl active:scale-95">Publier mon avis</button>
                </form>
              )}

              <div className="space-y-4">
                 {clientData.avis.map((a: any) => (
                   <div key={a.id} className="p-6 bg-white rounded-3xl border border-emerald-50 shadow-sm space-y-3 group hover:shadow-lg transition-all duration-1000 hover:-translate-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex text-orange-400 transition-all duration-700 group-hover:scale-110">
                           {Array.from({length: a.note}).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-orange-400" />)}
                        </div>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(a.date_creation).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-900 leading-relaxed italic uppercase tracking-tight opacity-70 group-hover:opacity-100 transition-all duration-700">"{a.commentaire}"</p>
                   </div>
                 ))}
              </div>
           </section>

           <section className="bg-emerald-50 rounded-[2rem] p-8 space-y-6 border border-emerald-100 transition-all duration-1000 hover:bg-emerald-100/50 group">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                    <MessageSquare className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase text-slate-900">Besoin d'aide ?</h3>
                    <p className="text-[10px] font-bold text-slate-500 italic">Support VIP disponible</p>
                 </div>
              </div>
              <a href="https://wa.me/2290192629860" target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all duration-700 shadow-lg shadow-emerald-200 active:scale-95">
                 <WhatsAppIcon className="w-4 h-4" /> Discuter sur WhatsApp
              </a>
           </section>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-6 z-40 no-print">
         <a href="https://wa.me/2290192629860" target="_blank" className="w-16 h-16 bg-[#25D366] text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 hover:rotate-6 transition-all duration-700 group relative">
            <WhatsAppIcon className="w-8 h-8" />
            <span className="absolute right-full mr-6 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0 tracking-widest">Support WhatsApp</span>
         </a>
         <a href="tel:+2290192629860" className="w-16 h-16 bg-white text-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 hover:-rotate-6 transition-all duration-700 group relative border border-emerald-50">
            <Phone className="w-8 h-8 text-emerald-600" />
            <span className="absolute right-full mr-6 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0 tracking-widest">Conciergerie</span>
         </a>
      </div>
    </div>
  );
};

export default ClientSpace;

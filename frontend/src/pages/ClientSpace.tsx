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
  Bell,
  Info
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
  const [otp, setOtp] = useState('');
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [otpStep, setOtpStep] = useState<'PHONE' | 'OTP'>('PHONE');
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

  // États pour les rendez-vous
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    vehicule: '',
    service_demande: '',
    date_rdv: '',
    notes: ''
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
    adresse: '',
    email: ''
  });

  // Vérifier si une session existe au chargement
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchClientData();
    }
  }, []);

  // Polling des notifications toutes les 30 secondes
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(async () => {
      try {
        const response = await api.get('client-space/data/');
        // Mise à jour silencieuse des notifications seulement
        setClientData((prev: any) => prev ? {
          ...prev,
          notifications: response.data.notifications,
          reparations: response.data.reparations,
        } : prev);
      } catch {
        // Ignore les erreurs de polling silencieuses
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

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

  const fetchClientData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('client-space/data/');
      setClientData(response.data);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError('Session expirée. Veuillez vous reconnecter.');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post('client-space/request_otp/', { phone });
      setOtpStep('OTP');
      alert(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post('client-space/verify_otp/', { phone, code: otp });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      fetchClientData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setClientData(null);
    setOtpStep('PHONE');
    setOtp('');
  };

  const handleAvisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...avisData,
        reparation: avisData.reparation === '' ? null : avisData.reparation
      };
      await api.post('client-space/submit_avis/', payload);
      setShowAvisForm(false);
      setAvisData({ note: 5, commentaire: '', reparation: '' });
      fetchClientData(); // Rafraîchir les données
      alert('Merci pour votre avis !');
    } catch (err) {
      alert('Erreur lors de l\'envoi de l\'avis.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('client-space/book-appointment/', appointmentData);
      setShowAppointmentForm(false);
      setAppointmentData({ vehicule: '', service_demande: '', date_rdv: '', notes: '' });
      fetchClientData();
      alert('Votre rendez-vous a été enregistré avec succès.');
    } catch (err: any) {
      alert('Erreur lors de la prise de rendez-vous.');
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
      setPhone(registerData.contact);
      setView('LOGIN');
      setOtpStep('PHONE');
      alert('Compte créé avec succès. Veuillez vous connecter.');
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
      const formData = new FormData();
      formData.append('nom', editData.nom);
      formData.append('prenoms', editData.prenoms);
      formData.append('contact', editData.contact);
      formData.append('adresse', editData.adresse);
      formData.append('email', editData.email);
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const response = await api.post('client-space/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setClientData((prev: any) => ({
        ...prev,
        client: response.data
      }));
      
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
      const response = await api.get(`client-space/download-invoice/?invoice_id=${invoiceId}`, { responseType: 'blob' });
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-oswald animate-in fade-in duration-700">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl border border-emerald-100/50 space-y-8 relative overflow-hidden">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-md flex items-center justify-center mx-auto shadow-lg mb-6 transition-all duration-500 hover:bg-emerald-600 hover:text-white">
              {view === 'LOGIN' ? <Lock className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
            </div>
            <h1 className="text-4xl font-bebas text-slate-900 tracking-wider uppercase leading-none">
               {view === 'LOGIN' ? 'Espace Client' : 'Inscription'}
            </h1>
            <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">
               {view === 'LOGIN' 
                 ? 'Accédez à votre garage numérique' 
                 : 'Rejoignez Luxury Elegance Garage'}
            </p>
          </div>

          {view === 'LOGIN' ? (
            otpStep === 'PHONE' ? (
              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Numéro de Téléphone</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input 
                      type="tel" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none font-bold text-sm transition-all"
                      placeholder="Ex: 0102030405"
                    />
                  </div>
                </div>
                {error && (
                   <div className="p-3 bg-rose-50 border border-rose-100 rounded-md flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-rose-600" />
                      <p className="text-rose-600 text-[10px] font-bold uppercase tracking-widest">{error}</p>
                   </div>
                )}
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-md font-bebas tracking-widest text-lg hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Clock className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  <span>{loading ? 'Recherche...' : 'Continuer'}</span>
                </button>
                <div className="text-center">
                   <button type="button" onClick={() => setView('REGISTER')} className="text-[10px] font-bold text-emerald-600 hover:text-slate-900 uppercase tracking-widest">Nouveau client ? Créer un compte</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Code de vérification (6 chiffres)</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input 
                      type="text" 
                      maxLength={6}
                      required 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none font-bold text-xl tracking-[0.5em] text-center transition-all"
                      placeholder="000000"
                    />
                  </div>
                </div>
                {error && (
                   <div className="p-3 bg-rose-50 border border-rose-100 rounded-md flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-rose-600" />
                      <p className="text-rose-600 text-[10px] font-bold uppercase tracking-widest">{error}</p>
                   </div>
                )}
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-md font-bebas tracking-widest text-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Clock className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  <span>{loading ? 'Vérification...' : 'Se connecter'}</span>
                </button>
                <div className="text-center">
                   <button type="button" onClick={() => setOtpStep('PHONE')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest">Modifier le numéro</button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Nom</label>
                     <input required type="text" value={registerData.nom} onChange={e => setRegisterData({...registerData, nom: e.target.value})} className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Prénoms</label>
                     <input required type="text" value={registerData.prenoms} onChange={e => setRegisterData({...registerData, prenoms: e.target.value})} className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Téléphone</label>
                     <input required type="tel" value={registerData.contact} onChange={e => setRegisterData({...registerData, contact: e.target.value})} className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm" placeholder="0192629860" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Email</label>
                     <input required type="email" value={registerData.email} onChange={e => setRegisterData({...registerData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm" placeholder="votre@email.com" />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Adresse</label>
                  <input required type="text" value={registerData.adresse} onChange={e => setRegisterData({...registerData, adresse: e.target.value})} className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm" />
               </div>
               {error && <p className="text-rose-600 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}
               <button 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-md font-bebas tracking-widest text-lg hover:bg-emerald-600 transition-all mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                <span>{loading ? 'Création...' : 'Valider'}</span>
              </button>
              <div className="text-center">
                 <button type="button" onClick={() => setView('LOGIN')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest">Retour à la connexion</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const soldeImpaye = clientData?.solde_impaye ? Number(clientData.solde_impaye) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 font-oswald animate-in fade-in duration-700 pb-24 md:pb-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center w-full gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-bebas shadow-xl overflow-hidden border-2 border-white transition-all duration-500">
              {clientData.client.photo ? (
                <img src={`http://localhost:8000${clientData.client.photo}`} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                clientData.client.nom[0]
              )}
            </div>
            <button onClick={() => setActiveTab('PROFILE')} className="absolute -right-1 -bottom-1 p-1.5 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-emerald-600 transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-bebas text-slate-900 tracking-wider uppercase">
              Bonjour, {clientData.client.prenoms}
            </h1>
            <div className="flex flex-wrap gap-2">
              <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" /> Membre Certifié
              </p>
              {soldeImpaye > 0 && (
                <p className="text-rose-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                  <AlertCircle className="w-3 h-3" /> Solde : {soldeImpaye.toLocaleString()} F
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleLogout} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 group shadow-sm">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation — scroll horizontal sur mobile, grid sur desktop */}
      <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'OVERVIEW', label: "Vue d'ensemble", icon: Layers },
          { id: 'VEHICLES', label: 'Véhicules', icon: Car },
          { id: 'REPAIRS', label: 'Réparations', icon: Wrench },
          { id: 'INVOICES', label: 'Factures', icon: FileText },
          { id: 'APPOINTMENTS', label: 'Rendez-vous', icon: Calendar },
          { id: 'PROFILE', label: 'Profil', icon: User }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg text-[9px] sm:text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap min-w-[60px] sm:min-w-0 ${
              activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <tab.icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Active Repairs Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-xl font-bebas text-slate-900 tracking-wider uppercase">Interventions en cours</h2>
                </div>
                <div className="grid gap-4">
                  {clientData.reparations.filter((r: Repair) => r.statut !== 'TERMINE' && r.statut !== 'ANNULE').length > 0 ? (
                    clientData.reparations.filter((r: Repair) => r.statut !== 'TERMINE' && r.statut !== 'ANNULE').map((r: Repair) => (
                      <div key={r.id} className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-emerald-500 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="space-y-1">
                            <span className="font-bebas text-sm text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded">OR-{r.id.toString().padStart(4, '0')}</span>
                            <h3 className="text-2xl font-bebas text-slate-900 tracking-wider uppercase">{r.vehicule_plate}</h3>
                          </div>
                          <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${r.statut === 'EN_COURS' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                            <Clock className="w-3 h-3 animate-spin-slow" /> {r.statut.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="space-y-2 relative z-10">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-slate-400">Progression</span>
                            <span className="text-emerald-600">{r.progression}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full transition-all duration-1000" style={{ width: `${r.progression}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 bg-slate-50 rounded-lg text-center border border-dashed border-slate-300 text-slate-400">
                      <p className="text-xs font-bold uppercase tracking-widest">Aucun véhicule à l'atelier.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Maintenance Alerts */}
              <section className="bg-slate-900 text-white p-8 rounded-lg shadow-xl relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-bebas text-emerald-400 tracking-wider uppercase">Entretien Préventif</h2>
                  </div>
                  {clientData.alertes.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {clientData.alertes.map((a: Maintenance) => (
                        <div key={a.id} className="p-4 bg-white/5 rounded-md border border-white/10 space-y-2 hover:bg-white/10 transition-all">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{a.type_maintenance}</p>
                          <p className="text-2xl font-bebas tracking-wider uppercase">{new Date(a.date_prochaine_prevue).toLocaleDateString()}</p>
                          <p className="text-[10px] font-medium text-slate-500 uppercase">Seuil : {a.km_prochain_prevu.toLocaleString()} KM</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Tout est à jour. Bonne route !</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'VEHICLES' && (
            <div className="grid md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-700">
              {clientData.vehicules.map((v: Vehicle) => (
                <div key={v.id} className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-5 group hover:border-emerald-500 transition-all">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-md flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bebas text-2xl text-emerald-600 tracking-wider uppercase">{v.immatriculation}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{v.marque} {v.modele}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'REPAIRS' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
              {clientData.reparations.map((r: Repair) => (
                <div key={r.id} className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center group hover:border-emerald-500 transition-all">
                  <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <History className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.date_creation).toLocaleDateString()}</p>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${r.statut === 'TERMINE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{r.statut.replace('_', ' ')}</span>
                    </div>
                    <h4 className="text-xl font-bebas text-slate-900 tracking-wider uppercase">{r.vehicule_plate} — {r.categorie}</h4>
                    <p className="text-xs text-slate-500 font-medium italic opacity-70">"{r.description}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'INVOICES' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
              {clientData.factures.map((inv: Invoice) => (
                <div key={inv.id} className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-emerald-500 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-emerald-600">{inv.numero_facture || 'PROFORMA'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(inv.date_creation).toLocaleDateString()} • {inv.vehicule_plate}</p>
                      <p className="text-lg font-bebas tracking-wider uppercase text-slate-900">{Number(inv.total_ttc).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${inv.statut_paiement === 'SOLDE' ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-600'}`}>
                      {inv.statut_paiement.replace('_', ' ')}
                    </span>
                    <button onClick={() => downloadInvoice(inv.id)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-md text-[10px] font-bebas tracking-widest uppercase hover:bg-emerald-600 transition-all active:scale-95">
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'APPOINTMENTS' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bebas text-slate-900 tracking-wider uppercase">Mes rendez-vous</h2>
                 <button 
                  onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-md text-xs font-bebas tracking-widest uppercase hover:bg-emerald-600 transition-all"
                 >
                   {showAppointmentForm ? 'Annuler' : '+ Prendre RDV'}
                 </button>
              </div>

              {showAppointmentForm && (
                <form onSubmit={handleBookAppointment} className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-4 animate-in zoom-in-95 duration-500">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Véhicule</label>
                      <select 
                        required
                        value={appointmentData.vehicule}
                        onChange={e => setAppointmentData({...appointmentData, vehicule: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-md bg-white border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm transition-all"
                      >
                        <option value="">Sélectionner...</option>
                        {clientData.vehicules.map((v: Vehicle) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Date & Heure</label>
                      <input 
                        required
                        type="datetime-local"
                        value={appointmentData.date_rdv}
                        onChange={e => setAppointmentData({...appointmentData, date_rdv: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-md bg-white border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Service demandé</label>
                    <input 
                      required
                      type="text"
                      placeholder="Ex: Vidange, Check-up, Climatisation..."
                      value={appointmentData.service_demande}
                      onChange={e => setAppointmentData({...appointmentData, service_demande: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-md bg-white border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest ml-1">Notes (Optionnel)</label>
                    <textarea 
                      value={appointmentData.notes}
                      onChange={e => setAppointmentData({...appointmentData, notes: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-md bg-white border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm"
                      rows={2}
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-md font-bebas tracking-widest text-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Enregistrement...' : 'Confirmer le rendez-vous'}
                  </button>
                </form>
              )}

              {clientData.rdvs.length > 0 ? clientData.rdvs.map((rdv: Appointment) => (
                <div key={rdv.id} className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-emerald-600 group hover:border-emerald-500 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <p className="text-xl font-bebas text-slate-900 tracking-wider uppercase">{new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${rdv.statut === 'CONFIRME' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                      {rdv.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md space-y-1">
                    <p className="text-[9px] font-bold uppercase text-emerald-600 tracking-widest">Service demandé</p>
                    <p className="text-sm font-bold text-slate-700">{rdv.service_demande}</p>
                    {rdv.notes && <p className="text-xs text-slate-400 italic font-medium opacity-70">"{rdv.notes}"</p>}
                  </div>
                </div>
              )) : (
                <div className="p-10 bg-slate-50 rounded-lg text-center text-slate-400 border border-dashed border-slate-300">
                  <p className="text-xs font-bold uppercase tracking-widest">Aucun rendez-vous programmé.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PROFILE' && (
            <section className="bg-white rounded-lg p-8 shadow-lg border border-slate-200 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paramètres</p>
                    <h2 className="text-2xl font-bebas text-slate-900 tracking-wider uppercase">Informations personnelles</h2>
                 </div>
                 <button onClick={() => setEditMode((prev) => !prev)} className="px-5 py-2.5 bg-slate-900 text-white rounded-md font-bebas tracking-widest uppercase text-sm hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-slate-200">
                   {editMode ? 'Annuler' : 'Modifier le profil'}
                 </button>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                 <div className="flex justify-center pb-6 border-b border-slate-100">
                    <div className="relative group">
                       <div className="w-24 h-24 rounded-lg bg-emerald-50 border-2 border-white shadow-md flex items-center justify-center overflow-hidden transition-all duration-500">
                          {selectedPhoto ? (
                             <img src={URL.createObjectURL(selectedPhoto)} alt="New" className="w-full h-full object-cover" />
                          ) : clientData.client.photo ? (
                             <img src={`http://localhost:8000${clientData.client.photo}`} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                             <User className="w-10 h-10 text-emerald-200" />
                          )}
                       </div>
                       {editMode && (
                          <label className="absolute inset-0 bg-slate-900/40 rounded-lg flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                             <Camera className="w-6 h-6 text-white mb-1" />
                             <span className="text-[8px] font-bold uppercase text-white tracking-widest">Changer</span>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedPhoto(e.target.files ? e.target.files[0] : null)} />
                          </label>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nom</label>
                       <input readOnly={!editMode} value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} className={`w-full px-4 py-2.5 rounded-md font-bold text-sm outline-none transition-all ${editMode ? 'bg-slate-50 border border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border border-transparent'}`} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Prénoms</label>
                       <input readOnly={!editMode} value={editData.prenoms} onChange={e => setEditData({...editData, prenoms: e.target.value})} className={`w-full px-4 py-2.5 rounded-md font-bold text-sm outline-none transition-all ${editMode ? 'bg-slate-50 border border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border border-transparent'}`} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Téléphone</label>
                       <input readOnly={!editMode} value={editData.contact} onChange={e => setEditData({...editData, contact: e.target.value})} className={`w-full px-4 py-2.5 rounded-md font-bold text-sm outline-none transition-all ${editMode ? 'bg-slate-50 border border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border border-transparent'}`} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email</label>
                       <input readOnly={!editMode} type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className={`w-full px-4 py-2.5 rounded-md font-bold text-sm outline-none transition-all ${editMode ? 'bg-slate-50 border border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border border-transparent'}`} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Adresse</label>
                       <input readOnly={!editMode} value={editData.adresse} onChange={e => setEditData({...editData, adresse: e.target.value})} className={`w-full px-4 py-2.5 rounded-md font-bold text-sm outline-none transition-all ${editMode ? 'bg-slate-50 border border-emerald-100 focus:border-emerald-500 shadow-inner' : 'bg-transparent border border-transparent'}`} />
                    </div>
                 </div>

                 {editMode && (
                    <button disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-md font-bebas tracking-widest text-lg hover:bg-emerald-600 transition-all active:scale-95 shadow-xl">
                       {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
                    </button>
                 )}
              </form>
           </section>
          )}

        </div>

        {/* Right Sidebar: Notifications & Feedback */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8 animate-in slide-in-from-right-4 duration-700">
           <section className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="h-1 w-4 bg-emerald-500 rounded-full"></div>
                 <h2 className="text-xl font-bebas text-slate-900 tracking-wider uppercase">Notifications</h2>
                 {clientData.notifications.filter((n: Notification) => !n.lu).length > 0 && (
                   <span className="ml-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                     {clientData.notifications.filter((n: Notification) => !n.lu).length}
                   </span>
                 )}
              </div>
              <div className="space-y-3">
                 {clientData.notifications.length === 0 ? (
                   <div className="p-5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aucune notification</p>
                   </div>
                 ) : clientData.notifications.map((n: Notification) => (
                   <div
                     key={n.id}
                     onClick={async () => {
                       if (!n.lu) {
                         try {
                           await api.patch(`notifications-clients/${n.id}/`, { lu: true });
                           setClientData((prev: any) => ({
                             ...prev,
                             notifications: prev.notifications.map((notif: Notification) =>
                               notif.id === n.id ? { ...notif, lu: true } : notif
                             )
                           }));
                         } catch { /* silencieux */ }
                       }
                     }}
                     className={`p-5 rounded-lg border shadow-sm transition-all relative overflow-hidden group cursor-pointer ${
                       n.lu
                         ? 'bg-white border-slate-200 hover:border-emerald-200'
                         : 'bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                     }`}
                   >
                     <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-2">
                         <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-emerald-100">
                           {n.type.replace(/_/g, ' ')}
                         </span>
                         {!n.lu && (
                           <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0"></span>
                         )}
                       </div>
                       <span className="text-[9px] font-medium text-slate-300 uppercase italic">
                         {new Date(n.date_envoi).toLocaleDateString()}
                       </span>
                     </div>
                     <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight relative z-10 transition-colors group-hover:text-slate-900">"{n.message}"</p>
                     <Bell className="absolute -right-2 -bottom-2 w-10 h-10 text-slate-50 group-hover:text-emerald-50 group-hover:scale-125 transition-all" />
                   </div>
                 ))}
              </div>
           </section>


           <section className="space-y-4">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="h-1 w-4 bg-emerald-500 rounded-full"></div>
                    <h2 className="text-xl font-bebas text-slate-900 tracking-wider uppercase">Votre avis</h2>
                 </div>
                 <button onClick={() => setShowAvisForm(!showAvisForm)} className="text-[10px] font-bold text-emerald-600 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                    <Star className="w-3 h-3" /> Témoigner
                 </button>
              </div>

              {showAvisForm && (
                <form onSubmit={handleAvisSubmit} className="p-6 bg-emerald-600 text-white rounded-lg shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-700">
                   <div className="flex gap-1.5 justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setAvisData({...avisData, note: star})} className={`transition-all hover:scale-125 ${star <= avisData.note ? 'text-orange-400' : 'text-white/20'}`}>
                           <Star className={`w-6 h-6 ${star <= avisData.note ? 'fill-orange-400' : ''}`} />
                        </button>
                      ))}
                   </div>
                   <textarea required value={avisData.commentaire} onChange={e => setAvisData({...avisData, commentaire: e.target.value})} className="w-full p-4 rounded-md bg-white text-slate-900 outline-none font-medium text-xs shadow-inner" placeholder="Votre expérience..." rows={3}></textarea>
                   <button className="w-full py-3 bg-slate-900 text-white rounded-md font-bebas tracking-widest uppercase hover:bg-white hover:text-slate-900 transition-all text-sm">Publier</button>
                </form>
              )}

              <div className="space-y-3">
                 {clientData.avis.map((a: any) => (
                   <div key={a.id} className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2 group hover:border-emerald-500 transition-all">
                      <div className="flex justify-between items-center">
                        <div className="flex text-orange-400">
                           {Array.from({length: a.note}).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-orange-400" />)}
                        </div>
                        <span className="text-[9px] font-medium text-slate-300 uppercase italic">{new Date(a.date_creation).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight italic opacity-70 group-hover:opacity-100 transition-opacity">"{a.commentaire}"</p>
                   </div>
                 ))}
              </div>
           </section>

           <section className="bg-emerald-50 rounded-lg p-6 space-y-5 border border-emerald-100 group transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-emerald-600 shadow-sm transition-all group-hover:scale-110">
                    <MessageSquare className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Support VIP</h3>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Disponible 24/7</p>
                 </div>
              </div>
              <a href="https://wa.me/2290192629860" target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-md font-bebas tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-md text-sm">
                 <WhatsAppIcon className="w-4 h-4" /> WhatsApp
              </a>
           </section>
        </div>
      </div>

      {/* Floating Action Buttons — repositionnés pour ne pas se superposer à la bottom nav mobile */}
      <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 flex flex-col gap-3 z-40 no-print">
        <a href="https://wa.me/2290192629860" target="_blank" className="w-12 h-12 md:w-14 md:h-14 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-all group relative">
          <WhatsAppIcon className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a href="tel:+2290192629860" className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-all group relative border border-white/10">
          <Phone className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
        </a>
      </div>
    </div>
  );
};

export default ClientSpace;

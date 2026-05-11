import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  UserPlus, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Car, 
  Bell, 
  Star, 
  LogOut, 
  Smartphone,
  ChevronRight,
  History,
  Wrench,
  Clock,
  Info,
  ShieldCheck,
  MessageSquare,
  User,
  ArrowRight,
  Layers
} from 'lucide-react';
import api from '../services/api';

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

  // États pour l'avis
  const [showAvisForm, setShowAvisForm] = useState(false);
  const [avisData, setAvisData] = useState({
    note: 5,
    commentaire: '',
    reparation: ''
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

  const handleLogout = () => {
    localStorage.removeItem('client_phone');
    setIsLoggedIn(false);
    setClientData(null);
    setPhone('');
    setView('LOGIN');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f0f9f4] animate-in fade-in duration-1000">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-emerald-100/50 space-y-10 relative overflow-hidden">
          <div className="text-center space-y-4 relative z-10">
            <div className="w-20 h-20 bg-slate-900 text-emerald-400 rounded-[1.75rem] flex items-center justify-center mx-auto shadow-2xl rotate-3 transition-transform duration-700 hover:rotate-0 mb-8">
              {view === 'LOGIN' ? <Lock className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
               {view === 'LOGIN' ? 'Espace Client' : 'Adhésion Luxe'}
            </h1>
            <p className="text-slate-400 font-medium text-sm leading-relaxed italic">
               {view === 'LOGIN' 
                 ? 'Veuillez saisir vos identifiants pour accéder à votre garage numérique.' 
                 : 'Rejoignez le cercle privilégié Luxury Elegance Garage.'}
            </p>
          </div>

          {view === 'LOGIN' ? (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Numéro de Téléphone</label>
                <div className="relative group">
                  <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                  <input 
                    type="tel" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold text-lg shadow-inner transition-all"
                    placeholder="01 02 03 04 05"
                  />
                </div>
              </div>
              {error && (
                 <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                    <Info className="w-4 h-4 text-rose-600" />
                    <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">{error}</p>
                 </div>
              )}
              <button 
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all duration-500 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                <span>{loading ? 'Authentification...' : 'Accéder à mon espace'}</span>
              </button>
              <div className="text-center pt-2">
                 <button type="button" onClick={() => setView('REGISTER')} className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-widest">Nouveau client ? Créer un compte</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6 relative z-10">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2">Nom</label>
                     <input required type="text" value={registerData.nom} onChange={e => setRegisterData({...registerData, nom: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2">Prénoms</label>
                     <input required type="text" value={registerData.prenoms} onChange={e => setRegisterData({...registerData, prenoms: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2">Téléphone</label>
                  <input required type="tel" value={registerData.contact} onChange={e => setRegisterData({...registerData, contact: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner" placeholder="Ex: 0192629860" />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest ml-2">Adresse Résidence</label>
                  <input required type="text" value={registerData.adresse} onChange={e => setRegisterData({...registerData, adresse: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-sm shadow-inner" />
               </div>
               {error && <p className="text-rose-600 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}
               <button 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all duration-500 mt-4 active:scale-95 flex items-center justify-center gap-4"
              >
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                <span>{loading ? 'Création...' : 'Valider mon inscription'}</span>
              </button>
              <div className="text-center pt-2">
                 <button type="button" onClick={() => setView('LOGIN')} className="text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">Retour à la connexion</button>
              </div>
            </form>
          )}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-16 space-y-12 animate-in fade-in duration-1000">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 animate-in slide-in-from-top-4 duration-1000">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-2xl rotate-3">
                {clientData.client.nom[0]}
             </div>
             <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Espace {clientData.client.nom}</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-widest text-xs uppercase flex items-center gap-2">
             <CheckCircle2 className="w-4 h-4 text-emerald-500" />
             Membre certifié Luxury Elegance Garage
          </p>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 px-8 py-4 bg-white border border-rose-100 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-900/5 hover:bg-rose-600 hover:text-white transition-all duration-500 group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* Main Content: Active Repairs */}
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
             <div className="flex items-center gap-3 ml-2">
                <div className="h-1 w-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Suivi technique en direct</h2>
             </div>
             <div className="grid grid-cols-1 gap-8">
                {clientData.reparations.filter((r: Repair) => r.statut !== 'TERMINE' && r.statut !== 'ANNULE').length > 0 ? (
                  clientData.reparations.filter((r: Repair) => r.statut !== 'TERMINE' && r.statut !== 'ANNULE').map((r: Repair) => (
                    <div key={r.id} className="card-luxury p-10 bg-white group hover:shadow-emerald-900/5 overflow-hidden relative">
                       <div className="flex justify-between items-start mb-10 relative z-10">
                          <div className="space-y-3">
                             <span className="font-mono text-xs font-black text-emerald-600 px-5 py-2 bg-emerald-50 rounded-full border border-emerald-100 shadow-inner tracking-widest">OR-{r.id.toString().padStart(4, '0')}</span>
                             <h3 className="text-4xl font-black text-slate-900 mt-4 tracking-tighter uppercase">{r.vehicule_plate}</h3>
                             <p className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3 h-3" /> {r.categorie}
                             </p>
                          </div>
                          <div className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${r.statut === 'EN_COURS' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-orange-500 text-white shadow-orange-200'}`}>
                             <Clock className="w-3 h-3 animate-spin-slow" />
                             {r.statut.replace('_', ' ')}
                          </div>
                       </div>
                       
                       <div className="space-y-6 relative z-10">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest items-end">
                             <span className="text-slate-400 italic">État d'avancement technique</span>
                             <span className="text-emerald-600 text-2xl tracking-tighter">{r.progression}%</span>
                          </div>
                          <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
                             <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-[2s] shadow-lg shadow-emerald-500/20" style={{ width: `${r.progression}%` }}></div>
                          </div>
                          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-start gap-4">
                             <Info className="w-5 h-5 text-slate-300 mt-0.5" />
                             <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{r.description}"</p>
                          </div>
                       </div>
                       <Wrench className="absolute -right-8 -bottom-8 w-40 h-40 text-emerald-500/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                    </div>
                  ))
                ) : (
                  <div className="card-luxury p-20 text-center space-y-6 bg-emerald-50/20 border-emerald-100/50">
                     <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                     </div>
                     <div className="space-y-2">
                        <p className="font-black uppercase tracking-[0.4em] text-slate-900">Tout est en ordre</p>
                        <p className="text-xs font-medium text-slate-400 italic">Aucune intervention active n'est rattachée à votre profil.</p>
                     </div>
                  </div>
                )}
             </div>
          </section>

          <section className="space-y-6">
             <div className="flex items-center gap-3 ml-2">
                <div className="h-1 w-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Mon Parc Automobile</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {clientData.vehicules.map((v: Vehicle) => (
                  <div key={v.id} className="card-luxury p-8 flex items-center gap-6 group hover:border-emerald-500/50">
                     <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-3 transition-transform duration-700">
                        <Car className="w-8 h-8" />
                     </div>
                     <div>
                        <p className="font-mono text-xl font-black text-emerald-600 tracking-tighter uppercase">{v.immatriculation}</p>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1 opacity-60">{v.marque} {v.modele}</p>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Sidebar: Alerts & Notifications */}
        <div className="space-y-10">
           <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-8">
                 <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">Certifications & Alertes</h2>
                 {clientData.alertes.length > 0 ? (
                   clientData.alertes.map((a: Maintenance) => (
                     <div key={a.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4 hover:bg-white/10 transition-all duration-500">
                        <div className="flex items-center gap-3 text-emerald-400">
                           <ShieldCheck className="w-5 h-5 animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{a.type_maintenance}</span>
                        </div>
                        <div className="space-y-1">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Échéance prévue :</p>
                           <p className="text-3xl font-black italic text-white tracking-tighter">{new Date(a.date_prochaine_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <p className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 w-fit px-3 py-1 rounded-full uppercase tracking-widest italic">± {a.km_prochain_prevu.toLocaleString()} KM</p>
                     </div>
                   ))
                 ) : (
                   <div className="py-10 text-center space-y-4 opacity-40">
                      <ShieldCheck className="w-10 h-10 mx-auto text-slate-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Carnet d'entretien à jour</p>
                   </div>
                 )}
              </div>
              <ShieldCheck className="absolute -right-10 -bottom-10 w-40 h-40 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
           </section>

           <section className="space-y-6">
              <div className="flex items-center gap-3 ml-2">
                 <div className="h-1 w-6 bg-emerald-500 rounded-full"></div>
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Flux d'Informations</h2>
              </div>
              <div className="space-y-4">
                 {clientData.notifications.map((n: Notification) => (
                   <div key={n.id} className="p-6 bg-white rounded-3xl border border-emerald-50 shadow-sm hover:shadow-xl transition-all duration-700 space-y-2 group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">{n.type.replace('_', ' ')}</span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">{new Date(n.date_envoi).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{n.message}"</p>
                   </div>
                 ))}
                 {clientData.notifications.length === 0 && (
                   <div className="p-10 text-center opacity-30">
                      <p className="text-[10px] font-black uppercase tracking-widest">Fil d'actualité vide</p>
                   </div>
                 )}
              </div>
           </section>

           <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-emerald-500 rounded-full"></div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Mes Certifications</h2>
                 </div>
                 <button onClick={() => setShowAvisForm(!showAvisForm)} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 hover:text-slate-900 transition-colors uppercase tracking-widest">
                    <Star className="w-3 h-3" /> Laisser un avis
                 </button>
              </div>

              {showAvisForm && (
                <form onSubmit={handleAvisSubmit} className="p-10 bg-emerald-600 text-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/20 space-y-8 animate-in slide-in-from-top-6 duration-700 relative overflow-hidden">
                   <div className="text-center space-y-2 relative z-10">
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase italic">Votre Signature</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Évaluez notre prestation</p>
                   </div>
                   <div className="flex gap-4 justify-center py-4 bg-white/10 rounded-2xl relative z-10">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setAvisData({...avisData, note: star})} className={`transition-all duration-500 hover:scale-125 ${star <= avisData.note ? 'text-orange-400' : 'text-white/20'}`}>
                           <Star className={`w-8 h-8 ${star <= avisData.note ? 'fill-orange-400' : ''}`} />
                        </button>
                      ))}
                   </div>
                   <textarea 
                     required 
                     value={avisData.commentaire} 
                     onChange={e => setAvisData({...avisData, commentaire: e.target.value})}
                     className="w-full p-6 rounded-[1.5rem] bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/10 font-medium text-sm shadow-inner relative z-10" 
                     placeholder="Votre expérience..." 
                     rows={3}
                   ></textarea>
                   <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-white hover:text-slate-900 transition-all duration-500 relative z-10">Transmettre mon avis</button>
                   <MessageSquare className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 -rotate-12" />
                </form>
              )}

              <div className="space-y-4">
                 {clientData.avis.map((a: any) => (
                   <div key={a.id} className="p-6 bg-white rounded-3xl border border-emerald-50 shadow-sm space-y-4 group hover:shadow-lg transition-all duration-700">
                      <div className="flex justify-between items-center">
                        <div className="flex text-orange-400">
                           {Array.from({length: a.note}).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-orange-400" />)}
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(a.date_creation).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-relaxed italic uppercase tracking-tight">"{a.commentaire}"</p>
                   </div>
                 ))}
                 {clientData.avis.length === 0 && !showAvisForm && (
                   <div className="p-10 text-center opacity-30 grayscale">
                      <p className="text-[10px] font-black uppercase tracking-widest">Aucun avis publié</p>
                   </div>
                 )}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default ClientSpace;

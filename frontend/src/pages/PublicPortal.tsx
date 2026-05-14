import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Droplets, 
  Zap, 
  MessageSquare,
  Phone,
  Clock,
  ArrowRight,
  X,
  Plus,
  CalendarDays,
  User,
  Tool
} from 'lucide-react';
import api from '../services/api';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const PublicPortal: React.FC = () => {
  const [bookingData, setBookingData] = useState({
    nom: '',
    telephone: '',
    service: 'Révision Générale',
    date: '',
    heure: '09:00',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publicAvis, setPublicAvis] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
     phone: '',
     note: 5,
     commentaire: ''
  });

  useEffect(() => {
     fetchPublicAvis();
  }, []);

  const fetchPublicAvis = async () => {
     try {
        const res = await api.get('avis/public_list/');
        setPublicAvis(res.data);
     } catch (err) {
        console.error("Erreur avis publics:", err);
     }
  };

  const handlePublicReviewSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     try {
        await api.post('client-space/submit_avis/', newReview);
        alert("Merci pour votre avis ! Il sera visible après modération.");
        setNewReview({ phone: '', note: 5, commentaire: '' });
        setShowReviewForm(false);
     } catch (err: any) {
        alert(err.response?.data?.error || "Erreur lors de l'envoi de l'avis.");
     } finally {
        setIsSubmitting(false);
     }
  };

  const services = [
    { name: 'Entretien & Vidange', icon: Droplets, desc: 'Maintenance haute performance pour la longévité de votre moteur.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Diagnostic Expert', icon: Zap, desc: 'Interrogation approfondie des calculateurs et systèmes embarqués.', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Climatisation Luxe', icon: Zap, desc: 'Purification d\'air et optimisation thermique pour un confort absolu.', color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { name: 'Sécurité & Freinage', icon: ShieldCheck, desc: 'Contrôle rigoureux et certification des organes de sécurité.', color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        nom_client_public: bookingData.nom,
        telephone_client_public: bookingData.telephone,
        service_demande: bookingData.service,
        date_rdv: `${bookingData.date}T${bookingData.heure}:00Z`,
        notes: bookingData.notes
      };
      await api.post('appointments/', payload);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('Erreur lors de la prise de rendez-vous. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10 space-y-10 bg-emerald-50 animate-in fade-in duration-1000">
         <div className="w-32 h-32 bg-white text-emerald-500 rounded-[3rem] shadow-2xl flex items-center justify-center animate-bounce duration-1000">
            <CheckCircle2 className="w-16 h-16" />
         </div>
         <div className="space-y-4">
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter italic">C'est confirmé !</h2>
            <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
               Bonjour <span className="text-emerald-600 font-black uppercase">{bookingData.nom}</span>, votre créneau a été réservé avec succès. Notre équipe vous contactera pour finaliser votre accueil.
            </p>
         </div>
         <button onClick={() => setIsSuccess(false)} className="btn-primary-luxury px-12 py-5 transition-all duration-700 hover:scale-105">Retour à l'expérience</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-1000 selection:bg-emerald-200">
      {/* Hero Section Ultra Premium */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-slate-950">
         <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1632823471565-1ec2c63db7f5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-110 animate-pulse-slow"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
         
         <div className="relative z-10 text-center space-y-10 px-6 max-w-5xl">
            <div className="flex justify-center items-center gap-4 animate-in slide-in-from-top-4 duration-1000">
               <div className="h-px w-10 bg-emerald-500"></div>
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] shadow-emerald-500/20">ESTABLISHED 2024</span>
               <div className="h-px w-10 bg-emerald-500"></div>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter leading-none animate-in zoom-in-95 duration-1000">
              LUXEL<span className="text-emerald-500">-G</span>
            </h1>
            
            <p className="text-xl md:text-3xl text-slate-300 font-medium tracking-tight max-w-3xl mx-auto leading-relaxed opacity-80 animate-in fade-in duration-1000 delay-300">
              L'orfèvrerie automobile au service de votre excellence. Précision chirurgicale et ingénierie de pointe.
            </p>
            
            <div className="pt-10 flex flex-col md:flex-row gap-6 justify-center items-center animate-in slide-in-from-bottom-6 duration-1000 delay-500">
               <a href="#booking" className="px-12 py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-emerald-900/50 hover:bg-emerald-500 hover:-translate-y-1 transition-all duration-700 active:scale-95">Prendre Rendez-vous</a>
               <a href="#services" className="px-12 py-6 bg-white/5 backdrop-blur-xl text-white border border-white/10 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-white/10 transition-all duration-700">Expertises</a>
            </div>
         </div>

         {/* Scroll Indicator */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
            <div className="w-1 h-12 bg-gradient-to-b from-emerald-500 to-transparent rounded-full"></div>
         </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20 border-b border-emerald-50">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
               { val: "100%", lab: "Satisfaction" },
               { val: "15k+", lab: "Heures Tech" },
               { val: "24/7", lab: "Assistance" },
               { val: "A+", lab: "Certification" },
            ].map((st, i) => (
               <div key={i} className="text-center space-y-1 group">
                  <p className="text-4xl font-black text-slate-900 italic tracking-tighter transition-all duration-700 group-hover:scale-110 group-hover:text-emerald-600">{st.val}</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{st.lab}</p>
               </div>
            ))}
         </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="max-w-7xl mx-auto px-6 py-40 space-y-24">
         <div className="text-center space-y-6">
            <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.4em] flex items-center justify-center gap-4">
               <div className="h-px w-6 bg-emerald-600"></div>
               Savoir-Faire Signature
               <div className="h-px w-6 bg-emerald-600"></div>
            </h2>
            <p className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Ingénierie de précision.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {services.map((s, i) => {
               const Icon = s.icon;
               return (
                  <div key={i} className="group p-10 rounded-[3rem] bg-white border border-emerald-50 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(16,185,129,0.15)] hover:border-emerald-200 transition-all duration-700 hover:-translate-y-3 flex flex-col items-center text-center">
                     <div className={`w-24 h-24 ${s.bg} ${s.color} rounded-[2rem] flex items-center justify-center mb-10 shadow-inner group-hover:rotate-6 group-hover:scale-110 transition-all duration-700`}>
                        <Icon className="w-10 h-10" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase">{s.name}</h3>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed opacity-80">{s.desc}</p>
                  </div>
               );
            })}
         </div>
      </section>

      {/* Quote / Vision Section */}
      <section className="py-40 bg-emerald-600 text-white relative overflow-hidden">
         <div className="max-w-5xl mx-auto px-10 text-center space-y-12 relative z-10">
            <Star className="w-12 h-12 mx-auto text-emerald-200 fill-emerald-200 opacity-40 transition-transform duration-[3s] hover:rotate-180" />
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
              "L'élégance n'est pas de se faire remarquer, c'est de se faire retenir."
            </h2>
            <div className="flex items-center justify-center gap-6">
               <div className="h-px w-12 bg-white/30"></div>
               <p className="text-xs font-black uppercase tracking-[0.4em] opacity-60">Signature Luxel-G</p>
               <div className="h-px w-12 bg-white/30"></div>
            </div>
         </div>
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_70%)] opacity-50"></div>
      </section>

      {/* Gallery Section */}
      <section className="py-40 bg-slate-950 text-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 space-y-24">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
               <div className="space-y-4">
                  <h2 className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em]">Curated Gallery</h2>
                  <p className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">In Motion.</p>
               </div>
               <p className="max-w-md text-slate-500 font-medium text-lg leading-relaxed italic border-l-4 border-emerald-500 pl-8 transition-all duration-1000 hover:border-l-8">
                 Chaque véhicule qui franchit nos portes reçoit une attention digne d'une pièce de collection.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 h-[500px] rounded-[3rem] overflow-hidden group relative shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2070&auto=format&fit=crop" alt="Maintenance" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 flex items-end p-12 backdrop-blur-[2px]">
                     <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Atelier Motorisation</p>
                        <p className="text-2xl font-black uppercase tracking-tight">Réglage Haute Fréquence</p>
                     </div>
                  </div>
               </div>
               <div className="h-[500px] rounded-[3rem] overflow-hidden group relative shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1507702553912-a15641e827c8?q=80&w=2073&auto=format&fit=crop" alt="Diagnostic" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 flex items-end p-12 backdrop-blur-[2px]">
                     <p className="text-xl font-black uppercase tracking-tight translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">Analyse Digitale</p>
                  </div>
               </div>
               <div className="h-[500px] rounded-[3rem] overflow-hidden group relative shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=2070&auto=format&fit=crop" alt="AC Service" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 flex items-end p-12 backdrop-blur-[2px]">
                     <p className="text-xl font-black uppercase tracking-tight translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">Confort Thermique</p>
                  </div>
               </div>
               <div className="md:col-span-2 h-[500px] rounded-[3rem] overflow-hidden group relative shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop" alt="Brakes" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 flex items-end p-12 backdrop-blur-[2px]">
                     <p className="text-xl font-black uppercase tracking-tight translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">Système de Freinage Sport</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Booking Form Section */}
      <section id="booking" className="bg-[#f0f9f4] py-40">
         <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12 animate-in slide-in-from-left-8 duration-1000">
               <div className="space-y-6">
                  <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.4em]">Admission Service</h2>
                  <p className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none italic">Réservez votre Prestige.</p>
               </div>
               <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md">
                 Confiez-nous vos clés. Notre conciergerie technique organise votre prise en charge personnalisée.
               </p>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-6 text-slate-900 group cursor-pointer transition-all duration-500 hover:translate-x-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"><Phone className="w-6 h-6" /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Ligne</p>
                        <p className="font-black text-lg uppercase tracking-widest">+229 01 92 62 98 60</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 text-slate-900 group cursor-pointer transition-all duration-500 hover:translate-x-4">
                     <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500"><Mail className="w-6 h-6" /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Officiel</p>
                        <p className="font-black text-lg uppercase tracking-widest">contact@luxel-g.com</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="card-luxury p-12 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border-white animate-in slide-in-from-right-8 duration-1000 transition-all duration-1000 hover:shadow-emerald-500/10">
               <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3 group">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 transition-colors group-focus-within:text-emerald-600">Identité Complète</label>
                        <div className="relative">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                           <input 
                              type="text" required 
                              value={bookingData.nom}
                              onChange={e => setBookingData({...bookingData, nom: e.target.value})}
                              className="w-full pl-14 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all duration-500 shadow-inner"
                              placeholder="Ex: Jean Zinsou"
                           />
                        </div>
                     </div>
                     <div className="space-y-3 group">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 transition-colors group-focus-within:text-emerald-600">Ligne Téléphone</label>
                        <div className="relative">
                           <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                           <input 
                              type="tel" required 
                              value={bookingData.telephone}
                              onChange={e => setBookingData({...bookingData, telephone: e.target.value})}
                              className="w-full pl-14 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all duration-500 shadow-inner"
                              placeholder="+229 01..."
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3 group">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 transition-colors group-focus-within:text-emerald-600">Nature de l'intervention</label>
                     <div className="relative">
                        <Tool className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                        <select 
                           value={bookingData.service}
                           onChange={e => setBookingData({...bookingData, service: e.target.value})}
                           className="w-full pl-14 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all duration-500 shadow-inner appearance-none cursor-pointer"
                        >
                           <option>Révision Générale</option>
                           <option>Diagnostic Électronique</option>
                           <option>Service Climatisation</option>
                           <option>Freinage Performance</option>
                           <option>Réparation Moteur</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3 group">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 transition-colors group-focus-within:text-emerald-600">Date</label>
                        <div className="relative">
                           <CalendarDays className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                           <input 
                              type="date" required 
                              value={bookingData.date}
                              onChange={e => setBookingData({...bookingData, date: e.target.value})}
                              className="w-full pl-14 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all duration-500 shadow-inner"
                           />
                        </div>
                     </div>
                     <div className="space-y-3 group">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 transition-colors group-focus-within:text-emerald-600">Horaire</label>
                        <div className="relative">
                           <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                           <select 
                              value={bookingData.heure}
                              onChange={e => setBookingData({...bookingData, heure: e.target.value})}
                              className="w-full pl-14 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all duration-500 shadow-inner appearance-none cursor-pointer"
                           >
                              <option>08:00</option><option>09:30</option><option>11:00</option>
                              <option>14:00</option><option>15:30</option><option>17:00</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <button 
                     disabled={isSubmitting}
                     className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all duration-700 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-4 group"
                  >
                     {isSubmitting ? <Clock className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />}
                     <span>{isSubmitting ? 'Transmission...' : 'Enregistrer ma demande'}</span>
                  </button>
               </form>
            </div>
         </div>
      </section>

      {/* Public Testimonials Section */}
      <section className="py-40 bg-white">
         <div className="max-w-7xl mx-auto px-6 space-y-24">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
               <div className="space-y-6 text-center md:text-left">
                  <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.4em]">Voix de l'Excellence</h2>
                  <p className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Paroles de Gentlemen.</p>
               </div>
               <button 
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-3 px-10 py-5 bg-emerald-50 text-emerald-700 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all duration-700 shadow-xl shadow-emerald-900/5 active:scale-95 group"
               >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-700" />
                  Soumettre un avis
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {publicAvis.map((a: any, i: number) => (
                  <div key={i} className="p-10 rounded-[3rem] bg-[#f8fafc] border border-emerald-50/50 shadow-sm space-y-8 relative group hover:shadow-xl transition-all duration-700 hover:-translate-y-2">
                     <div className="flex text-emerald-500 transition-all duration-700 group-hover:scale-110">
                        {Array.from({length: a.note}).map((_, j) => <Star key={j} className="w-4 h-4 fill-emerald-500" />)}
                     </div>
                     <p className="text-xl font-black text-slate-900 leading-tight italic transition-all duration-700 group-hover:text-emerald-700">"{a.commentaire}"</p>
                     <div className="pt-6 flex items-center gap-4 border-t border-emerald-100/50">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-lg shadow-xl transition-all duration-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-6">
                           {a.client_name[0].toUpperCase()}
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase tracking-widest text-slate-900">{a.client_name}</p>
                           <p className="text-[10px] font-bold text-slate-400">{new Date(a.date_creation).toLocaleDateString('fr-FR')}</p>
                        </div>
                     </div>
                  </div>
               ))}
               {publicAvis.length === 0 && (
                  <div className="col-span-3 py-20 text-center opacity-30 grayscale space-y-4">
                     <MessageSquare className="w-16 h-16 mx-auto text-slate-200" />
                     <p className="font-black uppercase tracking-[0.4em] text-xs">Les témoignages arrivent bientôt</p>
                  </div>
               )}
            </div>
         </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-slate-950 text-white py-32 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-20">
            <div className="space-y-8">
               <h3 className="text-3xl font-black italic tracking-tighter">LUXEL<span className="text-emerald-500">-G</span></h3>
               <p className="text-sm text-slate-500 leading-relaxed max-w-xs font-medium italic">
                 Le luxe est une affaire de confiance. Notre garage s'engage sur l'excellence de chaque intervention.
               </p>
               <div className="flex gap-4">
                  {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500 hover:scale-110 transition-all cursor-pointer"></div>)}
               </div>
            </div>
            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Navigation</h4>
               <ul className="space-y-4 text-sm font-bold text-slate-400">
                  <li className="hover:text-white cursor-pointer transition-colors duration-500 hover:translate-x-2">Notre Vision</li>
                  <li className="hover:text-white cursor-pointer transition-colors duration-500 hover:translate-x-2">Équipe Technique</li>
                  <li className="hover:text-white cursor-pointer transition-colors duration-500 hover:translate-x-2">FAQ Maintenance</li>
                  <li className="hover:text-white cursor-pointer transition-colors duration-500 hover:translate-x-2">Politique Qualité</li>
               </ul>
            </div>
            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Contact</h4>
               <p className="text-sm font-bold text-white">Cotonou, Bénin — Zone Industrielle Akpakpa</p>
               <p className="text-sm font-bold text-emerald-400 transition-all duration-500 hover:scale-105">+229 01 92 62 98 60</p>
               <div className="pt-4 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ouvert : Lun — Sam / 08h — 18h</span>
               </div>
            </div>
         </div>
      </footer>

      {/* Public Review Modal */}
      {showReviewForm && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-700">
            <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-1000">
               <button onClick={() => setShowReviewForm(false)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors duration-500 hover:rotate-90">
                  <X className="w-6 h-6" />
               </button>
               <div className="text-center space-y-3">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Certification Client</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partagez votre expérience d'exception.</p>
               </div>
               <form onSubmit={handlePublicReviewSubmit} className="space-y-8">
                  <div className="space-y-3 group">
                     <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2 group-focus-within:translate-x-2 transition-transform duration-500">N° de Téléphone Client</label>
                     <input 
                        type="tel" required 
                        value={newReview.phone}
                        onChange={e => setNewReview({...newReview, phone: e.target.value})}
                        className="w-full px-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold shadow-inner transition-all duration-700"
                        placeholder="01 02 03 04 05"
                     />
                  </div>
                  <div className="flex gap-4 justify-center py-4 bg-emerald-50/30 rounded-3xl">
                     {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setNewReview({...newReview, note: star})} className={`transition-all duration-700 hover:scale-125 ${star <= newReview.note ? 'text-orange-500' : 'text-slate-200'}`}>
                           <Star className={`w-8 h-8 ${star <= newReview.note ? 'fill-orange-500' : ''}`} />
                        </button>
                     ))}
                  </div>
                  <div className="space-y-3 group">
                     <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2 group-focus-within:translate-x-2 transition-transform duration-500">Observations</label>
                     <textarea 
                        required rows={3}
                        value={newReview.commentaire}
                        onChange={e => setNewReview({...newReview, commentaire: e.target.value})}
                        className="w-full px-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold shadow-inner transition-all duration-700"
                        placeholder="Rédigez votre témoignage..."
                     />
                  </div>
                  <button 
                     disabled={isSubmitting}
                     className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all duration-700 disabled:opacity-50 active:scale-95"
                  >
                     {isSubmitting ? <Clock className="w-5 h-5 animate-spin" /> : 'Publier mon avis'}
                  </button>
               </form>
               <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
            </div>
         </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-6 z-40 no-print">
         <a href="https://wa.me/2290192629860" target="_blank" className="w-16 h-16 bg-[#25D366] text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 hover:rotate-6 transition-all duration-700 group relative">
            <WhatsAppIcon className="w-8 h-8" />
            <span className="absolute right-full mr-6 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0 tracking-widest">WhatsApp Direct</span>
         </a>
         <a href="tel:+2290192629860" className="w-16 h-16 bg-white text-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 hover:-rotate-6 transition-all duration-700 group relative border border-emerald-50">
            <Phone className="w-8 h-8 text-emerald-600" />
            <span className="absolute right-full mr-6 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0 tracking-widest">Appel Audio</span>
         </a>
      </div>
    </div>
  );
};

export default PublicPortal;

import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Wrench, Phone, MessageSquare } from 'lucide-react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const PublicLayout: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      {/* Barre de Navigation Publique */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-emerald-50 shadow-sm transition-all duration-1000">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-700 group">
            <div className="w-12 h-12 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-900/10 group-hover:rotate-12 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-700">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none transition-colors duration-700 group-hover:text-emerald-600">
                LUXEL<span className="text-emerald-500">-G</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mt-1.5 transition-opacity duration-700 group-hover:opacity-60">Prestige & Performance</p>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-10">
            <a href="/#services" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-600 transition-all duration-700 hover:translate-y-[-1px]">Expertises</a>
            <a href="/#booking" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-600 transition-all duration-700 hover:translate-y-[-1px]">Réservation</a>
            <Link to="/espace-client" className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 hover:text-white hover:bg-emerald-600 transition-all duration-700 bg-emerald-50 px-8 py-3.5 rounded-2xl border border-emerald-100 shadow-sm active:scale-95">Mon Espace Client</Link>
          </div>

          <div className="flex items-center gap-4">
             <a 
               href="tel:+2290192629860" 
               className="hidden md:flex px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all duration-700 active:scale-95 group"
             >
               <Phone className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform duration-700" />
               Contact Direct
             </a>
             <button className="lg:hidden w-12 h-12 flex flex-col items-center justify-center gap-1.5 bg-slate-50 rounded-xl transition-all duration-700 hover:bg-emerald-50">
                <div className="w-6 h-0.5 bg-slate-900"></div>
                <div className="w-6 h-0.5 bg-slate-900"></div>
             </button>
          </div>
        </div>
      </nav>

      <main key={location.pathname} className="page-transition-wrapper min-h-[calc(100-h-24)]">
        <Outlet />
      </main>

      {/* Footer Public */}
      <footer className="bg-slate-950 text-white py-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-4 gap-24 relative z-10">
          <div className="col-span-1 md:col-span-1 space-y-10">
             <h2 className="text-4xl font-black italic tracking-tighter uppercase transition-colors duration-1000 hover:text-emerald-500">LUXEL<span className="text-emerald-500">-G</span></h2>
             <p className="text-sm text-slate-500 leading-relaxed font-medium italic opacity-80">L'excellence automobile au service de votre distinction. Expertise technique et entretien certifié pour véhicules de prestige.</p>
             <div className="flex gap-4">
                <a href="https://wa.me/2290192629860" target="_blank" className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-[#25D366] hover:border-[#25D366] transition-all duration-700 group">
                   <WhatsAppIcon className="w-6 h-6" />
                </a>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-emerald-600 transition-all duration-700 cursor-pointer">
                   <MessageSquare className="w-6 h-6" />
                </div>
             </div>
          </div>
          
          <div className="space-y-10">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Navigation</h3>
             <ul className="text-sm font-bold space-y-6 text-slate-400">
                <li className="hover:text-white transition-all duration-700 hover:translate-x-2 cursor-pointer">Le Concept Luxel-G</li>
                <li className="hover:text-white transition-all duration-700 hover:translate-x-2 cursor-pointer">Technologies Atelier</li>
                <li className="hover:text-white transition-all duration-700 hover:translate-x-2 cursor-pointer">Prise en Charge VIP</li>
                <li className="hover:text-white transition-all duration-700 hover:translate-x-2 cursor-pointer">Mentions Légales</li>
             </ul>
          </div>

          <div className="space-y-10">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Service Hours</h3>
             <ul className="text-sm font-bold space-y-6 text-slate-400">
                <li className="flex justify-between items-center border-b border-white/5 pb-4 transition-all duration-700 hover:border-emerald-500/30"><span>Lundi — Vendredi</span> <span className="text-white font-black italic">08:00 — 18:30</span></li>
                <li className="flex justify-between items-center border-b border-white/5 pb-4 transition-all duration-700 hover:border-emerald-500/30"><span>Samedi</span> <span className="text-white font-black italic">09:00 — 15:00</span></li>
                <li className="flex justify-between items-center text-emerald-400 pt-2 group cursor-default"><span className="font-black italic transition-transform duration-700 group-hover:scale-110">Dimanche</span> <span className="uppercase tracking-widest opacity-60">Sur RDV Spécifique</span></li>
             </ul>
          </div>

          <div className="space-y-10">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Conciergerie</h3>
             <div className="space-y-6">
                <p className="text-sm font-bold text-white leading-relaxed">Cotonou, Bénin<br/><span className="text-emerald-500 italic">Zone Industrielle Akpakpa</span></p>
                <div className="pt-6 border-t border-white/5">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Direct Line</p>
                   <p className="text-lg font-black text-white italic tracking-widest">+229 01 92 62 98 60</p>
                </div>
             </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-10 pt-20 mt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">© 2026 LUXEL-G SYSTEM — THE LUXURY STANDARD</p>
           <div className="flex gap-8 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <span className="hover:text-emerald-500 cursor-pointer transition-colors duration-700">Privacy</span>
              <span className="hover:text-emerald-500 cursor-pointer transition-colors duration-700">Terms</span>
           </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
      </footer>
    </div>
  );
};

export default PublicLayout;

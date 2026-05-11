import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';

const PublicLayout: React.FC = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-emerald-100 selection:text-emerald-800">
      {/* Barre de Navigation Publique */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/reservation" className="flex items-center gap-2 hover:opacity-80 transition-all group">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:rotate-6 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                LUXEL<span className="text-emerald-500">-G</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Luxury Garage</p>
            </div>
          </a>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors">Nos Services</a>
            <a href="#booking" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors">Prendre RDV</a>
            <a href="/espace-client" className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-all bg-emerald-50 px-6 py-2.5 rounded-2xl border border-emerald-100/50 shadow-sm">Mon Espace Client</a>
            <a href="#contact" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors">Contact</a>
          </div>

          <a 
            href="tel:+2290192629860" 
            className="px-8 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 hover:shadow-emerald-200 hover:-translate-y-1 active:scale-95 transition-all"
          >
            Appeler
          </a>
        </div>
      </nav>

      <main key={location.pathname} className="page-transition-wrapper">
        <Outlet />
      </main>

      {/* Footer Public */}
      <footer className="bg-slate-950 text-white py-32 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-20">
          <div className="space-y-6">
             <h2 className="text-3xl font-black italic tracking-tighter uppercase">LUXEL<span className="text-emerald-500">-G</span></h2>
             <p className="text-sm text-slate-500 leading-relaxed font-medium italic">L'excellence automobile au service de votre distinction. Expertise technique et entretien certifié pour véhicules de prestige.</p>
          </div>
          <div className="space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Service Hours</h3>
             <ul className="text-sm font-bold space-y-4 text-slate-400">
                <li className="flex justify-between items-center border-b border-white/5 pb-2"><span>Lundi — Vendredi</span> <span className="text-white">08:00 — 18:30</span></li>
                <li className="flex justify-between items-center border-b border-white/5 pb-2"><span>Samedi</span> <span className="text-white">09:00 — 15:00</span></li>
                <li className="flex justify-between items-center text-emerald-400 pt-2"><span className="font-black italic">Dimanche</span> <span className="uppercase tracking-widest">Sur Rendez-vous</span></li>
             </ul>
          </div>
          <div className="space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Conciergerie</h3>
             <p className="text-sm font-bold text-white leading-relaxed">Cotonou, Bénin — Zone Industrielle Akpakpa<br/><span className="text-slate-500 italic mt-2 block">Service Client : +229 01 92 62 98 60</span></p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 mt-20 border-t border-white/5 text-center">
           <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">© 2026 LUXEL-G SYSTEM — THE LUXURY STANDARD</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

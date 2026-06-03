import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Car } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-oswald relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/30 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-2xl w-full text-center relative z-10 space-y-8 animate-in zoom-in-95 duration-700">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <h1 className="font-bebas text-4xl text-emerald-600 tracking-wider leading-none">
            LUXEL<span className="text-slate-900">-G</span>
          </h1>
        </div>

        {/* 404 Visual */}
        <div className="relative inline-block">
          <h1 className="text-[120px] md:text-[180px] font-bebas leading-none text-slate-900 tracking-tighter mix-blend-overlay">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center animate-bounce duration-[3000ms]">
              <Car className="w-16 h-16 md:w-24 md:h-24 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bebas tracking-widest uppercase text-slate-800">
            Oups ! Vous êtes hors piste.
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm md:text-base">
            La page que vous recherchez n'existe pas ou a été déplacée. Notre mécanicien est parti chercher la pièce manquante...
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-lg font-bebas tracking-widest uppercase text-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center shadow-lg shadow-emerald-600/30"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </NavLink>
          <NavLink
            to="/espace-client"
            className="flex items-center gap-2 px-8 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-bebas tracking-widest uppercase text-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto justify-center"
          >
            <Search className="w-4 h-4" />
            Espace Client
          </NavLink>
        </div>

      </div>
    </div>
  );
};

export default NotFound;

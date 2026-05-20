import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellOff, 
  Package, 
  ShieldCheck, 
  History, 
  RefreshCcw, 
  ArrowRight, 
  AlertTriangle,
  Clock,
  TrendingDown,
  Layers
} from 'lucide-react';
import api from '../services/api';

interface Alert {
  id: string;
  type: 'STOCK' | 'VISIT' | 'MAINTENANCE';
  title: string;
  message: string;
  date: string;
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE';
  link: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [stock, maintenance] = await Promise.all([
        api.get('stock/'),
        api.get('maintenance-predictive/alertes/')
      ]);

      const newAlerts: Alert[] = [];

      // 1. Stock Alerts
      stock.data.filter((s: any) => s.quantite < s.seuil_alerte).forEach((s: any) => {
        newAlerts.push({
          id: `stock-${s.id}`,
          type: 'STOCK',
          title: `Rupture Critique : ${s.nom}`,
          message: `Niveau de stock alarmant (${s.quantite} unités). Veuillez approvisionner dès que possible pour éviter tout arrêt de service.`,
          date: new Date().toISOString(),
          priority: 'HAUTE',
          link: '/stock'
        });
      });

      // 2. Maintenance Alerts
      maintenance.data.forEach((m: any) => {
        newAlerts.push({
          id: `maint-${m.id}`,
          type: 'MAINTENANCE',
          title: `Planification : ${m.vehicule_plate}`,
          message: `Maintenance préventive (${m.type_maintenance.toLowerCase()}) rattachée au dossier technique, prévue pour le ${new Date(m.date_prochaine_prevue).toLocaleDateString('fr-FR')}.`,
          date: new Date().toISOString(),
          priority: 'BASSE',
          link: '/reparations'
        });
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase">Notifications</h1>
          <p className="text-slate-500 font-medium tracking-widest text-xs uppercase flex items-center gap-2">
             <Bell className="w-4 h-4 text-emerald-500" />
             Système de surveillance Luxury Elegance Garage
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchAlerts} 
            className="flex items-center gap-3 bg-white border border-emerald-100 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-500 shadow-xl shadow-emerald-900/5 active:scale-95 group"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
            ACTUALISER
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card-luxury overflow-hidden min-h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        <div className="px-10 py-8 border-b border-emerald-50/50 flex items-center justify-between bg-emerald-50/10">
          <div className="flex gap-8">
            <button className="text-emerald-600 font-black text-xs uppercase tracking-[0.2em] border-b-4 border-emerald-600 pb-2 transition-all">Flux d'Alertes ({alerts.length})</button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
             Temps réel activé
          </div>
        </div>
        
        <div className="divide-y divide-emerald-50/30 flex-1">
          {loading ? (
            <div className="p-40 text-center flex flex-col items-center gap-6">
               <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
               <p className="font-black text-emerald-600 uppercase text-xs tracking-[0.3em]">Interrogation des modules...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-40 text-center flex flex-col items-center justify-center opacity-20 grayscale space-y-8">
              <div className="w-24 h-24 bg-emerald-50 rounded-xl flex items-center justify-center shadow-inner">
                 <BellOff className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-2xl">Statut Nominal</p>
              <p className="text-[10px] font-bold tracking-[0.2em]">AUCUN ÉVÉNEMENT PRIORITAIRE À SIGNALER</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-1000">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  onClick={() => navigate(alert.link)} 
                  className="p-10 hover:bg-emerald-50/30 transition-all duration-700 group cursor-pointer border-l-8 border-l-transparent hover:border-l-emerald-600 relative overflow-hidden"
                >
                  <div className="flex items-start gap-10 relative z-10">
                    <div className={`shrink-0 p-5 rounded-xl shadow-2xl transition-all duration-700 group-hover:rotate-3 group-hover:scale-110 ${
                      alert.priority === 'HAUTE' ? 'bg-rose-600 text-white shadow-rose-200' : 
                      alert.priority === 'MOYENNE' ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-slate-900 text-emerald-400 shadow-slate-200'
                    }`}>
                      {alert.type === 'STOCK' ? <Package className="w-8 h-8" /> : alert.type === 'VISIT' ? <ShieldCheck className="w-8 h-8" /> : <History className="w-8 h-8" />}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors duration-500 uppercase tracking-tight">{alert.title}</h4>
                        <div className="flex items-center gap-2 text-slate-300">
                           <Clock className="w-3.5 h-3.5" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Maintenant</span>
                        </div>
                      </div>
                      <p className="text-base font-medium text-slate-500 leading-relaxed max-w-3xl italic">"{alert.message}"</p>
                      <div className="flex items-center gap-6 pt-2">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg ${
                          alert.priority === 'HAUTE' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                          alert.priority === 'MOYENNE' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          PRIORITÉ {alert.priority}
                        </span>
                        <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                          <Layers className="w-3 h-3" />
                          MODULE: {alert.type}
                        </span>
                        <button className="ml-auto flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-700">
                          Consulter <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Effet déco interne */}
                  <div className={`absolute -right-10 -bottom-10 w-40 h-40 opacity-0 group-hover:opacity-5 transition-all duration-1000 ${
                     alert.priority === 'HAUTE' ? 'bg-rose-500' : 'bg-emerald-500'
                  } rounded-full blur-3xl`}></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
          <div className="card-luxury p-10 bg-slate-900 text-white flex items-start gap-8 group overflow-hidden relative">
             <div className="w-16 h-16 rounded-lg bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30 relative z-10">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
             </div>
             <div className="relative z-10 flex-1 space-y-2">
                <h4 className="text-lg font-black italic tracking-tighter uppercase text-emerald-400">Certifié Luxury Elegance</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                   Toutes les alertes système sont vérifiées et synchronisées en temps réel avec la base de données centrale.
                </p>
             </div>
             <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>

          <div className="card-luxury p-10 flex items-start gap-8 group overflow-hidden relative">
             <div className="w-16 h-16 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100 relative z-10">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
             </div>
             <div className="relative z-10 flex-1 space-y-2">
                <h4 className="text-lg font-black tracking-tighter uppercase text-rose-600">Surveillance Stock</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                   Les seuils d'alerte configurés permettent d'anticiper les ruptures et de maintenir une disponibilité optimale.
                </p>
             </div>
             <TrendingDown className="absolute -right-6 -bottom-6 w-32 h-32 text-rose-600/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>
      </div>
    </div>
  );
};

export default Notifications;

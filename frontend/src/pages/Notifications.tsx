import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellOff, 
  Package, 
  ShieldCheck, 
  RefreshCcw, 
  ArrowRight, 
  AlertTriangle,
  Clock,
  TrendingDown,
  Layers,
  CheckCheck,
  Calendar,
  CreditCard,
  Edit3,
  Star,
  Wrench,
} from 'lucide-react';
import api, { fetchAllPages } from '../services/api';

// Types unifiés pour toutes les alertes
interface UnifiedAlert {
  id: string;
  type: 'STOCK' | 'MAINTENANCE' | 'NOUVEAU_RDV' | 'PAIEMENT_RECU' | 'DEMANDE_MODIFICATION_PROFORMA' | 'NOUVEL_AVIS' | 'STOCK_BAS';
  title: string;
  message: string;
  date: string;
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE';
  link: string;
  lu?: boolean;
  backendId?: number; // ID en base pour marquer comme lu
}

// Mapping des types de notifications vers leurs paramètres visuels et liens
const NOTIF_CONFIG: Record<string, { label: string; priority: 'HAUTE' | 'MOYENNE' | 'BASSE'; link: string; icon: React.ReactNode; color: string }> = {
  NOUVEAU_RDV:                  { label: 'Nouveau Rendez-vous',              priority: 'HAUTE',   link: '/staff/agenda',        icon: <Calendar className="w-8 h-8" />,  color: 'bg-blue-600 shadow-blue-200' },
  PAIEMENT_RECU:                { label: 'Paiement Reçu',                    priority: 'HAUTE',   link: '/staff/caisse',         icon: <CreditCard className="w-8 h-8" />, color: 'bg-emerald-600 shadow-emerald-200' },
  DEMANDE_MODIFICATION_PROFORMA:{ label: 'Modification Demandée',            priority: 'HAUTE',   link: '/staff/factures',       icon: <Edit3 className="w-8 h-8" />,      color: 'bg-amber-500 shadow-amber-200' },
  NOUVEL_AVIS:                  { label: 'Nouvel Avis Client',               priority: 'MOYENNE', link: '/staff/clients',        icon: <Star className="w-8 h-8" />,       color: 'bg-purple-600 shadow-purple-200' },
  STOCK_BAS:                    { label: 'Alerte Stock',                     priority: 'HAUTE',   link: '/staff/stock',          icon: <Package className="w-8 h-8" />,    color: 'bg-rose-600 shadow-rose-200' },
  STOCK:                        { label: 'Rupture Stock',                    priority: 'HAUTE',   link: '/staff/stock',          icon: <Package className="w-8 h-8" />,    color: 'bg-rose-600 shadow-rose-200' },
  MAINTENANCE:                  { label: 'Maintenance Prédictive',           priority: 'BASSE',   link: '/staff/reparations',    icon: <Wrench className="w-8 h-8" />,     color: 'bg-slate-900 text-emerald-400 shadow-slate-200' },
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<UnifiedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('UNREAD');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [stockItems, maintenanceItems, staffNotifs] = await Promise.all([
        fetchAllPages<any>('stock/'),
        fetchAllPages<any>('maintenance-predictive/alertes/'),
        fetchAllPages<any>('notifications-staff/'),
      ]);

      const unified: UnifiedAlert[] = [];

      // 1. Vraies notifications du backend (paiements, RDV, modifications, avis...)
      staffNotifs.forEach((n: any) => {
        const cfg = NOTIF_CONFIG[n.type] || { label: n.type, priority: 'MOYENNE', link: '/staff', icon: <Bell className="w-8 h-8" />, color: 'bg-slate-700 shadow-slate-200' };
        unified.push({
          id: `notif-${n.id}`,
          backendId: n.id,
          type: n.type,
          title: cfg.label,
          message: n.message,
          date: n.date_creation,
          priority: cfg.priority,
          link: cfg.link,
          lu: n.lu,
        });
      });

      // 2. Alertes stock générées localement
      stockItems.filter((s: any) => s.quantite < s.seuil_alerte).forEach((s: any) => {
        unified.push({
          id: `stock-${s.id}`,
          type: 'STOCK',
          title: `Rupture Critique : ${s.nom}`,
          message: `Niveau de stock alarmant (${s.quantite} unités restantes). Approvisionnement urgent requis pour éviter tout arrêt de service.`,
          date: new Date().toISOString(),
          priority: 'HAUTE',
          link: '/staff/stock',
          lu: false,
        });
      });

      // 3. Alertes maintenance prédictive
      maintenanceItems.forEach((m: any) => {
        unified.push({
          id: `maint-${m.id}`,
          type: 'MAINTENANCE',
          title: `Maintenance : ${m.vehicule_plate}`,
          message: `Maintenance préventive (${m.type_maintenance?.toLowerCase()}) prévue pour le ${new Date(m.date_prochaine_prevue).toLocaleDateString('fr-FR')}.`,
          date: new Date().toISOString(),
          priority: 'BASSE',
          link: '/staff/reparations',
          lu: false,
        });
      });

      // Tri : non lus en premier, puis par date
      unified.sort((a, b) => {
        if (!a.lu && b.lu) return -1;
        if (a.lu && !b.lu) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setAlerts(unified);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Marquer une notification comme lue et naviguer
  const handleAlertClick = async (alert: UnifiedAlert) => {
    if (alert.backendId && !alert.lu) {
      try {
        await api.patch(`notifications-staff/${alert.backendId}/`, { lu: true });
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, lu: true } : a));
      } catch (e) { /* silencieux */ }
    }
    navigate(alert.link);
  };

  // Tout marquer comme lu
  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const unread = alerts.filter(a => a.backendId && !a.lu);
      await Promise.all(unread.map(a => api.patch(`notifications-staff/${a.backendId}/`, { lu: true })));
      setAlerts(prev => prev.map(a => ({ ...a, lu: true })));
    } catch (e) { /* silencieux */ }
    setMarkingAll(false);
  };

  const displayedAlerts = filter === 'UNREAD' ? alerts.filter(a => !a.lu) : alerts;
  const unreadCount = alerts.filter(a => !a.lu).length;

  const getConfig = (type: string) => NOTIF_CONFIG[type] || { label: type, priority: 'MOYENNE', link: '/staff', icon: <Bell className="w-8 h-8" />, color: 'bg-slate-700 shadow-slate-200' };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase">Notifications</h1>
          <p className="text-slate-500 font-medium tracking-widest text-xs uppercase flex items-center gap-2">
             <Bell className="w-4 h-4 text-emerald-500" />
             Centre de surveillance — Luxury Elegance Garage
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all duration-300 shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              TOUT MARQUER LU
            </button>
          )}
          <button 
            onClick={fetchAlerts} 
            className="flex items-center gap-3 bg-white border border-emerald-100 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-500 shadow-xl shadow-emerald-900/5 active:scale-95 group"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
            ACTUALISER
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="card-luxury p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{unreadCount}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Non lues</p>
          </div>
        </div>
        <div className="card-luxury p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{alerts.length - unreadCount}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Traitées</p>
          </div>
        </div>
        <div className="card-luxury p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{alerts.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card-luxury overflow-hidden min-h-[400px] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        <div className="px-8 py-5 border-b border-emerald-50/50 flex items-center justify-between bg-emerald-50/10">
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('UNREAD')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'UNREAD' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}
            >
              Non lues {unreadCount > 0 && <span className="ml-1 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Toutes ({alerts.length})
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Temps réel
          </div>
        </div>
        
        <div className="divide-y divide-emerald-50/30 flex-1">
          {loading ? (
            <div className="p-40 text-center flex flex-col items-center gap-6">
               <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
               <p className="font-black text-emerald-600 uppercase text-xs tracking-[0.3em]">Chargement des notifications...</p>
            </div>
          ) : displayedAlerts.length === 0 ? (
            <div className="p-40 text-center flex flex-col items-center justify-center opacity-20 grayscale space-y-8">
              <div className="w-24 h-24 bg-emerald-50 rounded-xl flex items-center justify-center shadow-inner">
                 <BellOff className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-2xl">
                {filter === 'UNREAD' ? 'Tout est à jour !' : 'Aucune notification'}
              </p>
              <p className="text-[10px] font-bold tracking-[0.2em]">
                {filter === 'UNREAD' ? 'AUCUNE NOTIFICATION NON LUE' : 'AUCUN ÉVÉNEMENT À SIGNALER'}
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-1000">
              {displayedAlerts.map((alert) => {
                const cfg = getConfig(alert.type);
                return (
                  <div 
                    key={alert.id} 
                    onClick={() => handleAlertClick(alert)} 
                    className={`p-8 lg:p-10 hover:bg-emerald-50/30 transition-all duration-500 group cursor-pointer border-l-4 relative overflow-hidden ${!alert.lu ? 'border-l-emerald-500 bg-emerald-50/10' : 'border-l-transparent opacity-60 hover:opacity-100'}`}
                  >
                    {/* Indicateur non lu */}
                    {!alert.lu && (
                      <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-lg shadow-rose-200"></span>
                    )}
                    <div className="flex items-start gap-8 relative z-10">
                      <div className={`shrink-0 p-4 rounded-xl shadow-xl transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 text-white ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <h4 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors duration-300 uppercase tracking-tight">
                            {alert.title}
                          </h4>
                          <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
                             <Clock className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-black uppercase tracking-widest">
                               {new Date(alert.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{alert.message}"</p>
                        <div className="flex items-center gap-4 pt-1 flex-wrap">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                            alert.priority === 'HAUTE' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                            alert.priority === 'MOYENNE' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            PRIORITÉ {alert.priority}
                          </span>
                          <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                            <Layers className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <button className="ml-auto flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 flex-shrink-0">
                            Consulter <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Deco */}
                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 opacity-0 group-hover:opacity-5 transition-all duration-700 ${alert.priority === 'HAUTE' ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full blur-3xl`}></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
          <div className="card-luxury p-10 bg-slate-900 text-white flex items-start gap-8 group overflow-hidden relative">
             <div className="w-16 h-16 rounded-lg bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30 relative z-10">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
             </div>
             <div className="relative z-10 flex-1 space-y-2">
                <h4 className="text-lg font-black italic tracking-tighter uppercase text-emerald-400">Certifié Luxury Elegance</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                   Toutes les alertes sont synchronisées en temps réel avec la base de données. Cliquez sur une notification pour naviguer directement au module concerné.
                </p>
             </div>
             <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>

          <div className="card-luxury p-10 flex items-start gap-8 group overflow-hidden relative">
             <div className="w-16 h-16 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100 relative z-10">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
             </div>
             <div className="relative z-10 flex-1 space-y-2">
                <h4 className="text-lg font-black tracking-tighter uppercase text-rose-600">Surveillance Continue</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                   Stock, rendez-vous, paiements clients, demandes de modifications — tout remonte automatiquement ici.
                </p>
             </div>
             <TrendingDown className="absolute -right-6 -bottom-6 w-32 h-32 text-rose-600/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>
      </div>
    </div>
  );
};

export default Notifications;

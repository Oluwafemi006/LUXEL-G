import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Car,
  Wrench,
  AlertTriangle,
  TrendingUp,
  FileText,
  Wallet,
  Clock,
  CheckCircle2,
  Bell,
  Loader2,
  Settings as SettingsIcon,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api, { fetchAllPages } from '../services/api';
import { useAuth } from '../context/AuthContext';

import './Dashboard.css';

interface MaintenanceAlert {
  id: number;
  vehicule_plate: string;
  type_maintenance: string;
  date_prochaine_prevue: string;
  km_prochain_prevu: number;
}

interface FinanceStats {
  recettes_jour: number;
  depenses_jour: number;
  total_impayes: number;
  solde: number;
}

interface RecentIntervention {
  id: number;
  numero_or: string;
  client_name: string;
  vehicule_plate: string;
  date_creation: string;
  statut: string;
  total_ttc: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    vehicles: 0,
    repairs: 0,
    stockLow: 0
  });
  const [finance, setFinance] = useState<FinanceStats>({
    recettes_jour: 0,
    depenses_jour: 0,
    total_impayes: 0,
    solde: 0
  });
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // AI features removed: riskClients and sentiment analysis disabled

  const [recentRepairs, setRecentRepairs] = useState<RecentIntervention[]>([]);

  const { user, refreshUser } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Initialize prefs from user profile
  useEffect(() => {
    if (user?.dashboard_preferences?.length) {
      setPrefs(user.dashboard_preferences);
    } else {
      // Default all visible
      setPrefs(['clients', 'vehicules', 'reparations', 'impayes', 'finance', 'graphique_ca', 'relances', 'interventions']);
    }
  }, [user]);

  const togglePref = (widget: string) => {
    setPrefs(prev =>
      prev.includes(widget) ? prev.filter(w => w !== widget) : [...prev, widget]
    );
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.patch('users/dashboard-prefs/', { widgets: prefs });
      if (refreshUser) await refreshUser();
      setShowConfigModal(false);
    } catch (err) {
      console.error('Erreur sauvegarde préférences', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const isVisible = (widget: string) => prefs.includes(widget);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, m, f, movements, repairsList] = await Promise.all([
          api.get('stats/'),
          api.get('maintenance-predictive/alertes/'),
          api.get('caisse/synthese/'),
          fetchAllPages<any>('caisse/'),
          // AI endpoints removed: risque_impayes removed
          fetchAllPages<any>('reparations/')
        ]);
        // Note: stock et notifications-staff ont un polling dédié dans MainLayout
        
        setStats({
          clients: s.data.counts.clients,
          vehicles: s.data.counts.vehicles,
          repairs: s.data.counts.repairs_active,
          stockLow: s.data.counts.stock_low
        });

        setMaintenanceAlerts(m.data);
        setFinance(f.data);
        // AI risk clients removed
        
        setRecentRepairs(repairsList.slice(0, 5).map((r: any) => ({
          id: r.id,
          numero_or: r.numero_or || `OR-${r.id.toString().padStart(4, '0')}`,
          client_name: r.client_name,
          vehicule_plate: r.vehicule_plate,
          date_creation: r.date_creation,
          statut: r.statut,
          total_ttc: r.facture ? r.facture.total_ttc : 0
        })));

        // Process Chart Data (Last 6 days)
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const last6Days = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          
          // Format date as YYYY-MM-DD in local time
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const dayName = days[d.getDay()];
          
          const dayMovements = movements.filter((m: any) => m.date_mouvement === dateStr);
          const recettes = dayMovements
            .filter((m: any) => m.type_mouvement === 'RECETTE')
            .reduce((acc: number, curr: any) => acc + Number(curr.montant), 0);
          const depenses = dayMovements
            .filter((m: any) => m.type_mouvement === 'DEPENSE')
            .reduce((acc: number, curr: any) => acc + Number(curr.montant), 0);

          last6Days.push({ name: dayName, recettes, depenses });
        }
        setChartData(last6Days);

        // Process Stock Health (si besoin futur)
        // const stockItems = Array.isArray(st.data) ? st.data : [];
        // const lowStockCount = stockItems.filter((i: any) => i.quantite < i.seuil_alerte).length;
        // const healthyCount = stockItems.length - lowStockCount;
        
      } catch (error) {
        console.error('Erreur dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sentiment analysis removed (AI endpoints no longer available)

  // Format numbers with spaces as thousand separators
  const formatNumber = (num: number) => {
    return num.toLocaleString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TERMINE': return 'bg-emerald-100 text-emerald-700';
      case 'EN_COURS': return 'bg-blue-100 text-blue-700';
      case 'EN_ATTENTE': return 'bg-orange-100 text-orange-700';
      case 'ANNULE': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'TERMINE': return 'Terminé';
      case 'EN_COURS': return 'En cours';
      case 'EN_ATTENTE': return 'En attente';
      case 'ANNULE': return 'Annulé';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-right" style={{ animationDelay: '0.2s' }}>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tableau de Bord</h2>
          <p className="text-slate-500 text-sm mt-1">Suivi global de l'activité du garage</p>
        </div>
        {user?.role === 'DIRECTEUR' && (
          <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm font-bold text-sm">
            <SettingsIcon className="w-4 h-4" />
            Personnaliser l'affichage
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Clients */}
        {isVisible('clients') && (
        <div className="card-anim bg-white rounded-2xl shadow-lg p-6 animate-fade-up cursor-pointer" style={{ animationDelay: '0.1s' }} onClick={() => navigate('/staff/clients')}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-2 font-bold tracking-wider">CLIENTS</p>
              {loading ? (
                <div className="h-9 w-16 bg-slate-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-black text-slate-800">{formatNumber(stats.clients)}</p>
              )}
              <p className="text-emerald-600 text-xs mt-2 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Actifs ce mois
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center transition-all duration-500 hover:rotate-12">
              <Users className="text-emerald-600 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full progress-bar-anim" style={{ width: loading ? '0%' : '75%' }}></div>
            </div>
          </div>
        </div>
        )}

        {/* Card 2: Véhicules */}
        {isVisible('vehicules') && (
        <div className="card-anim bg-white rounded-2xl shadow-lg p-6 animate-fade-up cursor-pointer" style={{ animationDelay: '0.2s' }} onClick={() => navigate('/staff/vehicules')}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-2 font-bold tracking-wider">VÉHICULES</p>
              {loading ? (
                <div className="h-9 w-16 bg-slate-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-black text-slate-800">{formatNumber(stats.vehicles)}</p>
              )}
              <p className="text-blue-600 text-xs mt-2 font-medium flex items-center">
                <Car className="w-3 h-3 mr-1" /> Inscrits au total
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center transition-all duration-500 hover:rotate-12">
              <Car className="text-blue-600 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full progress-bar-anim" style={{ width: loading ? '0%' : '60%' }}></div>
            </div>
          </div>
        </div>
        )}

        {/* Card 3: En Cours */}
        {isVisible('reparations') && (
        <div className="card-anim bg-white rounded-2xl shadow-lg p-6 animate-fade-up cursor-pointer" style={{ animationDelay: '0.3s' }} onClick={() => navigate('/staff/reparations')}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-2 font-bold tracking-wider">EN COURS</p>
              {loading ? (
                <div className="h-9 w-16 bg-slate-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-black text-slate-800">{formatNumber(stats.repairs)}</p>
              )}
              <p className="text-orange-600 text-xs mt-2 font-medium flex items-center">
                <Clock className="w-3 h-3 mr-1" /> Réparations actives
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center transition-all duration-500 hover:rotate-12">
              <Wrench className="text-orange-600 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-orange-500 h-1.5 rounded-full progress-bar-anim" style={{ width: loading ? '0%' : '85%' }}></div>
            </div>
          </div>
        </div>
        )}

        {/* Card 4: Factures du Mois */}
        {isVisible('impayes') && (
        <div className="card-anim bg-white rounded-2xl shadow-lg p-6 animate-fade-up cursor-pointer" style={{ animationDelay: '0.4s' }} onClick={() => navigate('/staff/factures')}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-2 font-bold tracking-wider">IMPAYÉS</p>
              {loading ? (
                <div className="h-9 w-24 bg-slate-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-black text-slate-800">{formatNumber(finance.total_impayes)} <span className="text-sm">F</span></p>
              )}
              <p className="text-rose-600 text-xs mt-2 font-medium flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" /> Reste à recouvrir
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center transition-all duration-500 hover:rotate-12">
              <FileText className="text-rose-600 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-rose-500 h-1.5 rounded-full progress-bar-anim" style={{ width: loading ? '0%' : (finance.total_impayes > 0 ? '90%' : '0%') }}></div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Deuxième ligne - Financial */}
      {isVisible('finance') && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Finance du Jour */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-6 animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white text-opacity-90 text-sm font-bold tracking-wider">FINANCE DU JOUR</p>
              <div className="flex items-baseline space-x-6 mt-4">
                <div>
                  <p className="text-emerald-100 text-xs font-bold tracking-widest mb-1">RECETTES</p>
                  <p className="text-white text-3xl font-black">
                    {loading ? "..." : formatNumber(finance.recettes_jour)} <span className="text-lg opacity-80">F</span>
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-bold tracking-widest mb-1">DÉPENSES</p>
                  <p className="text-white text-3xl font-black">
                    {loading ? "..." : formatNumber(finance.depenses_jour)} <span className="text-lg opacity-80">F</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center slow-spin">
              <Wallet className="text-white w-7 h-7" />
            </div>
          </div>
          <div className="border-t border-white border-opacity-20 pt-4 mt-2">
            <div className="flex justify-between items-center">
              <p className="text-white text-opacity-90 text-sm font-medium">Solde Global en Caisse</p>
              <p className="text-white text-2xl font-black">
                {loading ? "..." : formatNumber(finance.solde)} <span className="text-sm">F</span>
              </p>
            </div>
          </div>
            {/* Empty placeholder or removed */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-center items-center opacity-50">
          <Wrench className="w-12 h-12 text-slate-300 mb-2" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Espace Réservé</p>
        </div>
        </div>
      </div>
      )}

      {/* Chart and Relances Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Container */}
        {isVisible('graphique_ca') ? (
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 chart-container-anim">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Évolution du Chiffre d'Affaires</h3>
            <div className="flex space-x-2">
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-white shadow-md transition-all duration-300 hover:bg-emerald-600">7j</button>
            </div>
          </div>
          <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000)}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${formatNumber(Number(value))} F`, '']}
                />
                <Area type="monotone" dataKey="recettes" name="Recettes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRecettes)" />
                <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        ) : <div className="lg:col-span-2 hidden"></div>}

        {/* Relances & Maintenance */}
        {isVisible('relances') && (
        <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-right" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Relances & Maint.</h3>
            <Bell className="text-slate-400 w-5 h-5" />
          </div>

          {maintenanceAlerts.length === 0 ? (
            <div className="bg-emerald-50 rounded-xl p-6 text-center transition-all duration-500 hover:scale-105 border border-emerald-100">
              <CheckCircle2 className="text-emerald-500 w-12 h-12 mx-auto mb-3" />
              <p className="text-emerald-700 font-black tracking-wide">AUCUNE RELANCE À PRÉVOIR</p>
              <p className="text-emerald-600 text-sm mt-1 font-medium">POUR LE MOMENT</p>
            </div>
          ) : (
            <div className="space-y-3 mt-4 h-[250px] overflow-y-auto pr-2 custom-scroll-sm">
              {maintenanceAlerts.map(alert => {
                const isUrgent = new Date(alert.date_prochaine_prevue) < new Date();
                return (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl transition-all duration-300 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{alert.type_maintenance}</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-wider">{alert.vehicule_plate}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded shadow-sm">
                      {new Date(alert.date_prochaine_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Interventions Récentes Table */}
      {isVisible('interventions') && (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-in" style={{ animationDelay: '0.6s' }}>
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Interventions Récentes</h3>
          <button onClick={() => navigate('/staff/reparations')} className="text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-all duration-300 flex items-center">
            Voir tout <TrendingUp className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">N° OR</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Véhicule</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                  </td>
                </tr>
              ) : recentRepairs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm font-bold text-slate-400">Aucune intervention récente.</td>
                </tr>
              ) : (
                recentRepairs.map((rep, index) => (
                  <tr key={rep.id} className="table-row-anim cursor-pointer hover:bg-emerald-50/30" style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.1}s backwards` }} onClick={() => navigate(`/staff/reparations?id=${rep.id}`)}>
                    <td className="px-6 py-4 text-emerald-600 font-black text-sm tracking-wide">{rep.numero_or}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{rep.client_name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-slate-200">
                        {rep.vehicule_plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(rep.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(rep.statut)} border-opacity-50`}>
                        {formatStatus(rep.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800">
                      {rep.total_ttc > 0 ? `${formatNumber(rep.total_ttc)} F` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ── Modal Personnalisation Dashboard ── */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Personnaliser l'affichage</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scroll-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Sélectionnez les widgets à afficher</p>

              {[
                { id: 'clients', label: 'Statistiques Clients', icon: Users },
                { id: 'vehicules', label: 'Statistiques Véhicules', icon: Car },
                { id: 'reparations', label: 'Statistiques Réparations', icon: Wrench },
                { id: 'impayes', label: 'Statistiques Impayés', icon: AlertTriangle },
                { id: 'finance', label: 'Finance du Jour (Caisse)', icon: Wallet },
                { id: 'graphique_ca', label: 'Évolution du Chiffre d\'Affaires', icon: TrendingUp },
                { id: 'relances', label: 'Relances & Maintenance', icon: Bell },
                { id: 'interventions', label: 'Interventions Récentes', icon: FileText }
              ].map(widget => (
                <label key={widget.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                  <div className="flex items-center gap-3">
                    <widget.icon className={`w-5 h-5 ${prefs.includes(widget.id) ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${prefs.includes(widget.id) ? 'text-slate-900' : 'text-slate-500'}`}>{widget.label}</span>
                  </div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${prefs.includes(widget.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                    {prefs.includes(widget.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <input type="checkbox" checked={prefs.includes(widget.id)} onChange={() => togglePref(widget.id)} className="hidden" />
                </label>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowConfigModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                Annuler
              </button>
              <button onClick={savePreferences} disabled={savingPrefs} className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
                {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <SettingsIcon className="w-4 h-4" />}
                {savingPrefs ? 'Sauvegarde...' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

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
  BrainCircuit,
  MessageSquare,
  ShieldAlert,
  Loader2
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
  const analyzingSentiment = false;
  const sentimentResult: any = null;
  const handleAnalyzeSentiment = async () => { /* disabled */ };

  const [recentRepairs, setRecentRepairs] = useState<RecentIntervention[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, m, f, movements, rc, repairsList] = await Promise.all([
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Clients */}
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

        {/* Card 2: Véhicules */}
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

        {/* Card 3: En Cours */}
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

        {/* Card 4: Factures du Mois */}
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
              <div className="bg-rose-500 h-1.5 rounded-full progress-bar-anim" style={{ width: loading ? '0%' : (finance.total_impayes > 0 ? '90%' : '10%') }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Deuxième ligne - Financial */}
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
        </div>

        {/* Situation Trésorerie (AI) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in hover-glow flex flex-col justify-between" style={{ animationDelay: '0.4s' }}>
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-500 text-sm font-bold tracking-wider mb-2">VIGILANCE TRÉSORERIE (IA)</p>
                {riskClients.length > 0 ? (
                  <>
                    <p className="text-rose-600 text-3xl font-black mt-1">
                      {riskClients.length} <span className="text-lg text-slate-800 font-bold">Clients à risques</span>
                    </p>
                    <p className="text-rose-500 text-xs mt-2 font-medium flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Attention : Taux d'impayés anormal
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-600 text-3xl font-black mt-1">Sain</p>
                    <p className="text-emerald-500 text-xs mt-2 font-medium flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Aucun risque détecté par l'IA
                    </p>
                  </>
                )}
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${riskClients.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
            
            {riskClients.length > 0 && (
              <div className="space-y-2 mt-4">
                {riskClients.map((client, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg">
                    <span className="font-bold text-slate-700">{client.nom}</span>
                    <span className="text-rose-600 font-black">{formatNumber(client.solde_impaye)} F</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {riskClients.length > 0 && (
            <button className="w-full mt-4 bg-rose-50 text-rose-600 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:bg-rose-100 hover:scale-105 flex justify-center items-center">
              <Bell className="w-4 h-4 mr-2" /> Pensez à relancer les clients
            </button>
          )}
        </div>
      </div>

      {/* Chart and Relances Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Container */}
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

        {/* Relances & Maintenance */}
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
      </div>

      {/* Interventions Récentes Table */}
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

      {/* IA Analysis Bloc (F2) */}
      <div className="bg-slate-900 rounded-2xl shadow-xl p-8 animate-slide-in relative overflow-hidden" style={{ animationDelay: '0.7s' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="text-emerald-400 w-6 h-6" />
              <h3 className="text-xl font-bold text-white tracking-wide">Intelligence Artificielle — Avis Clients</h3>
            </div>
            <p className="text-slate-400 text-sm">Générez une synthèse analytique des retours de satisfaction via Gemini.</p>
          </div>
          <button 
            onClick={handleAnalyzeSentiment}
            disabled={analyzingSentiment}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {analyzingSentiment ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...</>
            ) : (
              <><MessageSquare className="w-4 h-4" /> Analyser la satisfaction</>
            )}
          </button>
        </div>

        {sentimentResult && (() => {
          const total = (sentimentResult.positif || 0) + (sentimentResult.neutre || 0) + (sentimentResult.negatif || 0);
          const pctPos = total > 0 ? Math.round((sentimentResult.positif / total) * 100) : 0;
          const pctNeu = total > 0 ? Math.round((sentimentResult.neutre / total) * 100) : 0;
          const pctNeg = total > 0 ? Math.round((sentimentResult.negatif / total) * 100) : 0;
          const globalColor = sentimentResult.global === 'POSITIF' ? 'text-emerald-400' : sentimentResult.global === 'NEGATIF' ? 'text-rose-400' : 'text-amber-400';
          return (
            <div className="mt-8 pt-8 border-t border-slate-700/50 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Sentiment global */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 flex flex-col justify-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Sentiment Global</p>
                  <p className={`text-2xl font-black ${globalColor}`}>{sentimentResult.global}</p>
                  <p className="text-slate-500 text-xs mt-1">{total} avis analysés</p>
                </div>
                {/* Positifs */}
                <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                  <p className="text-emerald-400 text-3xl font-black mb-1">{pctPos}%</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Positifs</p>
                  <p className="text-slate-500 text-xs mt-1">{sentimentResult.positif} avis</p>
                </div>
                {/* Neutres */}
                <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/20">
                  <p className="text-amber-400 text-3xl font-black mb-1">{pctNeu}%</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Neutres</p>
                  <p className="text-slate-500 text-xs mt-1">{sentimentResult.neutre} avis</p>
                </div>
                {/* Négatifs */}
                <div className="bg-rose-500/10 rounded-xl p-5 border border-rose-500/20">
                  <p className="text-rose-400 text-3xl font-black mb-1">{pctNeg}%</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Négatifs</p>
                  <p className="text-slate-500 text-xs mt-1">{sentimentResult.negatif} avis</p>
                </div>
              </div>
              {/* Détail des avis */}
              {sentimentResult.details && sentimentResult.details.length > 0 && (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">Détail par Avis</p>
                  <div className="space-y-2">
                    {sentimentResult.details.map((d: any) => (
                      <div key={d.id} className="flex items-start gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                          d.sentiment === 'POSITIF' ? 'bg-emerald-500/20 text-emerald-400' :
                          d.sentiment === 'NEGATIF' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>{d.sentiment}</span>
                        <p className="text-slate-400 text-xs leading-relaxed">{d.resume}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

    </div>
  );
};

export default Dashboard;

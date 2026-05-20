import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Car,
  Wrench,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  FileText,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  Package,
  History,
  Bell
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';

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

interface StaffNotification {
  id: number;
  type: string;
  message: string;
  date_creation: string;
  lu: boolean;
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
  const [staffNotifications, setStaffNotifications] = useState<StaffNotification[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stockPieData, setStockPieData] = useState<any[]>([]);
  const [stockHealthPercent, setStockHealthPercent] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, m, f, c, st, sn] = await Promise.all([
          api.get('stats/'),
          api.get('maintenance-predictive/alertes/'),
          api.get('caisse/synthese/'),
          api.get('caisse/'),
          api.get('stock/'),
          api.get('notifications-staff/')
        ]);
        
        setStats({
          clients: s.data.counts.clients,
          vehicles: s.data.counts.vehicles,
          repairs: s.data.counts.repairs_active,
          stockLow: s.data.counts.stock_low
        });

        setMaintenanceAlerts(m.data);
        setFinance(f.data);
        setStaffNotifications(sn.data.slice(0, 5));

        // Process Chart Data (Last 6 days)
        const movements = Array.isArray(c.data) ? c.data : [];
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

        // Process Stock Pie Data
        const stockItems = Array.isArray(st.data) ? st.data : [];
        const lowStockCount = stockItems.filter((i: any) => i.quantite < i.seuil_alerte).length;
        const healthyCount = stockItems.length - lowStockCount;
        const healthPercent = stockItems.length > 0 ? Math.round((healthyCount / stockItems.length) * 100) : 100;
        setStockHealthPercent(healthPercent);
        setStockPieData([
          { name: 'Sain', value: healthyCount > 0 ? healthyCount : (stockItems.length === 0 ? 100 : 0) },
          { name: 'Alerte', value: lowStockCount },
        ]);
        
      } catch (error) {
        console.error('Erreur dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickActions = [
    { label: "Nouvelle Réception", icon: PlusCircle, path: "/staff/reception", color: "bg-emerald-600" },
    { label: "Créer un Devis", icon: FileText, path: "/staff/devis", color: "bg-blue-600" },
    { label: "Enregistrer Dépense", icon: ArrowUpCircle, path: "/staff/caisse", color: "bg-slate-700" },
    { label: "Ajouter Client", icon: Users, path: "/staff/clients", color: "bg-indigo-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-oswald">
      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-4xl font-bebas text-slate-900 tracking-wider uppercase">Tableau de Bord</h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide">Gestion globale Luxury Elegance Garage</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-2 px-5 py-2.5 ${action.color} text-white rounded-md text-xs font-bebas tracking-widest uppercase shadow-md hover:shadow-xl transition-all active:scale-95`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-700 delay-100">
        <StatCard 
          label="Clients" 
          value={stats.clients} 
          icon={Users} 
          color="emerald" 
          onClick={() => navigate('/staff/clients')} 
          loading={loading}
        />
        <StatCard 
          label="Véhicules" 
          value={stats.vehicles} 
          icon={Car} 
          color="emerald" 
          onClick={() => navigate('/staff/vehicules')} 
          loading={loading}
        />
        <StatCard 
          label="En cours" 
          value={stats.repairs} 
          icon={Wrench} 
          color="orange" 
          onClick={() => navigate('/staff/reparations')} 
          loading={loading}
        />
        <StatCard 
          label="Impayés" 
          value={`${finance.total_impayes.toLocaleString()} F`} 
          icon={AlertTriangle} 
          color={finance.total_impayes > 0 ? "red" : "emerald"} 
          onClick={() => navigate('/staff/factures')} 
          loading={loading}
          isCurrency
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
        {/* Main Content Area (Charts & Activity) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Revenue vs Expenses Chart */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bebas text-slate-900 tracking-wide uppercase">Performance Hebdomadaire</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Flux financier (Recettes vs Dépenses)</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recettes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dépenses</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600, fontFamily: 'Oswald' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: 'Oswald' }}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontFamily: 'Oswald' }}
                  />
                  <Area type="monotone" dataKey="recettes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                  <Area type="monotone" dataKey="depenses" stroke="#cbd5e1" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance & Relances Area */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bebas text-slate-900 tracking-wide uppercase flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Relances & Maintenance
              </h2>
              <button onClick={() => navigate('/staff/reparations')} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">Voir tout</button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {maintenanceAlerts.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="font-bebas text-lg text-slate-900 uppercase tracking-widest">Tout est à jour</p>
                  <p className="text-slate-400 text-xs font-medium">Aucune relance prioritaire aujourd'hui.</p>
                </div>
              ) : (
                maintenanceAlerts.map(alert => (
                  <div key={`m-${alert.id}`} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-600 transition-all border border-slate-100">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bebas text-lg text-slate-900 uppercase tracking-tight">{alert.vehicule_plate}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Prochaine {alert.type_maintenance.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bebas text-emerald-600 tracking-wider">Le {new Date(alert.date_prochaine_prevue).toLocaleDateString()}</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{alert.km_prochain_prevu?.toLocaleString()} KM</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info (Finance & Stock) */}
        <div className="space-y-8">
          
          {/* Daily Finance Card */}
          <div className="bg-slate-900 text-white rounded-lg p-8 shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-xl font-bebas uppercase tracking-wider mb-8 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                Caisse du Jour
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Recettes</span>
                  </div>
                  <p className="text-3xl font-bebas text-emerald-400 tracking-wider">+{finance.recettes_jour.toLocaleString()} F</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dépenses</span>
                  </div>
                  <p className="text-3xl font-bebas text-rose-400 tracking-wider">-{finance.depenses_jour.toLocaleString()} F</p>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Solde Global</span>
                  <div className="flex justify-between items-end">
                    <p className="text-xl font-bebas text-white tracking-widest">{finance.solde.toLocaleString()} F</p>
                    <TrendingUp className="w-8 h-8 text-slate-800 group-hover:text-emerald-500 transition-all duration-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Notifications Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                Alertes Système
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {staffNotifications.length === 0 ? (
                <p className="p-6 text-center text-[10px] font-bold uppercase text-slate-300 italic tracking-widest">Aucune alerte</p>
              ) : staffNotifications.map(n => (
                <div key={`n-${n.id}`} className="p-5 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${n.type === 'NOUVEAU_RDV' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {n.type.replace('_', ' ')}
                    </span>
                    <span className="text-[8px] font-medium text-slate-300 uppercase italic">{new Date(n.date_creation).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 leading-normal uppercase tracking-tight">"{n.message}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Distribution Chart */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bebas text-slate-900 tracking-wide uppercase mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              État du Stock
            </h2>
            
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Oswald' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-100">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest block mb-1">Sain</span>
                <span className="text-lg font-bebas text-emerald-700 tracking-wider">{stockHealthPercent}%</span>
              </div>
              <div onClick={() => navigate('/staff/stock')} className="p-3 rounded-md bg-rose-50 border border-rose-100 cursor-pointer hover:bg-rose-100 transition-all">
                <span className="text-[9px] font-bold text-rose-700 uppercase tracking-widest block mb-1">Alerte</span>
                <span className="text-lg font-bebas text-rose-700 tracking-wider">{stats.stockLow}</span>
              </div>
            </div>
          </div>

          {/* Alert Message Box */}
          {finance.total_impayes > 0 && (
            <div className="bg-rose-600 text-white rounded-lg p-6 shadow-xl shadow-rose-100">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-rose-200 shrink-0" />
                <div>
                  <h3 className="text-lg font-bebas uppercase tracking-wide">Vigilance Trésorerie</h3>
                  <p className="text-[11px] font-medium text-rose-100 mt-1 leading-relaxed uppercase tracking-wider">
                    Vous avez <strong>{finance.total_impayes.toLocaleString()} F</strong> impayés. 
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for Stat Cards
const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: any; 
  color: string; 
  onClick: () => void; 
  loading?: boolean;
  isCurrency?: boolean;
}> = ({ label, value, icon: Icon, color, onClick, loading, isCurrency }) => {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div 
      onClick={onClick} 
      className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-500 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={`w-12 h-12 rounded-md flex items-center justify-center transition-all ${colorMap[color] || colorMap.emerald} border shadow-sm group-hover:bg-emerald-600 group-hover:text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        {loading && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
      </div>
      <div className="relative z-10">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</h3>
        <p className={`text-3xl font-bebas text-slate-900 tracking-wider ${isCurrency && value !== '0 F' ? 'text-emerald-600' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

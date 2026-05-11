import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Car,
  Wrench,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  FileText,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  Package,
  History
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

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

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
  const [stockPieData, setStockPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, m, f, c, st] = await Promise.all([
          api.get('stats/'),
          api.get('maintenance-predictive/alertes/'),
          api.get('caisse/synthese/'),
          api.get('caisse/'),
          api.get('stock/')
        ]);
        
        setStats({
          clients: s.data.counts.clients,
          vehicles: s.data.counts.vehicles,
          repairs: s.data.counts.repairs_active,
          stockLow: s.data.counts.stock_low
        });

        setMaintenanceAlerts(m.data);
        setFinance(f.data);

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
    { label: "Nouvelle Réception", icon: PlusCircle, path: "/reception", color: "bg-emerald-600" },
    { label: "Créer un Devis", icon: FileText, path: "/devis", color: "bg-blue-600" },
    { label: "Enregistrer Dépense", icon: ArrowUpCircle, path: "/caisse", color: "bg-slate-700" },
    { label: "Ajouter Client", icon: Users, path: "/clients", color: "bg-indigo-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Tableau de Bord</h1>
          <p className="text-slate-500 font-medium">Gestion globale Luxury Elegance Garage</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-2 px-5 py-3 ${action.color} text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-1 active:scale-95`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 animate-in fade-in zoom-in-95 duration-1000 delay-100">
        <StatCard 
          label="Clients" 
          value={stats.clients} 
          icon={Users} 
          color="emerald" 
          onClick={() => navigate('/clients')} 
          loading={loading}
        />
        <StatCard 
          label="Véhicules" 
          value={stats.vehicles} 
          icon={Car} 
          color="emerald" 
          onClick={() => navigate('/vehicules')} 
          loading={loading}
        />
        <StatCard 
          label="En cours" 
          value={stats.repairs} 
          icon={Wrench} 
          color="orange" 
          onClick={() => navigate('/reparations')} 
          loading={loading}
        />
        <StatCard 
          label="Impayés" 
          value={`${finance.total_impayes.toLocaleString()} F`} 
          icon={AlertTriangle} 
          color={finance.total_impayes > 0 ? "red" : "emerald"} 
          onClick={() => navigate('/factures')} 
          loading={loading}
          isCurrency
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        {/* Main Content Area (Charts & Activity) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Revenue vs Expenses Chart */}
          <div className="card-luxury p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Performance Hebdomadaire</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Flux financier (Recettes vs Dépenses)</p>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recettes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dépenses</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                    tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  />
                  <Area type="monotone" dataKey="recettes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                  <Area type="monotone" dataKey="depenses" stroke="#cbd5e1" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance & Relances Area */}
          <div className="card-luxury overflow-hidden">
            <div className="px-10 py-8 border-b border-emerald-50/50 flex items-center justify-between bg-emerald-50/20">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                <Clock className="w-6 h-6 text-orange-500" />
                Relances & Maintenance
              </h2>
              <button onClick={() => navigate('/reparations')} className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:underline transition-all">Voir tout</button>
            </div>
            
            <div className="divide-y divide-emerald-50/30">
              {maintenanceAlerts.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <p className="font-black text-slate-900 uppercase text-sm tracking-widest">Tout est à jour</p>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Aucune relance prioritaire aujourd'hui.</p>
                </div>
              ) : (
                maintenanceAlerts.map(alert => (
                  <div key={`m-${alert.id}`} className="px-10 py-6 flex items-center justify-between hover:bg-emerald-50/30 transition-all duration-500 group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-600 shadow-sm transition-all duration-700">
                        <History className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-base uppercase tracking-tight">{alert.vehicule_plate}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Prochaine {alert.type_maintenance.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-emerald-600">Le {new Date(alert.date_prochaine_prevue).toLocaleDateString()}</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">{alert.km_prochain_prevu?.toLocaleString()} KM</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info (Finance & Stock) */}
        <div className="space-y-10">
          
          {/* Daily Finance Card */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group transition-all duration-700 hover:shadow-emerald-900/20">
            <div className="relative z-10">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3">
                <Wallet className="w-7 h-7 text-emerald-400" />
                Caisse du Jour
              </h2>
              
              <div className="space-y-8">
                <div className="transform transition-all duration-700 group-hover:translate-x-1">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Recettes</span>
                  </div>
                  <p className="text-4xl font-black text-emerald-400 italic">+{finance.recettes_jour.toLocaleString()} F</p>
                </div>

                <div className="transform transition-all duration-700 group-hover:translate-x-1 delay-75">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Dépenses</span>
                  </div>
                  <p className="text-4xl font-black text-rose-400 italic">-{finance.depenses_jour.toLocaleString()} F</p>
                </div>

                <div className="pt-8 border-t border-slate-800 transform transition-all duration-700 group-hover:translate-x-1 delay-150">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-2">Solde Global</span>
                      <p className="text-2xl font-black text-white">{finance.solde.toLocaleString()} F</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-slate-800 group-hover:text-emerald-500 transition-all duration-1000" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000" />
            <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-all duration-1000" />
          </div>

          {/* Stock Distribution Chart */}
          <div className="card-luxury p-10">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
              <Package className="w-6 h-6 text-emerald-500" />
              État du Stock
            </h2>
            
            <div className="h-[200px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stockPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/30">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Articles Sains</span>
                <span className="text-sm font-black text-emerald-700">85%</span>
              </div>
              <div onClick={() => navigate('/stock')} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 border border-rose-100/30 cursor-pointer hover:bg-rose-100 transition-all duration-500 group">
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Alertes Stock</span>
                <span className="text-sm font-black text-rose-700 group-hover:scale-110 transition-transform">{stats.stockLow}</span>
              </div>
            </div>
          </div>

          {/* Alert Message Box */}
          {finance.total_impayes > 0 && (
            <div className="bg-rose-600 text-white rounded-[2rem] p-10 shadow-2xl shadow-rose-200 animate-pulse-slow">
              <div className="flex items-start gap-6">
                <AlertTriangle className="w-10 h-10 text-rose-200" />
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Vigilance Trésorerie</h3>
                  <p className="text-sm font-medium text-rose-100 mt-2 leading-relaxed">
                    Attention : Vous avez <strong>{finance.total_impayes.toLocaleString()} F</strong> dehors. 
                    Relancez les factures impayées au plus vite pour maintenir la santé de votre caisse.
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
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white",
    orange: "bg-orange-50 text-orange-600 border-orange-100/50 group-hover:bg-orange-600 group-hover:text-white",
    red: "bg-rose-50 text-rose-600 border-rose-100/50 group-hover:bg-rose-600 group-hover:text-white",
  };

  const iconColorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-rose-100 text-rose-600",
  };

  return (
    <div 
      onClick={onClick} 
      className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-emerald-100/30 flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] hover:-translate-y-2 transition-all duration-700 cursor-pointer group relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${colorMap[color] || colorMap.emerald} shadow-sm group-hover:shadow-xl group-hover:shadow-emerald-900/20`}>
          <Icon className="w-8 h-8 transition-transform duration-700 group-hover:scale-110" />
        </div>
        {loading && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />}
      </div>
      <div className="relative z-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{label}</h3>
        <p className={`text-4xl font-black text-slate-900 tracking-tighter ${isCurrency && value !== '0 F' ? 'italic' : ''}`}>
          {value}
        </p>
      </div>
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-1000 ${iconColorMap[color] || iconColorMap.emerald}`}>
        <Icon className="w-full h-full p-6" />
      </div>
    </div>
  );
};

export default Dashboard;

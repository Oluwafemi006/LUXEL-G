import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    vehicles: 0,
    repairs: 0,
    stockLow: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [c, v, r, s] = await Promise.all([
          api.get('clients/'),
          api.get('vehicules/'),
          api.get('reparations/'),
          api.get('stock/')
        ]);
        setStats({
          clients: c.data.length,
          vehicles: v.data.length,
          repairs: r.data.filter((rep: any) => rep.statut === 'EN_COURS').length,
          stockLow: s.data.filter((item: any) => item.quantite < item.seuil_alerte).length
        });
      } catch (error) {
        console.error('Erreur stats dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Tableau de Bord</h1>
        <p className="text-lg text-on-surface-variant">Bienvenue dans votre système de gestion LUXEL-G.</p>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Clients */}
        <div 
          onClick={() => navigate('/clients')}
          className="bg-white p-6 rounded-xl shadow-sm border border-outline/10 flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined">group</span>
            </div>
            {loading && <span className="text-[10px] text-primary animate-pulse font-bold">Chargement...</span>}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Clients</h3>
            <p className="text-3xl font-bold text-on-surface">{stats.clients}</p>
          </div>
        </div>

        {/* Total Véhicules */}
        <div 
          onClick={() => navigate('/vehicules')}
          className="bg-white p-6 rounded-xl shadow-sm border border-outline/10 flex flex-col justify-between hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">directions_car</span>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Véhicules</h3>
            <p className="text-3xl font-bold text-on-surface">{stats.vehicles}</p>
          </div>
        </div>

        {/* Réparations Actives */}
        <div 
          onClick={() => navigate('/reparations')}
          className="bg-white p-6 rounded-xl shadow-sm border border-outline/10 flex flex-col justify-between hover:shadow-md hover:border-orange-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">build</span>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">En cours</h3>
            <p className="text-3xl font-bold text-on-surface">{stats.repairs}</p>
          </div>
        </div>

        {/* Alertes Stock */}
        <div 
          onClick={() => navigate('/stock')}
          className="bg-white p-6 rounded-xl shadow-sm border border-outline/10 flex flex-col justify-between hover:shadow-md hover:border-red-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${stats.stockLow > 0 ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Alertes Stock</h3>
            <p className={`text-3xl font-bold ${stats.stockLow > 0 ? 'text-red-600' : 'text-on-surface'}`}>{stats.stockLow}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-outline/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline/10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Réparations Récentes</h2>
            <button 
              onClick={() => navigate('/reparations')}
              className="text-sm font-semibold text-primary hover:text-primary-container transition-colors"
            >
              Voir tout
            </button>
          </div>
          <div className="p-12 text-center text-on-surface-variant">
             <span className="material-symbols-outlined text-4xl mb-4 block opacity-20">history</span>
             <p>Les activités récentes s'afficheront ici au fur et à mesure.</p>
          </div>
        </div>

        {/* Goals Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-outline/10 p-6">
            <h2 className="text-xl font-bold text-on-surface mb-4">Objectif du jour</h2>
            <div className="bg-primary text-on-primary p-6 rounded-xl shadow-inner relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-wider mb-1 opacity-90 font-bold">Terminer 8 réparations</p>
                <p className="text-2xl font-bold">Progression</p>
                <div className="mt-4 bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[15%] rounded-full transition-all duration-1000"></div>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-8xl">verified</span>
              </div>
            </div>
          </div>

          <div className="bg-on-surface text-white rounded-xl shadow-sm p-6 overflow-hidden relative">
            <h2 className="text-xl font-bold mb-4 relative z-10">Maintenance Système</h2>
            <div className="space-y-4 relative z-10">
              <p className="text-sm opacity-80">Tous les systèmes sont opérationnels. Base de données synchronisée.</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <span className="material-symbols-outlined text-8xl">check_circle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';

const Notifications: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Notifications</h1>
          <p className="text-lg text-on-surface-variant">Gérez les alertes système et l'historique des communications.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-outline/20 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrer
          </button>
          <button className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md active:scale-95 transition-all">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Tout marquer comme lu
          </button>
        </div>
      </div>

      {/* Dashboard Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline/10 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">outbox</span>
            </div>
            <span className="text-primary text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              12%
            </span>
          </div>
          <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider mb-1">Messages Envoyés</p>
          <h3 className="text-2xl font-bold text-on-surface">1,284</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline/10 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-orange-600 text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_down</span>
              5%
            </span>
          </div>
          <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider mb-1">Alertes Critiques</p>
          <h3 className="text-2xl font-bold text-on-surface">14</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline/10 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <span className="material-symbols-outlined">mark_email_read</span>
            </div>
            <span className="text-blue-600 text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">remove</span>
              0%
            </span>
          </div>
          <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider mb-1">Taux d'Ouverture</p>
          <h3 className="text-2xl font-bold text-on-surface">84.2%</h3>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-outline/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline/10 flex items-center justify-between bg-surface-container/10">
          <div className="flex gap-4">
            <button className="text-primary font-bold text-sm border-b-2 border-primary pb-1">Toutes les Notifications</button>
            <button className="text-on-surface-variant/60 font-bold text-sm hover:text-on-surface transition-colors pb-1">Alertes Système</button>
            <button className="text-on-surface-variant/60 font-bold text-sm hover:text-on-surface transition-colors pb-1">SMS Clients</button>
          </div>
          <div className="text-[10px] font-bold text-on-surface-variant/40 font-mono italic">Affichage de 42 entrées récentes</div>
        </div>
        <div className="divide-y divide-outline/10">
          {/* Notification Row 1: System Alert */}
          <div className="p-6 hover:bg-surface-container/20 transition-colors group cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Alerte Inventaire : Huile Moteur (5W-30)</h4>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 font-mono">Il y a 2 min</span>
                </div>
                <p className="text-sm text-on-surface-variant/80 mb-3">Le niveau de stock est tombé sous les 10 unités. Actuellement : 4 unités. Veuillez commander auprès du fournisseur 'Castrol Direct'.</p>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600">Priorité Haute</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant">Inventaire</span>
                  <button className="ml-auto text-[10px] font-bold text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Gérer le stock</button>
                </div>
              </div>
            </div>
          </div>
          {/* Notification Row 2: Customer Update */}
          <div className="p-6 hover:bg-surface-container/20 transition-colors group cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-surface-container"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Service Terminé : BMW X5 (ABC-1234)</h4>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 font-mono">Il y a 1 heure</span>
                </div>
                <p className="text-sm text-on-surface-variant/80 mb-3">Le client 'Jonathan Smith' a été notifié par SMS que son véhicule est prêt. Facture #INV-8821 générée.</p>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600">Succès</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant">Réparations</span>
                  <button className="ml-auto text-[10px] font-bold text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Voir Facture</button>
                </div>
              </div>
            </div>
          </div>
          {/* Notification Row 3: Scheduled Task */}
          <div className="p-6 hover:bg-surface-container/20 transition-colors group cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-surface-container"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Rappel de Visite Technique</h4>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 font-mono">Il y a 3 heures</span>
                </div>
                <p className="text-sm text-on-surface-variant/80 mb-3">L'inspection de sécurité du 'Pont Hydraulique 4' est prévue demain à 09:00. Assigné au Technicien : David R.</p>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600">À venir</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant">Maintenance</span>
                  <button className="ml-auto text-[10px] font-bold text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Voir Calendrier</button>
                </div>
              </div>
            </div>
          </div>
          {/* Notification Row 4: Customer Feedback */}
          <div className="p-6 hover:bg-surface-container/20 transition-colors group cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-surface-container"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Nouvel Avis Client</h4>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 font-mono">Il y a 5 heures</span>
                </div>
                <p className="text-sm text-on-surface-variant/80 mb-3">Sarah Connor a laissé un avis 5 étoiles : "Excellent service et prix transparents. Je reviendrai sans hésiter."</p>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-600">Avis</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant">Marketing</span>
                  <button className="ml-auto text-[10px] font-bold text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Répondre</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Pagination */}
        <div className="p-6 bg-surface-container/10 border-t border-outline/10 flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface-variant">Page 1 sur 4</span>
          <div className="flex gap-2">
            <button className="p-2 border border-outline/20 rounded-lg hover:bg-white transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 border border-outline/20 rounded-lg hover:bg-white transition-colors shadow-sm">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Info Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <span className="material-symbols-outlined text-6xl">push_pin</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">push_pin</span>
            Directives Épinglées
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
              </div>
              <p className="text-sm text-on-surface-variant font-medium">Toutes les alertes d'inventaire prioritaires doivent être acquittées sous 30 min par le superviseur.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
              </div>
              <p className="text-sm text-on-surface-variant font-medium">Les SMS clients sont automatiquement désactivés après 20h00 conformément à la politique de communication.</p>
            </li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline/10 shadow-sm">
          <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">query_stats</span>
            Distribution des Notifications
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-on-surface-variant">Taux de distribution SMS</span>
                <span className="font-mono text-primary">98.2%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[98%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-on-surface-variant">Taux de distribution Email</span>
                <span className="font-mono text-blue-600">94.5%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[94%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

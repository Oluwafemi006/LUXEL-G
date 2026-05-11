import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Car, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  MoreHorizontal,
  Mail,
  Smartphone,
  Info
} from 'lucide-react';
import api from '../services/api';

interface Appointment {
  id: number;
  client_name: string;
  vehicule_plate: string;
  date_rdv: string;
  service_demande: string;
  statut: string;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('appointments/');
      setAppointments(response.data);
    } catch (error) {
      console.error('Erreur RDV:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`appointments/${id}/`, { statut: status });
      fetchAppointments();
    } catch (error) {
      alert('Erreur mise à jour statut.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Agenda & RDV</h1>
          <p className="text-slate-500 font-medium">Gestion intelligente des flux de réception clients.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-[1.5rem] border border-emerald-100/50 shadow-sm">
           <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Calendar className="w-5 h-5" />
           </div>
           <div className="pr-6">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Aujourd'hui</p>
              <p className="text-sm font-black text-slate-900 uppercase">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
           </div>
        </div>
      </div>

      <div className="card-luxury overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/10 flex items-center justify-between">
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-800 ml-4">Liste des Rendez-vous</h2>
           <div className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{appointments.length} Sessions</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black border-b border-emerald-50/30">
                <th className="px-10 py-6">Date & Horaire</th>
                <th className="px-10 py-6">Client / Dossier</th>
                <th className="px-10 py-6">Type de Service</th>
                <th className="px-10 py-6">Statut</th>
                <th className="px-10 py-6 text-right">Pilotage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50/20">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="font-black text-emerald-600 uppercase text-[10px] tracking-widest">Lecture de l'agenda...</p>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center opacity-40 grayscale space-y-4">
                     <Calendar className="w-12 h-12 mx-auto text-slate-200" />
                     <p className="font-black uppercase tracking-[0.4em] text-[10px]">Aucun RDV programmé</p>
                  </td>
                </tr>
              ) : appointments.map((rdv) => (
                <tr key={rdv.id} className="hover:bg-emerald-50/30 transition-all duration-500 group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-3 shadow-inner transition-all duration-700">
                          <Clock className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                          <p className="text-xs font-black text-emerald-600 font-mono tracking-wider">{new Date(rdv.date_rdv).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-emerald-700 transition-colors duration-500">{rdv.client_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <Car className="w-3 h-3 text-emerald-500" />
                       <span className="text-[10px] font-black bg-slate-900 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                          {rdv.vehicule_plate || 'Nouveau Dossier'}
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-50 rounded-lg">
                          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                       </div>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{rdv.service_demande}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center w-fit gap-2 shadow-sm ${
                      rdv.statut === 'CONFIRME' ? 'bg-emerald-600 text-white shadow-emerald-200' : 
                      rdv.statut === 'ANNULE' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                      'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {rdv.statut === 'CONFIRME' ? <CheckCircle2 className="w-3 h-3" /> : rdv.statut === 'ANNULE' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {rdv.statut}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleUpdateStatus(rdv.id, 'CONFIRME')} 
                        className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-[1.25rem] border border-emerald-100 transition-all duration-500 shadow-sm hover:shadow-emerald-200 active:scale-90"
                        title="Confirmer la réception"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(rdv.id, 'ANNULE')} 
                        className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[1.25rem] border border-rose-100 transition-all duration-500 shadow-sm hover:shadow-rose-200 active:scale-90"
                        title="Annuler le rendez-vous"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <div className="h-10 w-px bg-emerald-50 mx-2"></div>
                      <button className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-[1.25rem] transition-all duration-500">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
         <div className="card-luxury p-8 bg-slate-900 text-white flex items-center gap-6 group overflow-hidden relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-emerald-500/30">
               <Smartphone className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Rappels Auto</p>
               <p className="text-sm font-medium opacity-80 leading-tight">SMS & WhatsApp de courtoisie envoyés la veille.</p>
            </div>
            <Smartphone className="absolute -right-6 -bottom-6 w-24 h-24 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
         </div>

         <div className="card-luxury p-8 flex items-center gap-6 group overflow-hidden relative bg-white">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center relative z-10 border border-blue-100">
               <Mail className="w-7 h-7 text-blue-500" />
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">E-mailing</p>
               <p className="text-sm font-medium text-slate-500 leading-tight">Confirmation de prise en charge par courriel.</p>
            </div>
            <Mail className="absolute -right-6 -bottom-6 w-24 h-24 text-blue-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
         </div>

         <div className="card-luxury p-8 flex items-center gap-6 group overflow-hidden relative bg-emerald-600 text-white shadow-emerald-200">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/30">
               <Info className="w-7 h-7 text-white" />
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Expertise Atelier</p>
               <p className="text-sm font-medium leading-tight">Liaison directe avec le planning technique.</p>
            </div>
            <Wrench className="absolute -right-6 -bottom-6 w-24 h-24 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
         </div>
      </div>
    </div>
  );
};

export default Appointments;

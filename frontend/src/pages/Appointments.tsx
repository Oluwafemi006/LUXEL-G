import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Car, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  Mail,
  Smartphone,
  Info,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CalendarDays
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
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('CALENDAR');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchAppointments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('appointments/');
      setAppointments(response.data);
    } catch (error) {
      console.error('Erreur RDV:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`appointments/${id}/`, { statut: status });
      fetchAppointments(true);
    } catch (error) {
      alert('Erreur mise à jour statut.');
    }
  };

  // Logique du Calendrier
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const hasAppointments = (day: number) => {
    return appointments.some(appt => {
      const d = new Date(appt.date_rdv);
      return d.getDate() === day && 
             d.getMonth() === currentDate.getMonth() && 
             d.getFullYear() === currentDate.getFullYear();
    });
  };

  const getFilteredAppointments = () => {
    if (!selectedDate) return appointments;
    return appointments.filter(appt => {
      const d = new Date(appt.date_rdv);
      return d.getDate() === selectedDate.getDate() && 
             d.getMonth() === selectedDate.getMonth() && 
             d.getFullYear() === selectedDate.getFullYear();
    });
  };

  const filteredAppts = getFilteredAppointments();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Agenda & RDV</h1>
          <p className="text-slate-500 font-medium">Gestion intelligente des flux de réception clients.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100/50 shadow-sm">
           <button 
             onClick={() => setViewMode('LIST')}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'LIST' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600'}`}
           >
              <LayoutList className="w-4 h-4" />
              Liste
           </button>
           <button 
             onClick={() => setViewMode('CALENDAR')}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'CALENDAR' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600'}`}
           >
              <CalendarDays className="w-4 h-4" />
              Calendrier
           </button>
        </div>
      </div>

      {viewMode === 'CALENDAR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in zoom-in-95 duration-700">
           {/* Calendar Grid */}
           <div className="lg:col-span-7 card-luxury p-8 bg-white h-fit">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                    {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                 </h2>
                 <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-emerald-50 rounded-xl transition-colors text-slate-400 hover:text-emerald-600"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-emerald-50 rounded-xl transition-colors text-slate-400 hover:text-emerald-600"><ChevronRight className="w-6 h-6" /></button>
                 </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                 {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">{day}</div>
                 ))}
                 {blanks.map(b => <div key={`b-${b}`} className="aspect-square" />)}
                 {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-500 border-2 ${
                        selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth() ? 'border-emerald-600 bg-emerald-50 shadow-inner' : 'border-transparent hover:bg-slate-50'
                      } ${isToday(day) ? 'bg-slate-900 text-white' : ''}`}
                    >
                       <span className={`text-sm font-black ${isToday(day) ? 'text-white' : 'text-slate-900'}`}>{day}</span>
                       {hasAppointments(day) && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isToday(day) ? 'bg-emerald-400' : 'bg-emerald-600'} animate-pulse`}></div>
                       )}
                    </button>
                 ))}
              </div>
           </div>

           {/* Side Details */}
           <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    {selectedDate ? `RDV du ${selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : "Tous les rendez-vous"}
                 </h3>
                 {selectedDate && (
                    <button onClick={() => setSelectedDate(null)} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Voir tout</button>
                 )}
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredAppts.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                       <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun rendez-vous</p>
                    </div>
                 ) : (
                    filteredAppts.map(appt => (
                       <div key={appt.id} className="bg-white p-6 rounded-xl border border-emerald-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-700">
                                   <Clock className="w-5 h-5" />
                                </div>
                                <span className="font-black text-slate-900 text-sm">{new Date(appt.date_rdv).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${appt.statut === 'CONFIRME' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                {appt.statut}
                             </span>
                          </div>
                          <p className="font-black text-slate-900 uppercase tracking-tight mb-2 truncate">{appt.client_name}</p>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{appt.service_demande}</span>
                             <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus(appt.id, 'CONFIRME')} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                                <button onClick={() => handleUpdateStatus(appt.id, 'ANNULE')} className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"><XCircle className="w-4 h-4" /></button>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      ) : (
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
                       <CalendarIcon className="w-12 h-12 mx-auto text-slate-200" />
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
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleUpdateStatus(rdv.id, 'CONFIRME')} 
                          className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-all duration-500 shadow-sm hover:shadow-emerald-200 active:scale-90"
                          title="Confirmer la réception"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(rdv.id, 'ANNULE')} 
                          className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-100 transition-all duration-500 shadow-sm hover:shadow-rose-200 active:scale-90"
                          title="Annuler le rendez-vous"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <div className="h-10 w-px bg-emerald-50 mx-2"></div>
                        <button className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-500">
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
      )}

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

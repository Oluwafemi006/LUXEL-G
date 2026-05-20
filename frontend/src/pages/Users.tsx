import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Edit, 
  ShieldCheck, 
  ShieldAlert, 
  Search,
  UserPlus
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'DIRECTEUR' | 'SECRETAIRE';
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'SECRETAIRE',
    password: ''
  });

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      role: 'SECRETAIRE',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Remove password if empty on update
        const data: any = { ...formData };
        if (!data.password) delete data.password;
        await api.patch(`users/${editingUser.id}/`, data);
      } else {
        await api.post('users/', formData);
      }
      setIsModalOpen(false);
      fetchUsers(true);
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur:', error);
      alert('Erreur lors de la sauvegarde de l\'utilisateur.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      try {
        await api.delete(`users/${id}/`);
        fetchUsers(true);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Gestion Utilisateurs</h1>
          <p className="text-slate-500 font-medium">Administrez les accès du personnel.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 transition-all duration-500 flex items-center gap-3"
        >
          <UserPlus className="w-4 h-4" /> Ajouter un utilisateur
        </button>
      </div>

      <div className="card-luxury overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
        <div className="p-6 border-b border-emerald-50/50 bg-emerald-50/10 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Rechercher par nom ou identifiant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white border border-emerald-100/50 rounded-2xl outline-none focus:border-emerald-500/50 transition-all duration-500 text-sm font-bold placeholder:text-slate-300 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black border-b border-emerald-50/30">
                <th className="px-8 py-5">Identifiant</th>
                <th className="px-8 py-5">Nom & Prénom</th>
                <th className="px-8 py-5">Email</th>
                <th className="px-8 py-5 text-center">Rôle</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50/20">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Chargement...</td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-emerald-50/30 transition-all duration-500">
                  <td className="px-8 py-6">
                    <p className="font-mono font-black text-emerald-600">@{user.username}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 uppercase tracking-tight">{user.last_name} {user.first_name}</p>
                  </td>
                  <td className="px-8 py-6 text-slate-500 font-medium italic">
                    {user.email}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${user.role === 'DIRECTEUR' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}>
                        {user.role === 'DIRECTEUR' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(user)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(user.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Identifiant</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm shadow-inner"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Rôle</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm shadow-inner"
              >
                <option value="SECRETAIRE">Secrétaire</option>
                <option value="DIRECTEUR">Directeur</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Nom</label>
              <input 
                type="text" 
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm shadow-inner"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Prénom</label>
              <input 
                type="text" 
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm shadow-inner"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm shadow-inner"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">{editingUser ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm shadow-inner"
              required={!editingUser}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all duration-500"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="flex-1 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all duration-700"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;

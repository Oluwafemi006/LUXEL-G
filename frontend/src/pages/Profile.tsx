import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { resolveMediaUrl } from '../services/api';
import {
  User, Camera, Lock, Save, CheckCircle2, AlertCircle, Eye, EyeOff
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Mot de passe
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      if (user.photo) setPhotoPreview(resolveMediaUrl(user.photo));
    }
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      if (photoFile) formData.append('photo', photoFile);
      await api.post('users/update-profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Profil mis à jour avec succès !');
      if (refreshUser) refreshUser();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (newPassword !== confirmPassword) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setChangingPwd(true);
    try {
      await api.post('users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwdSuccess('Mot de passe modifié avec succès !');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 3000);
    } catch (err: any) {
      const detail = err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Erreur lors du changement de mot de passe.';
      setPwdError(detail);
    } finally {
      setChangingPwd(false);
    }
  };

  const roleLabel = user?.role === 'DIRECTEUR' ? 'Directeur' : user?.role === 'SECRETAIRE' ? 'Secrétaire' : user?.role || 'Staff';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 font-bebas tracking-wider uppercase">Mon Profil</h1>
        <p className="text-sm text-slate-500 font-oswald uppercase tracking-widest mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* ── Carte Profil ── */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors shadow-md">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{firstName || lastName ? `${firstName} ${lastName}` : user?.username}</h2>
            <span className="inline-block mt-1 px-3 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Prénom</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nom</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Email (identifiant — non modifiable)</label>
          <input type="text" value={user?.email || user?.username || ''} disabled
            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-400 cursor-not-allowed" />
        </div>

        {error && <p className="mt-4 text-sm text-rose-600 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
        {success && <p className="mt-4 text-sm text-emerald-600 font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</p>}

        <button type="submit" disabled={saving}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-xl font-bebas tracking-widest uppercase text-sm hover:bg-emerald-700 transition-all disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
        </button>
      </form>

      {/* ── Changement de mot de passe ── */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Sécurité</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modifier votre mot de passe</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Ancien mot de passe</label>
            <div className="relative">
              <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 outline-none focus:border-amber-500 font-bold text-sm transition-all" />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nouveau mot de passe</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 outline-none focus:border-amber-500 font-bold text-sm transition-all" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-bold text-sm transition-all" />
          </div>
        </div>

        {pwdError && <p className="mt-4 text-sm text-rose-600 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{pwdError}</p>}
        {pwdSuccess && <p className="mt-4 text-sm text-emerald-600 font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{pwdSuccess}</p>}

        <button type="submit" disabled={changingPwd}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-amber-600 text-white rounded-xl font-bebas tracking-widest uppercase text-sm hover:bg-amber-700 transition-all disabled:opacity-50">
          <Lock className="w-4 h-4" />
          {changingPwd ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default Profile;

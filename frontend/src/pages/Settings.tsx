import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Building2, Save, CheckCircle2, AlertCircle, FileText,
  Phone, Mail, MapPin, Percent, Package, Wallet
} from 'lucide-react';

interface GarageSettingsData {
  nom_garage: string;
  ifu: string;
  rccm: string;
  adresse: string;
  telephone: string;
  email: string;
  logo: string | null;
  solde_ouverture_caisse: string;
  taux_tva_defaut: string;
  seuil_alerte_stock_defaut: number;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<GarageSettingsData>({
    nom_garage: '', ifu: '', rccm: '', adresse: '', telephone: '', email: '',
    logo: null, solde_ouverture_caisse: '0', taux_tva_defaut: '18.00', seuil_alerte_stock_defaut: 10,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [initialSolde, setInitialSolde] = useState('0');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('garage-settings/');
      setSettings(res.data);
      setInitialSolde(res.data.solde_ouverture_caisse || '0');
      if (res.data.logo) setLogoPreview(res.data.logo);
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof GarageSettingsData, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      Object.entries(settings).forEach(([key, value]) => {
        if (key === 'logo' || value === null || value === undefined) return;
        
        // N'envoyer le solde que s'il a été modifié
        if (key === 'solde_ouverture_caisse') {
          if (value !== initialSolde) {
            formData.append(key, String(value));
            formData.append('password', password);
          }
        } else {
          formData.append(key, String(value));
        }
      });
      if (logoFile) formData.append('logo', logoFile);

      await api.patch('garage-settings/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Paramètres enregistrés avec succès !');
      setInitialSolde(settings.solde_ouverture_caisse);
      setPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 font-bebas tracking-wider uppercase">Paramètres du Garage</h1>
        <p className="text-sm text-slate-500 font-oswald uppercase tracking-widest mt-1">Configuration générale</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Identité du Garage ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Identité du Garage</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informations légales et coordonnées</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nom du garage</label>
              <input type="text" value={settings.nom_garage} onChange={(e) => handleChange('nom_garage', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> IFU
                </label>
                <input type="text" value={settings.ifu || ''} onChange={(e) => handleChange('ifu', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> RCCM
                </label>
                <input type="text" value={settings.rccm || ''} onChange={(e) => handleChange('rccm', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Téléphone
                </label>
                <input type="text" value={settings.telephone || ''} onChange={(e) => handleChange('telephone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input type="email" value={settings.email || ''} onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Adresse
              </label>
              <textarea value={settings.adresse || ''} onChange={(e) => handleChange('adresse', e.target.value)} rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-sm transition-all resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Logo du garage</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1" />
                )}
                <label className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
                  <span className="text-xs font-bold text-slate-400">Choisir un fichier</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Paramètres Financiers ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Paramètres Financiers</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caisse, TVA et Alertes</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Solde d'ouverture caisse (FCFA)
              </label>
              <input type="number" value={settings.solde_ouverture_caisse} onChange={(e) => handleChange('solde_ouverture_caisse', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-bold text-sm transition-all" />
            </div>

            {settings.solde_ouverture_caisse !== initialSolde && (
              <div className="space-y-2 animate-fade-up">
                <label className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] ml-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Mot de passe requis
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Veuillez confirmer avec votre mot de passe"
                  className="w-full bg-amber-50 border border-amber-200 text-amber-900 placeholder:text-amber-400 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-bold text-sm transition-all" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Taux TVA par défaut (%)
                </label>
                <input type="number" step="0.01" value={settings.taux_tva_defaut} onChange={(e) => handleChange('taux_tva_defaut', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-bold text-sm transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Seuil d'alerte stock
                </label>
                <input type="number" value={settings.seuil_alerte_stock_defaut} onChange={(e) => handleChange('seuil_alerte_stock_defaut', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-bold text-sm transition-all" />
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
        {success && <p className="text-sm text-emerald-600 font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</p>}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-bebas tracking-widest uppercase text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20">
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </form>
    </div>
  );
};

export default Settings;

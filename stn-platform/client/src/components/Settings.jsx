import React, { useState } from 'react';
import { Lock, Check, AlertCircle, User as UserIcon, Shield } from 'lucide-react';
import { api } from '../api/client.js';

export default function Settings({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword.length < 4) {
      setError('Le nouveau mot de passe doit contenir au moins 4 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card bg-gradient-to-r from-stn-primary to-stn-dark text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Paramètres</h2>
            <p className="text-sm text-stn-light">Gestion du compte et sécurité</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <UserIcon size={20} className="text-stn-primary" />
          <h3 className="text-sm font-semibold text-gray-700">Informations du compte</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500">Identifiant</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{user?.username || '—'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500">Nom affiché</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{user?.display_name || '—'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500">Rôle</p>
            <p className="text-sm font-medium text-gray-800 mt-1 capitalize">{user?.role || '—'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Lock size={20} className="text-stn-primary" />
          <h3 className="text-sm font-semibold text-gray-700">Changer le mot de passe</h3>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-lg mb-4">
            <Check size={16} /> Mot de passe modifié avec succès
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="Entrez votre mot de passe actuel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="Entrez le nouveau mot de passe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Confirmez le nouveau mot de passe"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}

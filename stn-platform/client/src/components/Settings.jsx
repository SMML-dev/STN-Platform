import React, { useState } from 'react';
import {
  Lock, Check, AlertCircle, User as UserIcon, Shield,
  Trash2, AlertTriangle, RefreshCw, CheckCircle2, Database
} from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';

export default function Settings({ user }) {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Platform Reset state (Admin only)
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const isAdmin = user?.role === 'admin';

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

  const handleResetPlatform = async (e) => {
    e.preventDefault();
    if (resetConfirmText.trim().toUpperCase() !== 'REINITIALISER') {
      setResetError('Veuillez taper "REINITIALISER" pour confirmer');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await api.admin.reset();
      setResetSuccess(res.message || 'Plateforme réinitialisée avec succès.');
      setResetModalOpen(false);
      setResetConfirmText('');
    } catch (err) {
      setResetError(err.message || 'Erreur lors de la réinitialisation de la plateforme');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="card bg-gradient-to-r from-stn-primary to-stn-dark text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
            <p className="text-sm text-stn-light opacity-90">Gestion du compte, sécurité et administration</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <UserIcon size={20} className="text-stn-primary" />
          <h3 className="text-base font-semibold text-gray-800">Informations du compte</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Identifiant</p>
            <p className="text-sm font-semibold text-gray-800 mt-1 font-mono">{user?.username || '—'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Nom affiché</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{user?.display_name || '—'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Rôle</p>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-stn-primary'
              }`}>
                {isAdmin ? 'Administrateur' : 'Employé'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Lock size={20} className="text-stn-primary" />
          <h3 className="text-base font-semibold text-gray-800">Changer le mot de passe</h3>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
            <Check size={16} /> Mot de passe modifié avec succès
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4 border border-red-200">
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
              placeholder="Entrez le nouveau mot de passe (min 4 car.)"
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

      {/* Danger Zone: Reset Platform (Admin Only) */}
      {isAdmin && (
        <div className="card border-red-200 bg-red-50/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-900">Zone Critique : Réinitialisation de la Plateforme</h3>
              <p className="text-xs text-red-700">Réservé exclusivement aux administrateurs de la STN</p>
            </div>
          </div>

          {resetSuccess && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-3 mb-4">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">{resetSuccess}</p>
                <p className="text-xs text-green-700 mt-0.5">Une sauvegarde complète a été générée dans le répertoire des sauvegardes de sécurité.</p>
              </div>
            </div>
          )}

          {resetError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3 mb-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          <div className="bg-white rounded-xl p-5 border border-red-100 space-y-4">
            <div className="flex items-start gap-3">
              <Database size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Effet de la réinitialisation :</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Efface tous les bons de commande, réceptions, articles en stock et mouvements.</li>
                  <li>Efface tous les achats, factures, devis, charges fixes et travaux.</li>
                  <li>Efface les fournisseurs, familles et catégories.</li>
                  <li><strong>Préserve les comptes d'accès (utilisateurs et administrateurs).</strong></li>
                  <li><strong>Crée une sauvegarde automatique SQLite intégrale</strong> avant tout effacement.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                Cette opération ne peut être annulée sans restaurer un fichier de sauvegarde.
              </span>
              <button
                type="button"
                onClick={() => {
                  setResetConfirmText('');
                  setResetError('');
                  setResetModalOpen(true);
                }}
                className="btn-danger flex items-center gap-2 flex-shrink-0 justify-center shadow-sm"
              >
                <Trash2 size={16} />
                Réinitialiser la plateforme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmation Sécurisée de Réinitialisation */}
      <Modal
        open={resetModalOpen}
        onClose={() => !resetLoading && setResetModalOpen(false)}
        title="Confirmation critique de réinitialisation"
      >
        <form onSubmit={handleResetPlatform} className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-red-900">ATTENTION : Action irréversible</p>
              <p>
                Toutes les données opérationnelles seront purgées. Une copie de sécurité sera automatiquement enregistrée dans le dossier <code className="bg-red-100 px-1 py-0.5 rounded font-mono">server/backups</code>.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pour confirmer, tapez le mot <span className="font-mono text-red-600 font-bold">REINITIALISER</span> ci-dessous :
            </label>
            <input
              type="text"
              required
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              className="input-field font-mono uppercase text-center font-bold tracking-widest text-red-700 border-red-300 focus:ring-red-500"
              placeholder="REINITIALISER"
              autoFocus
            />
          </div>

          {resetError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={14} />
              {resetError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={resetLoading}
              onClick={() => setResetModalOpen(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={resetLoading || resetConfirmText.trim().toUpperCase() !== 'REINITIALISER'}
              className="btn-danger flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resetLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Réinitialisation en cours...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Confirmer la réinitialisation
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

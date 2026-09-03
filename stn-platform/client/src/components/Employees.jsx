import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, User, KeyRound, Edit2, Trash2,
  CheckCircle2, Search, AlertCircle, RefreshCw, Lock
} from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function Employees({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetPassUser, setResetPassUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    password: '',
    role: 'employe'
  });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setEmployees(data);
    } catch (err) {
      showNotification(err.message || 'Erreur de chargement des employes', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.display_name.trim() || !formData.password) {
      setError('Veuillez renseigner tous les champs obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      await api.users.create(formData);
      showNotification(`Employe "${formData.display_name}" cree avec succes.`);
      setCreateOpen(false);
      setFormData({ username: '', display_name: '', password: '', role: 'employe' });
      loadEmployees();
    } catch (err) {
      setError(err.message || "Erreur lors de la creation de l'employe");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    try {
      await api.users.update(editUser.id, {
        display_name: editUser.display_name,
        role: editUser.role,
        is_active: editUser.is_active
      });
      showNotification("Informations de l'employe mises a jour.");
      setEditUser(null);
      loadEmployees();
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise a jour');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassUser || !newPassword) return;
    if (newPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      await api.users.resetPassword(resetPassUser.id, newPassword);
      showNotification(`Mot de passe reinitialise pour "${resetPassUser.display_name || resetPassUser.username}".`);
      setResetPassUser(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Erreur lors de la reinitialisation du mot de passe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.users.remove(deleteUser.id);
      showNotification(`Employe "${deleteUser.display_name || deleteUser.username}" supprime.`);
      setDeleteUser(null);
      loadEmployees();
    } catch (err) {
      showNotification(err.message || 'Erreur lors de la suppression', true);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch =
      emp.username.toLowerCase().includes(search.toLowerCase()) ||
      (emp.display_name && emp.display_name.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? emp.is_active === 1 : emp.is_active === 0);
    return matchSearch && matchRole && matchStatus;
  });

  const totalAdmins = employees.filter(e => e.role === 'admin').length;
  const totalActive = employees.filter(e => e.is_active === 1).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-stn-primary via-stn-secondary to-stn-dark text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Gestion des Employes</h2>
              <p className="text-sm text-stn-light opacity-90">
                Creez, administrez les acces et gerez les roles du personnel STN
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadEmployees}
              className="p-2.5 rounded-lg bg-white bg-opacity-15 hover:bg-opacity-25 transition-all text-white"
              title="Rafraichir la liste"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => { setError(''); setCreateOpen(true); }}
              className="flex items-center gap-2 bg-white text-stn-primary hover:bg-stn-light px-4 py-2.5 rounded-lg font-semibold text-sm shadow transition-all transform active:scale-95"
            >
              <UserPlus size={18} />
              Nouvel Employe
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 border-l-4 border-l-stn-primary">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-stn-primary flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Personnel</p>
            <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Comptes Actifs</p>
            <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-indigo-600">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Administrateurs</p>
            <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou identifiant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
              <option value="ALL">Tous les roles</option>
              <option value="employe">Employe</option>
              <option value="admin">Administrateur</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="table-header">Employe</th>
                <th className="table-header">Identifiant</th>
                <th className="table-header">Role</th>
                <th className="table-header">Statut</th>
                <th className="table-header">Cree le</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-stn-primary" />
                    Chargement du personnel...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    Aucun employe trouve selon vos criteres.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const isCurrent = currentUser && currentUser.id === emp.id;
                  // L'admin principal est identifie par son username 'admin' (premier compte cree)
                  const isPrimaryAdmin = emp.username === 'admin';
                  const isAdmin = emp.role === 'admin';
                  // Les admins changent leur MDP dans Parametres — bouton masque pour eux
                  const canResetPassword = !isAdmin;
                  // Suppression bloquee : propre compte OU admin principal
                  const canDelete = !isCurrent && !isPrimaryAdmin;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin
                              ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                              : 'bg-blue-100 text-stn-primary'
                          }`}>
                            {emp.display_name ? emp.display_name.slice(0, 2).toUpperCase() : emp.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                              {emp.display_name || emp.username}
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-normal">
                                  Vous
                                </span>
                              )}
                              {isPrimaryAdmin && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                                  Principal
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">ID #{emp.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell font-mono text-xs text-gray-600">
                        {emp.username}
                      </td>

                      <td className="table-cell">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield size={12} />
                            Administrateur
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            <User size={12} />
                            Employe
                          </span>
                        )}
                      </td>

                      <td className="table-cell">
                        {emp.is_active === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Inactif
                          </span>
                        )}
                      </td>

                      <td className="table-cell text-xs text-gray-500">
                        {emp.created_at ? new Date(emp.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>

                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Modifier : toujours accessible */}
                          <button
                            onClick={() => { setError(''); setEditUser({ ...emp }); }}
                            className="p-1.5 text-gray-500 hover:text-stn-primary hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier les informations"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Reset MDP : masque pour tous les admins */}
                          {canResetPassword ? (
                            <button
                              onClick={() => { setError(''); setResetPassUser(emp); setNewPassword(''); }}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Reinitialiser le mot de passe"
                            >
                              <KeyRound size={16} />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg inline-flex"
                              title="Les administrateurs changent leur mot de passe dans Parametres"
                            >
                              <KeyRound size={16} />
                            </span>
                          )}

                          {/* Supprimer */}
                          <button
                            onClick={() => {
                              if (!canDelete) {
                                showNotification(
                                  isPrimaryAdmin
                                    ? "L'administrateur principal ne peut pas etre supprime."
                                    : 'Vous ne pouvez pas supprimer votre propre compte.',
                                  true
                                );
                                return;
                              }
                              setDeleteUser(emp);
                            }}
                            disabled={!canDelete}
                            className={`p-1.5 rounded-lg transition-colors ${
                              !canDelete
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              isPrimaryAdmin
                                ? "L'administrateur principal est protege et ne peut pas etre supprime"
                                : isCurrent
                                  ? 'Impossible de supprimer votre propre compte'
                                  : 'Supprimer cet employe'
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Creer un Nouvel Employe */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Creation d'un Nouvel Employe">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet / Affiche <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.display_name}
              onChange={e => setFormData({ ...formData, display_name: e.target.value })}
              className="input-field"
              placeholder="ex: Mamadou Diagne"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identifiant de connexion <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              className="input-field"
              placeholder="ex: mdiagne"
            />
            <p className="text-xs text-gray-400 mt-1">Identifiant unique utilise pour se connecter</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe initial <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="Au moins 4 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role sur la plateforme
            </label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
            >
              <option value="employe">Employe (Acces standard)</option>
              <option value="admin">Administrateur (Acces total + Journal d'audit)</option>
            </select>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting ? 'Creation en cours...' : "Creer l'employe"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Modifier un Employe */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Modifier l'employe: ${editUser?.username}`}
      >
        {editUser && (() => {
          const isPrimaryAdmin = editUser.username === 'admin';
          const isAdminTarget = editUser.role === 'admin';
          const isSelf = currentUser && currentUser.id === editUser.id;
          // Role verouille : propre compte OU admin principal modifie par quelqu'un d'autre
          const roleLocked = isSelf || (isPrimaryAdmin && !isSelf);
          // Statut verrouille : propre compte OU admin principal
          const statusLocked = isSelf || isPrimaryAdmin;
          return (
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Bandeau de protection pour l'admin principal */}
              {isPrimaryAdmin && !isSelf && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <Lock size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Le compte <strong>Administrateur Principal</strong> est protege. Seul son nom affiche peut etre modifie ici. Son statut, son role et son mot de passe sont verouilles.
                  </span>
                </div>
              )}
              {/* Bandeau informatif pour les autres admins */}
              {isAdminTarget && !isPrimaryAdmin && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
                  <Shield size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Ce compte est un <strong>Administrateur</strong>. La reinitialisation du mot de passe se fait uniquement depuis <strong>Parametres</strong>.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet / Affiche</label>
                <input
                  type="text"
                  required
                  value={editUser.display_name || ''}
                  onChange={e => setEditUser({ ...editUser, display_name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editUser.role}
                  disabled={roleLocked}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                  className="input-field disabled:bg-gray-100"
                >
                  <option value="employe">Employe</option>
                  <option value="admin">Administrateur</option>
                </select>
                {isSelf && <p className="text-xs text-amber-600 mt-1">Vous ne pouvez pas modifier votre propre role.</p>}
                {isPrimaryAdmin && !isSelf && <p className="text-xs text-amber-600 mt-1">Le role de l'administrateur principal est protege.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut du compte</label>
                <select
                  value={editUser.is_active}
                  disabled={statusLocked}
                  onChange={e => setEditUser({ ...editUser, is_active: parseInt(e.target.value, 10) })}
                  className="input-field disabled:bg-gray-100"
                >
                  <option value={1}>Actif (Connexion autorisee)</option>
                  <option value={0}>Inactif (Connexion bloquee)</option>
                </select>
                {isSelf && <p className="text-xs text-amber-600 mt-1">Vous ne pouvez pas desactiver votre propre compte.</p>}
                {isPrimaryAdmin && !isSelf && <p className="text-xs text-amber-600 mt-1">Le statut de l'administrateur principal ne peut pas etre modifie.</p>}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Modal: Reinitialiser le mot de passe (employes uniquement) */}
      <Modal
        open={!!resetPassUser}
        onClose={() => setResetPassUser(null)}
        title="Reinitialisation du mot de passe"
      >
        {resetPassUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
              <Lock size={14} className="text-blue-600 flex-shrink-0" />
              <span>
                Definition d'un nouveau mot de passe pour <strong>{resetPassUser.display_name || resetPassUser.username}</strong> ({resetPassUser.username}).
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={4}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Nouveau mot de passe (min 4 car.)"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button type="button" onClick={() => setResetPassUser(null)} className="btn-secondary">Annuler</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Mise a jour...' : 'Confirmer le mot de passe'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Suppression */}
      <ConfirmDialog
        open={!!deleteUser}
        title="Supprimer l'employe"
        message={`Voulez-vous vraiment supprimer definitivement le compte de "${deleteUser?.display_name || deleteUser?.username}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer definitivement"
        cancelLabel="Annuler"
        onConfirm={handleDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}

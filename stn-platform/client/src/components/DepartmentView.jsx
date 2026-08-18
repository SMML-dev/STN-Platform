import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import EtatBadge from './EtatBadge.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const etatOptions = [
  'en attente', 'validé', 'en cours', 'soldé', 'livré', 'validé et acquis',
  'en attente de livraison', 'Tarif à renegocier'
];

function ChargesSection({ department }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ charge_name: '', quantite: '', prix_previsionnel: '', fournisseur: '', delai_livraison: '', etat: 'en attente' });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = () => {
    api.charges.list(department).then(data => { setItems(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [department]);

  const openAdd = () => { setForm({ charge_name: '', quantite: '', prix_previsionnel: '', fournisseur: '', delai_livraison: '', etat: 'en attente' }); setEditId(null); setModalOpen(true); };
  const openEdit = (item) => { setForm(item); setEditId(item.id); setModalOpen(true); };

  const save = () => {
    if (!form.charge_name.trim()) return;
    const data = {
      ...form,
      department,
      quantite: form.quantite === '' ? 0 : parseInt(form.quantite),
      prix_previsionnel: form.prix_previsionnel === '' ? 0 : parseFloat(form.prix_previsionnel)
    };
    if (editId) {
      api.charges.update(editId, data).then(() => { load(); setModalOpen(false); });
    } else {
      api.charges.create(data).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (item) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer la charge fixe',
      message: `Voulez-vous vraiment supprimer la charge "${item.charge_name}" ?`,
      onConfirm: () => {
        api.charges.remove(item.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  return (
    <div className="card overflow-hidden p-0">
      <div className="bg-stn-primary text-white px-5 py-3 flex items-center justify-between">
        <h3 className="font-semibold">Prévision Approvisionnement Fixe Fonctionnel</h3>
        <button onClick={openAdd} className="bg-white text-stn-primary px-3 py-1 rounded-lg text-sm font-medium hover:bg-stn-light flex items-center gap-1">
          <Plus size={16} /> Ajouter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="table-header">Charges Fixes Fonctionnelles</th>
              <th className="table-header">Quantité</th>
              <th className="table-header">Prix Prévisionnel</th>
              <th className="table-header">Total</th>
              <th className="table-header">Fournisseur</th>
              <th className="table-header">Délai Livraison</th>
              <th className="table-header">État</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="8" className="text-center py-6 text-gray-400">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-6 text-gray-400">Aucune charge enregistrée</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{item.charge_name}</td>
                <td className="table-cell">{item.quantite}</td>
                <td className="table-cell">{fmt(item.prix_previsionnel)}</td>
                <td className="table-cell font-semibold">{fmt(item.quantite * item.prix_previsionnel)}</td>
                <td className="table-cell">{item.fournisseur || '—'}</td>
                <td className="table-cell">{item.delai_livraison || '—'}</td>
                <td className="table-cell"><EtatBadge etat={item.etat} /></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Modifier"><Pencil size={16} /></button>
                    <button onClick={() => remove(item)} className="text-red-500 hover:text-red-700" title="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier la charge' : 'Ajouter une charge'} onSave={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Charge fixe fonctionnelle</label>
            <input type="text" value={form.charge_name} onChange={e => setForm({...form, charge_name: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input type="number" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value === '' ? '' : parseInt(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix prévisionnel</label>
            <input type="number" value={form.prix_previsionnel} onChange={e => setForm({...form, prix_previsionnel: e.target.value === '' ? '' : parseFloat(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
            <input type="text" value={form.fournisseur} onChange={e => setForm({...form, fournisseur: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Délai de livraison</label>
            <input type="text" value={form.delai_livraison} onChange={e => setForm({...form, delai_livraison: e.target.value})} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select value={form.etat} onChange={e => setForm({...form, etat: e.target.value})} className="input-field">
              {etatOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.open}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger={true}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}

function OrdersSection({ department }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ article: '', quantite: '', prix: '', delai_livraison: '', etat: 'en attente' });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = () => {
    api.orders.list(department).then(data => { setItems(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [department]);

  const openAdd = () => { setForm({ article: '', quantite: '', prix: '', delai_livraison: '', etat: 'en attente' }); setEditId(null); setModalOpen(true); };
  const openEdit = (item) => { setForm(item); setEditId(item.id); setModalOpen(true); };

  const save = () => {
    if (!form.article.trim()) return;
    const data = {
      ...form,
      department,
      quantite: form.quantite === '' ? 0 : parseInt(form.quantite),
      prix: form.prix === '' ? 0 : parseFloat(form.prix)
    };
    if (editId) {
      api.orders.update(editId, data).then(() => { load(); setModalOpen(false); });
    } else {
      api.orders.create(data).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (item) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer la commande',
      message: `Voulez-vous vraiment supprimer la commande à prévoir pour "${item.article}" ?`,
      onConfirm: () => {
        api.orders.remove(item.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  return (
    <div className="card overflow-hidden p-0">
      <div className="bg-stn-secondary text-white px-5 py-3 flex items-center justify-between">
        <h3 className="font-semibold">Commandes à Prévoir</h3>
        <button onClick={openAdd} className="bg-white text-stn-secondary px-3 py-1 rounded-lg text-sm font-medium hover:bg-stn-light flex items-center gap-1">
          <Plus size={16} /> Ajouter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="table-header">Article</th>
              <th className="table-header">Quantité</th>
              <th className="table-header">Prix</th>
              <th className="table-header">Total</th>
              <th className="table-header">Délai Livraison</th>
              <th className="table-header">État</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-6 text-gray-400">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-6 text-gray-400">Aucune commande enregistrée</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{item.article}</td>
                <td className="table-cell">{item.quantite}</td>
                <td className="table-cell">{fmt(item.prix)}</td>
                <td className="table-cell font-semibold">{fmt(item.quantite * item.prix)}</td>
                <td className="table-cell">{item.delai_livraison || '—'}</td>
                <td className="table-cell"><EtatBadge etat={item.etat} /></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Modifier"><Pencil size={16} /></button>
                    <button onClick={() => remove(item)} className="text-red-500 hover:text-red-700" title="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier la commande' : 'Ajouter une commande'} onSave={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
            <input type="text" value={form.article} onChange={e => setForm({...form, article: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input type="number" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value === '' ? '' : parseInt(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
            <input type="number" value={form.prix} onChange={e => setForm({...form, prix: e.target.value === '' ? '' : parseFloat(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Délai de livraison</label>
            <input type="text" value={form.delai_livraison} onChange={e => setForm({...form, delai_livraison: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select value={form.etat} onChange={e => setForm({...form, etat: e.target.value})} className="input-field">
              {etatOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.open}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger={true}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}

function WorksSection({ department }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ domaine: '', fournisseur: '', etat: 'en attente' });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = () => {
    api.works.list(department).then(data => { setItems(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [department]);

  const openAdd = () => { setForm({ domaine: '', fournisseur: '', etat: 'en attente' }); setEditId(null); setModalOpen(true); };
  const openEdit = (item) => { setForm(item); setEditId(item.id); setModalOpen(true); };

  const save = () => {
    if (!form.domaine.trim()) return;
    const data = { ...form, department };
    if (editId) {
      api.works.update(editId, data).then(() => { load(); setModalOpen(false); });
    } else {
      api.works.create(data).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (item) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer le travail / réparation',
      message: `Voulez-vous vraiment supprimer la ligne "${item.domaine}" ?`,
      onConfirm: () => {
        api.works.remove(item.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  return (
    <div className="card overflow-hidden p-0">
      <div className="bg-stn-accent text-white px-5 py-3 flex items-center justify-between">
        <h3 className="font-semibold">Travaux et Réparations</h3>
        <button onClick={openAdd} className="bg-white text-stn-accent px-3 py-1 rounded-lg text-sm font-medium hover:bg-stn-light flex items-center gap-1">
          <Plus size={16} /> Ajouter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="table-header">Domaine</th>
              <th className="table-header">Fournisseur</th>
              <th className="table-header">État</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-6 text-gray-400">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-6 text-gray-400">Aucun travail enregistré</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{item.domaine}</td>
                <td className="table-cell">{item.fournisseur || '—'}</td>
                <td className="table-cell"><EtatBadge etat={item.etat} /></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Modifier"><Pencil size={16} /></button>
                    <button onClick={() => remove(item)} className="text-red-500 hover:text-red-700" title="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier le travail' : 'Ajouter un travail'} onSave={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
            <input type="text" value={form.domaine} onChange={e => setForm({...form, domaine: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
            <input type="text" value={form.fournisseur} onChange={e => setForm({...form, fournisseur: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select value={form.etat} onChange={e => setForm({...form, etat: e.target.value})} className="input-field">
              {etatOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.open}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger={true}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}

export default function DepartmentView({ department, showWorks = false }) {
  return (
    <div className="space-y-6">
      <ChargesSection department={department} />
      <OrdersSection department={department} />
      {showWorks && <WorksSection department={department} />}
    </div>
  );
}


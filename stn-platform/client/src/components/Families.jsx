import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const emptyForm = { name: '' };

export default function Families() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = () => {
    api.families.list().then(data => { setItems(data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModalOpen(true); };
  const openEdit = (item) => {
    setForm({ name: item.name });
    setEditId(item.id);
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editId) {
      api.families.update(editId, form).then(() => { load(); setModalOpen(false); });
    } else {
      api.families.create(form).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (family) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer la famille',
      message: `Voulez-vous vraiment supprimer la famille "${family.name}" ?`,
      onConfirm: () => {
        api.families.remove(family.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        }).catch(err => {
          alert(err.message || 'Erreur lors de la suppression');
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Package size={24} className="text-stn-primary" />
          Familles des Articles
        </h2>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Ajouter une famille
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-8 text-gray-400">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">Aucune famille enregistrée</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header">Nom de la famille</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{f.name}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(f)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => remove(f)} className="text-red-500 hover:text-red-700" title="Supprimer">
                          <Trash2 size={16} />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier la famille' : 'Ajouter une famille'} onSave={save}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la famille</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="ex: Matériel informatique, Mobilier de bureau..." />
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


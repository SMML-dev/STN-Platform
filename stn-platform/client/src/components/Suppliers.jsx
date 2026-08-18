import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const emptyForm = { name: '', contact: '', category_id: '', commentaires: '' };

export default function Suppliers() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newCategory, setNewCategory] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const load = () => {
    api.suppliers.list().then(data => { setItems(data); setLoading(false); });
    api.suppliers.categories().then(setCategories);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModalOpen(true); };
  const openEdit = (item) => {
    setForm({ name: item.name, contact: item.contact || '', category_id: item.category_id || '', commentaires: item.commentaires || '' });
    setEditId(item.id);
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const data = { ...form, category_id: form.category_id || null };
    if (editId) {
      api.suppliers.update(editId, data).then(() => { load(); setModalOpen(false); });
    } else {
      api.suppliers.create(data).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (supplier) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer le fournisseur',
      message: `Voulez-vous vraiment supprimer le fournisseur "${supplier.name}" ? Cette action est irréversible.`,
      onConfirm: () => {
        api.suppliers.remove(supplier.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  const saveCategory = () => {
    if (!newCategory.trim()) return;
    api.suppliers.createCategory({ name: newCategory }).then(() => {
      setNewCategory('');
      setCatModalOpen(false);
      load();
    });
  };

  const removeCategory = (category) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer la catégorie',
      message: `Voulez-vous vraiment supprimer la catégorie "${category.name}" ? Les fournisseurs associés basculeront automatiquement en "Non classé".`,
      onConfirm: () => {
        api.suppliers.removeCategory(category.id).then(() => {
          load();
          if (categoryFilter === String(category.id)) {
            setCategoryFilter('');
          }
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  const filteredItems = items.filter(item => {
    if (!categoryFilter) return true;
    if (categoryFilter === 'unclassified') return !item.category_id;
    return String(item.category_id) === categoryFilter;
  });

  const groupedByCategory = filteredItems.reduce((acc, item) => {
    const cat = item.category_name || 'Non classé';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCatModalOpen(true)} className="btn-secondary flex items-center gap-2 flex-shrink-0">
            <Tag size={18} /> Gérer les catégories
          </button>
          
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)} 
            className="input-field w-64"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="unclassified">Non classé</option>
          </select>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 sm:self-auto self-start">
          <Plus size={18} /> Ajouter un fournisseur
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-8 text-gray-400">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">Aucun fournisseur enregistré</div>
      ) : filteredItems.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">Aucun fournisseur trouvé pour cette catégorie</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([catName, suppliers]) => (
            <div key={catName} className="card p-0 overflow-hidden">
              <div className="bg-stn-primary text-white px-5 py-3 flex items-center justify-between">
                <h3 className="font-semibold">{catName}</h3>
                <span className="text-sm text-stn-light">{suppliers.length} fournisseur(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="table-header">Nom</th>
                      <th className="table-header">Contact</th>
                      <th className="table-header">Commentaires</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {suppliers.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">{s.name}</td>
                        <td className="table-cell">{s.contact || '—'}</td>
                        <td className="table-cell">{s.commentaires || '—'}</td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => remove(s)} className="text-red-500 hover:text-red-700" title="Supprimer">
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
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'} onSave={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fournisseur</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <input type="text" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="input-field" placeholder="ex: CC: Kuna 706370568" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="input-field">
              <option value="">— Sélectionner —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
            <textarea value={form.commentaires} onChange={e => setForm({...form, commentaires: e.target.value})} className="input-field" rows="2" />
          </div>
        </div>
      </Modal>

      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title="Gérer les catégories" onSave={saveCategory} saveLabel="Ajouter la catégorie">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle catégorie</label>
            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-field" placeholder="ex: MOBLIERS BUREAU, HUILE..." />
          </div>
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{c.name}</span>
                <button onClick={() => removeCategory(c)} className="text-red-500 hover:text-red-700" title="Supprimer la catégorie">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-gray-400 text-sm">Aucune catégorie enregistrée</p>}
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


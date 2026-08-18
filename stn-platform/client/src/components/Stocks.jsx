import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Settings, Bell, Search } from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import EtatBadge from './EtatBadge.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const emptyForm = { matiere: '', quantite: '', prix: '', disponibilite: 'indisponible', family_id: '' };

export default function Stocks() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [defaultThreshold, setDefaultThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [alertLoading, setAlertLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [families, setFamilies] = useState([]);
  const [search, setSearch] = useState('');
  const [disponibiliteFilter, setDisponibiliteFilter] = useState('');
  const [threshold, setThreshold] = useState(5);
  const [newDefault, setNewDefault] = useState(5);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = () => {
    api.stocks.list().then(data => { setItems(data); setLoading(false); });
    api.families.list().then(setFamilies);
    loadAlerts();
  };

  const loadAlerts = () => {
    setAlertLoading(true);
    api.alerts.list().then(data => { setAlerts(data); });
    api.alerts.all().then(data => {
      setDefaultThreshold(data.defaultThreshold || 5);
      setNewDefault(data.defaultThreshold || 5);
      setAlertLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModalOpen(true); };
  const openEdit = (item) => { setForm(item); setEditId(item.id); setModalOpen(true); };

  const save = () => {
    if (!form.matiere.trim()) return;
    const { observation, ...rest } = form;
    const data = {
      ...rest,
      quantite: form.quantite === '' ? 0 : parseInt(form.quantite),
      prix: form.prix === '' ? 0 : parseFloat(form.prix)
    };
    if (editId) {
      api.stocks.update(editId, data).then(() => { load(); setModalOpen(false); });
    } else {
      api.stocks.create(data).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (item) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer l\'article',
      message: `Voulez-vous vraiment supprimer l'article "${item.matiere}" du stock ?`,
      onConfirm: () => {
        api.stocks.remove(item.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
  const totalValue = items.reduce((s, i) => s + (i.quantite * i.prix), 0);
  const filtered = items.filter(i => {
    const matchesSearch = !search || i.matiere?.toLowerCase().includes(search.toLowerCase()) || i.family_name?.toLowerCase().includes(search.toLowerCase());
    const matchesDispo = !disponibiliteFilter || i.disponibilite === disponibiliteFilter;
    return matchesSearch && matchesDispo;
  });

  const openSettings = (stock) => {
    setSelectedStock(stock);
    setThreshold(stock.threshold);
    setSettingsOpen(true);
  };

  const saveThreshold = () => {
    if (!selectedStock) return;
    const value = threshold === '' ? 0 : parseInt(threshold);
    api.alerts.setThreshold({ stock_id: selectedStock.id, threshold: value }).then(() => {
      loadAlerts();
      setSettingsOpen(false);
    });
  };

  const saveDefaultThreshold = () => {
    const value = newDefault === '' ? 0 : parseInt(newDefault);
    api.alerts.setDefaultThreshold(value).then(() => {
      setDefaultThreshold(value);
      setDefaultOpen(false);
      loadAlerts();
    });
  };

  const thresholdFor = (item) => item.threshold || defaultThreshold;
  const isAlert = (item) => item.quantite <= thresholdFor(item);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="card py-3 px-5">
            <p className="text-xs text-gray-500">Valeur totale du stock</p>
            <p className="text-xl font-bold text-stn-primary">{fmt(totalValue)} FCFA</p>
          </div>
          <div className="card py-3 px-5">
            <p className="text-xs text-gray-500">Articles en stock</p>
            <p className="text-xl font-bold text-stn-primary">{items.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 w-64"
            />
          </div>
          <select value={disponibiliteFilter} onChange={e => setDisponibiliteFilter(e.target.value)} className="input-field w-44">
            <option value="">Toutes dispo.</option>
            <option value="disponible">Disponible</option>
            <option value="indisponible">Indisponible</option>
          </select>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Ajouter au stock
          </button>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Bell size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Alertes de Rupture de Stock</h2>
              <p className="text-sm text-white text-opacity-90">{alerts.length} article(s) en seuil critique</p>
            </div>
          </div>
          <button onClick={() => setDefaultOpen(true)} className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Settings size={16} /> Seuil par défaut: {defaultThreshold}
          </button>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Alertes actives</h3>
          {alerts.map(alert => (
            <div key={alert.id} className="card border-l-4 border-l-red-500 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="text-red-500" />
                  <div>
                    <p className="font-semibold text-gray-800">{alert.matiere}</p>
                    <p className="text-sm text-gray-600">
                      Quantité restante: <strong className="text-red-600">{alert.quantite}</strong> / Seuil: {alert.threshold}
                    </p>
                  </div>
                </div>
                <button onClick={() => openSettings(alert)} className="btn-secondary flex items-center gap-2">
                  <Settings size={16} /> Ajuster le seuil
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !alertLoading && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Aucune alerte de rupture</p>
          <p className="text-sm text-gray-400 mt-1">Tous les stocks sont au-dessus du seuil critique</p>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header">Matière</th>
                <th className="table-header">Famille</th>
                <th className="table-header">Quantité</th>
                <th className="table-header">Prix unitaire</th>
                <th className="table-header">Valeur totale</th>
                <th className="table-header">Disponibilité</th>
                <th className="table-header">Seuil</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">Aucun article en stock</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">Aucun résultat</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className={isAlert(item) ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="table-cell font-medium flex items-center gap-2">
                    {isAlert(item) && <AlertTriangle size={16} className="text-red-500" />}
                    {item.matiere}
                  </td>
                  <td className="table-cell text-sm text-gray-600">{item.family_name || '—'}</td>
                  <td className="table-cell">{item.quantite}</td>
                  <td className="table-cell">{fmt(item.prix)}</td>
                  <td className="table-cell font-semibold">{fmt(item.quantite * item.prix)}</td>
                  <td className="table-cell"><EtatBadge etat={item.disponibilite} /></td>
                  <td className="table-cell">
                    <button onClick={() => openSettings(item)} className="text-stn-secondary hover:text-stn-primary text-sm flex items-center gap-1">
                      <Settings size={14} /> {thresholdFor(item)}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(item)} className="text-red-500 hover:text-red-700" title="Supprimer">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier l\'article' : 'Ajouter au stock'} onSave={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Famille des articles</label>
            <select value={form.family_id} onChange={e => setForm({...form, family_id: e.target.value})} className="input-field">
              <option value="">— Sélectionner —</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
            <input type="text" value={form.matiere} onChange={e => setForm({...form, matiere: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input type="number" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value === '' ? '' : parseInt(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
            <input type="number" value={form.prix} onChange={e => setForm({...form, prix: e.target.value === '' ? '' : parseFloat(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
            <select value={form.disponibilite} onChange={e => setForm({...form, disponibilite: e.target.value})} className="input-field">
              <option value="disponible">Disponible</option>
              <option value="indisponible">Indisponible</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Ajuster le seuil d'alerte" onSave={saveThreshold}>
        {selectedStock && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedStock.matiere}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité actuelle</label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedStock.quantite}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte (quantité minimale)</label>
              <input type="number" value={threshold} onChange={e => setThreshold(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-field" />
              <p className="text-xs text-gray-400 mt-1">Seuil par défaut actuel: {defaultThreshold}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={defaultOpen} onClose={() => setDefaultOpen(false)} title="Seuil d'alerte par défaut" onSave={saveDefaultThreshold}>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">Le seuil par défaut s'applique automatiquement à tous les articles qui n'ont pas de seuil personnalisé.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil par défaut (quantité minimale)</label>
            <input type="number" value={newDefault} onChange={e => setNewDefault(e.target.value === '' ? '' : parseInt(e.target.value))} className="input-field" />
            <p className="text-xs text-gray-400 mt-1">Tous les nouveaux stocks utiliseront ce seuil automatiquement</p>
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

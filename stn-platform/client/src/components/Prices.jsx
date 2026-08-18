import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Globe, MapPin, TrendingDown, Award, ExternalLink, Search, BarChart3 } from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import DatePicker from './DatePicker.jsx';
import { fmtDate } from '../utils/dateUtils.js';

const emptyForm = { designation: '', supplier_name: '', scope: 'national', price: '', currency: 'FCFA', market_url: '', product_url: '', recorded_date: new Date().toISOString().split('T')[0] };

export default function Prices() {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('comparison');
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = () => {
    setLoading(true);
    api.prices.compare().then(data => {
      setComparisons(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = (preset = {}) => {
    setForm({ ...emptyForm, ...preset, recorded_date: new Date().toISOString().split('T')[0] });
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      designation: item.designation,
      supplier_name: item.supplier_name,
      scope: item.scope || 'national',
      price: item.price,
      currency: item.currency || 'FCFA',
      market_url: item.market_url || '',
      product_url: item.product_url || '',
      recorded_date: item.recorded_date || new Date().toISOString().split('T')[0]
    });
    setEditId(item.id);
    setModalOpen(true);
  };

  const save = () => {
    if (!form.designation.trim() || !form.supplier_name.trim()) return;
    const data = {
      ...form,
      price: form.price === '' ? 0 : parseFloat(form.price)
    };
    if (editId) {
      api.prices.update(editId, data).then(() => { load(); setModalOpen(false); });
    } else {
      api.prices.create(data).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (priceItem) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer le prix',
      message: `Voulez-vous vraiment supprimer le prix de "${priceItem.supplier_name}" pour "${priceItem.designation}" (${fmt(priceItem.price)} ${priceItem.currency}) ?`,
      onConfirm: () => {
        api.prices.remove(priceItem.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  const filtered = comparisons.filter(c => {
    if (filterDesignation && c.designation !== filterDesignation) return false;
    if (filterScope && c.prices.length > 0) {
      if (!c.prices.some(p => p.scope === filterScope)) return false;
    }
    if (search && !c.designation.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSavings = filtered.reduce((s, c) => s + (c.potentialSavings || 0), 0);
  const totalProducts = filtered.length;
  const totalSuppliers = filtered.reduce((s, c) => s + (c.supplierCount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Produits suivis</p><p className="text-2xl font-bold text-gray-800">{totalProducts}</p></div>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white"><BarChart3 size={20} /></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Vendeurs référencés</p><p className="text-2xl font-bold text-gray-800">{totalSuppliers}</p></div>
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white"><Globe size={20} /></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Économies potentielles</p><p className="text-2xl font-bold text-green-600">{fmt(totalSavings)} FCFA</p></div>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white"><TrendingDown size={20} /></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Meilleur prix moyen</p><p className="text-2xl font-bold text-stn-primary">
              {fmt(filtered.length ? Math.round(filtered.reduce((s, c) => s + (c.bestPrice?.price || 0), 0) / filtered.length) : 0)} FCFA
            </p></div>
            <div className="w-10 h-10 bg-stn-primary rounded-lg flex items-center justify-center text-white"><Award size={20} /></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">Rechercher un produit</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-8" placeholder="Nom du produit..." />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Produit</label>
            <select value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)} className="input-field w-48">
              <option value="">Tous</option>
              {comparisons.map(c => <option key={c.designation} value={c.designation}>{c.designation}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Portée</label>
            <select value={filterScope} onChange={e => setFilterScope(e.target.value)} className="input-field w-40">
              <option value="">Toutes</option>
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Enregistrer un prix
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400">Chargement des comparatifs...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 font-medium">Aucun prix enregistré</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur "Enregistrer un prix" pour commencer le comparatif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((comp) => (
            <div key={comp.designation} className="card overflow-hidden p-0">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedProduct(expandedProduct === comp.designation ? null : comp.designation)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${comp.supplierCount > 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Award size={20} className={comp.supplierCount > 1 ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{comp.designation}</p>
                    <p className="text-xs text-gray-500">{comp.supplierCount} vendeur(s) · Meilleur: {fmt(comp.bestPrice?.price)} {comp.bestPrice?.currency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {comp.potentialSavings > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Économie max</p>
                      <p className="text-sm font-bold text-green-600">{fmt(comp.potentialSavings)} {comp.bestPrice?.currency}</p>
                      <p className="text-xs text-green-500">-{comp.savingsPercent}%</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Prix moyen</p>
                    <p className="text-sm font-semibold text-gray-700">{fmt(comp.avgPrice)} {comp.bestPrice?.currency}</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-gray-400 transition-transform ${expandedProduct === comp.designation ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {expandedProduct === comp.designation && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="table-header">Vendeur / Marché</th>
                          <th className="table-header">Portée</th>
                          <th className="table-header">Prix</th>
                          <th className="table-header">Écart vs meilleur</th>
                          <th className="table-header">Date</th>
                          <th className="table-header">Lien</th>
                          <th className="table-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {comp.prices.map((p) => (
                          <tr key={p.id} className={p.is_best ? 'bg-green-50' : 'hover:bg-white'}>
                            <td className="table-cell font-medium">
                              {p.is_best && <Award size={14} className="inline mr-1 text-green-600" />}
                              {p.supplier_name}
                            </td>
                            <td className="table-cell">
                              <span className={`badge ${p.scope === 'international' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {p.scope === 'international' ? <Globe size={12} className="inline mr-1" /> : <MapPin size={12} className="inline mr-1" />}
                                {p.scope}
                              </span>
                            </td>
                            <td className="table-cell font-bold">
                              <span className={p.is_best ? 'text-green-600' : 'text-gray-700'}>{fmt(p.price)} {p.currency}</span>
                            </td>
                            <td className="table-cell">
                              {p.is_best ? (
                                <span className="text-green-600 font-medium text-sm">Meilleur prix</span>
                              ) : (
                                <span className="text-red-500 text-sm">+{fmt(p.price - comp.bestPrice.price)} {p.currency} (+{Math.round((p.price - comp.bestPrice.price) / comp.bestPrice.price * 100)}%)</span>
                              )}
                            </td>
                            <td className="table-cell text-sm text-gray-500">{fmtDate(p.recorded_date)}</td>
                            <td className="table-cell">
                              {p.product_url ? (
                                <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-stn-secondary hover:text-stn-primary">
                                  <ExternalLink size={16} />
                                </a>
                              ) : p.market_url ? (
                                <a href={p.market_url} target="_blank" rel="noopener noreferrer" className="text-stn-secondary hover:text-stn-primary">
                                  <ExternalLink size={16} />
                                </a>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="table-cell">
                              <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-blue-500 hover:text-blue-700" title="Modifier"><Pencil size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); remove(p); }} className="text-red-500 hover:text-red-700" title="Supprimer"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier le prix' : 'Enregistrer un prix'} onSave={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Désignation du produit</label>
            <input type="text" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="input-field" placeholder="Ex: Huile moteur 15W40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendeur / Marché / Site</label>
            <input type="text" value={form.supplier_name} onChange={e => setForm({...form, supplier_name: e.target.value})} className="input-field" placeholder="Ex: Amazon, Alibaba, Marché Central..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portée</label>
            <select value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} className="input-field">
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value === '' ? '' : parseFloat(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="input-field">
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="CNY">CNY (Yuan)</option>
              <option value="GBP">GBP</option>
              <option value="MAD">MAD (Dirham)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL du marché / site (optionnel)</label>
            <input type="text" value={form.market_url} onChange={e => setForm({...form, market_url: e.target.value})} className="input-field" placeholder="Ex: https://www.amazon.fr" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL directe du produit (optionnel)</label>
            <input type="text" value={form.product_url} onChange={e => setForm({...form, product_url: e.target.value})} className="input-field" placeholder="Ex: https://www.amazon.fr/product/..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'enregistrement</label>
            <DatePicker value={form.recorded_date} onChange={val => setForm({...form, recorded_date: val})} className="w-full" />
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

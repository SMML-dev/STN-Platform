import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FileText, Printer, X, Search } from 'lucide-react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import DatePicker from './DatePicker.jsx';
import { fmtDate } from '../utils/dateUtils.js';

const emptyForm = {
  order_number: '',
  order_date: new Date().toISOString().split('T')[0],
  supplier: '',
  section: '',
  tva_applicable: 0,
  notes: '',
  signature: '',
  items: [{ designation: '', quantite: 1, unite: '' }]
};

export default function ReceptionOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewItem, setViewItem] = useState(null);
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState('');
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const load = () => {
    api.receptionOrders.list().then(data => { setItems(data); setLoading(false); });
  };

  const loadSections = () => {
    api.sections.list().then(data => { setSections(data); });
  };

  const addSection = () => {
    if (!newSection.trim()) return;
    api.sections.create({ name: newSection.trim() }).then(() => {
      setForm({ ...form, section: newSection.trim() });
      setNewSection('');
      loadSections();
    });
  };

  useEffect(() => {
    load();
    loadSections();
  }, []);

  const openAdd = () => {
    api.receptionOrders.nextNumber().then(data => {
      setForm({ ...emptyForm, order_number: data.number });
      setEditId(null);
      setModalOpen(true);
    });
  };

  const openEdit = (item) => {
    setForm({
      order_number: item.order_number,
      order_date: item.order_date,
      supplier: item.supplier,
      section: item.section || '',
      tva_applicable: item.tva_applicable ? 1 : 0,
      notes: item.notes || '',
      signature: item.signature || '',
      items: item.items && item.items.length > 0
        ? item.items.map(i => ({ designation: i.designation, quantite: i.quantite, unite: i.unite || '' }))
        : [{ designation: '', quantite: 1, unite: '' }]
    });
    setEditId(item.id);
    setModalOpen(true);
  };

  const save = () => {
    if (!form.supplier.trim()) return;
    const data = {
      ...form,
      tva_applicable: form.tva_applicable ? 1 : 0,
      signature: form.signature || '',
      items: form.items.filter(i => i.designation.trim())
    };
    if (editId) {
      api.receptionOrders.update(editId, data).then(() => { load(); setModalOpen(false); });
    } else {
      api.receptionOrders.create(data).then(() => { load(); setModalOpen(false); });
    }
  };

  const remove = (order) => {
    setDeleteConfirm({
      open: true,
      title: 'Supprimer le bon de réception',
      message: `Voulez-vous vraiment supprimer le bon de réception n° "${order.order_number}" (${order.supplier || 'Sans fournisseur'}) ? Cette action est irréversible.`,
      onConfirm: () => {
        api.receptionOrders.remove(order.id).then(() => {
          load();
          setDeleteConfirm(prev => ({ ...prev, open: false }));
        });
      }
    });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { designation: '', quantite: 1, unite: '' }] });

  const updateItem = (idx, field, val) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setForm({ ...form, items: newItems });
  };

  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const filtered = items.filter(o => {
    const matchesSearch = !search || (o.supplier?.toLowerCase().includes(search.toLowerCase()) || o.order_number?.toLowerCase().includes(search.toLowerCase()));
    const matchesSection = !sectionFilter || o.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  const printOrder = (o) => {
    const hasUnite = o.items.some(i => i.unite && i.unite.toString().trim());
    const uSpan = hasUnite ? 2 : 1;
    const unitHeader = hasUnite ? '<th>UNITÉ</th>' : '';
    const unitCell = (u) => hasUnite ? `<td>${u}</td>` : '';
    const itemsRows = o.items.map(i => `
      <tr>
        <td>${i.quantite}</td>
        <td>${i.designation}</td>
        ${unitCell(i.unite || '')}
      </tr>
    `).join('');
    const sectionHtml = o.section ? `<td>${o.section}</td>` : '';
    const sectionHeader = o.section ? `<th>SECTION ANALYTIQUE</th>` : '';

    const html = `
      <html><head><title>Bon de Réception ${o.order_number}</title>
      <style>
        @page { margin: 1.5cm; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 40px 80px 40px; color: #333; }
        .header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; padding-bottom: 12px; }
        .logo { height: 70px; object-fit: contain; }
        .company-name { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: baseline; gap: 4px; white-space: nowrap; }
        .brown { color: #b85c14; }
        .small-brown { color: #b85c14; font-size: 0.65em; text-transform: uppercase; vertical-align: baseline; }
        .line { width: 80px; height: 4px; display: inline-block; margin-left: 12px; }
        .line-orange { background: #e97c2a; }
        .line-blue { background: #0a4d8c; }
        .title { text-align: center; font-size: 24px; font-weight: bold; margin: 16px 0 20px 0; text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #333; padding: 8px; }
        th { background: #f0f0f0; text-align: center; }
        td { text-align: left; }
        .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 9px; color: #444; text-align: center; border-top: 1px solid #c0392b; padding: 6px 40px 4px 40px; line-height: 1.7; background: #fff; }
        .footer .line2 { border-top: 1px solid #c0392b; margin-top: 4px; padding-top: 4px; }
      </style></head><body>
      <div class="header">
        <img src="${window.location.origin}/logo.png" class="logo" onerror="this.style.display='none'" />
        <div class="company-name">
          <span class="brown">SOCIÉTÉ</span> <span class="small-brown">DE</span> <span class="brown">TRANSIT</span> <span class="small-brown">ET DE</span> <span class="brown">NÉGOCE</span>
          <div style="display:inline-flex;gap:2px;vertical-align:middle;margin-left:10px">
            <span class="line line-orange"></span>
            <span class="line line-blue"></span>
          </div>
        </div>
      </div>
      <div class="title">BON DE RÉCEPTION</div>
      <table>
        <thead>
          <tr>
            <th>NUMÉRO</th>
            <th>DATE</th>
            <th>FOURNISSEUR</th>
            ${sectionHeader}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${o.order_number}</td>
            <td>${fmtDate(o.order_date)}</td>
            <td>${o.supplier}</td>
            ${sectionHtml}
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>QUANTITÉ</th>
            <th>DÉSIGNATION</th>
            ${unitHeader}
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      ${o.tva_applicable ? '<p style="font-weight:bold;margin-top:10px;color:#b85c14">TVA appliquée (18%)</p>' : ''}
      <div class="signatures" style="justify-content: ${o.signature ? 'space-between' : 'flex-end'}">
        ${o.signature ? `
        <div style="text-align:center">
          <p style="font-weight:bold">${o.signature}</p>
          <p style="font-size:11px;margin-top:40px;border-top:1px solid #333;padding-top:5px;display:inline-block;width:120px">Signature</p>
        </div>` : ''}
        <div style="text-align:center">
          <p style="font-weight:bold">La Direction</p>
          <p style="font-size:11px;margin-top:40px;border-top:1px solid #333;padding-top:5px;display:inline-block;width:120px">Signature</p>
        </div>
      </div>
      <div class="footer">
        <div>Société anonyme au capital de 100.000.000 FCFA &nbsp;-&nbsp; RC n° SN-DKR-2000-B975 &nbsp;-&nbsp; NINEA n° 000433805 2A3 &nbsp;-&nbsp; Môle d'escale N° 3 – Port Autonome – BP : 50571 – Dakar – Sénégal</div>
        <div class="line2">Coordonnée bancaire BIS SN079 01101 251064292001 77 &nbsp;|&nbsp; Tél. : (221) 33 849 51 51 &nbsp;|&nbsp; Site web : www.stngroupe.com &nbsp;|&nbsp; Courriel : infos@stngroupe.com</div>
      </div>
      </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 1000);
      } catch {}
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">Bons de Réception</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Fournisseur / N°"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 w-52"
            />
          </div>
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="input-field w-44">
            <option value="">Toutes sections</option>
            {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Créer un bon
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header">N°</th>
                <th className="table-header">Date</th>
                <th className="table-header">Fournisseur</th>
                <th className="table-header">Section</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Aucun bon de réception</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Aucun résultat</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{o.order_number}</td>
                  <td className="table-cell">{fmtDate(o.order_date)}</td>
                  <td className="table-cell">{o.supplier}</td>
                  <td className="table-cell">{o.section || '—'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => printOrder(o)} className="text-green-600 hover:text-green-800" title="Imprimer"><Printer size={16} /></button>
                      <button onClick={() => setViewItem(o)} className="text-stn-secondary hover:text-stn-primary" title="Voir"><FileText size={16} /></button>
                      <button onClick={() => openEdit(o)} className="text-blue-500 hover:text-blue-700" title="Modifier"><Pencil size={16} /></button>
                      <button onClick={() => remove(o)} className="text-red-500 hover:text-red-700" title="Supprimer"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifier le bon' : 'Créer un bon de réception'} onSave={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
            <input type="text" value={form.order_number} onChange={e => setForm({ ...form, order_number: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <DatePicker value={form.order_date} onChange={val => setForm({ ...form, order_date: val })} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
            <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section analytique</label>
            <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="input-field">
              <option value="">—</option>
              {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Nouvelle section"
                value={newSection}
                onChange={e => setNewSection(e.target.value)}
                className="input-field text-sm flex-1"
              />
              <button onClick={addSection} className="btn-secondary text-sm flex items-center gap-1" type="button">
                <Plus size={14} /> Ajouter
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.tva_applicable === 1}
                onChange={e => setForm({ ...form, tva_applicable: e.target.checked ? 1 : 0 })}
                className="w-4 h-4"
              />
              TVA appliquée
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature supplémentaire</label>
            <select value={form.signature} onChange={e => setForm({ ...form, signature: e.target.value })} className="input-field">
              <option value="">Aucune</option>
              <option value="DGA">DGA</option>
              <option value="DG">DG</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Articles</label>
            <button onClick={addItem} className="text-stn-secondary text-sm font-medium flex items-center gap-1 hover:text-stn-primary">
              <Plus size={14} /> Ajouter un article
            </button>
          </div>
          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input type="number" placeholder="Qté" value={item.quantite} onChange={e => updateItem(idx, 'quantite', parseInt(e.target.value) || 1)} className="input-field w-20" />
                <input type="text" placeholder="Désignation" value={item.designation} onChange={e => updateItem(idx, 'designation', e.target.value)} className="input-field flex-1" />
                <input type="text" placeholder="Unité" value={item.unite} onChange={e => updateItem(idx, 'unite', e.target.value)} className="input-field w-24" />
                <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Bon de Réception ${viewItem?.order_number || ''}`}>
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Fournisseur:</span> <strong>{viewItem.supplier}</strong></div>
              <div><span className="text-gray-500">Date:</span> {fmtDate(viewItem.order_date)}</div>
              {viewItem.section && <div><span className="text-gray-500">Section:</span> {viewItem.section}</div>}
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Qté</th><th className="text-left">Désignation</th><th className="text-left">Unité</th></tr></thead>
              <tbody>
                {viewItem.items.map((i, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{i.quantite}</td>
                    <td>{i.designation}</td>
                    <td>{i.unite || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => printOrder(viewItem)} className="btn-primary flex items-center gap-2 mx-auto"><Printer size={18} /> Imprimer</button>
          </div>
        )}
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

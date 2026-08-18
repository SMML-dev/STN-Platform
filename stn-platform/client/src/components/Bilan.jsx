import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Wallet, FileText, Package, Printer, Download } from 'lucide-react';
import { api } from '../api/client.js';
import { fmtDate } from '../utils/dateUtils.js';
import DatePicker from './DatePicker.jsx';

export default function Bilan() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (dateFrom && dateTo) {
      params.date_from = dateFrom;
      params.date_to = dateTo;
    } else {
      params.period = period;
    }
    api.bilan.get(params).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  const periodLabels = {
    daily: 'Journalier', weekly: 'Hebdomadaire', monthly: 'Mensuel', yearly: 'Annuel', all: 'Global'
  };

  const printBilan = () => {
    if (!data) return;
    const periode = dateFrom && dateTo ? `du ${fmtDate(dateFrom)} au ${fmtDate(dateTo)}` : periodLabels[data.period];
    const html = `
      <html><head><title>Bilan STN - ${periode}</title>
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
        .title { text-align: center; font-size: 24px; font-weight: bold; margin: 16px 0 4px 0; text-decoration: underline; }
        .subtitle { text-align: center; font-size: 14px; color: #555; margin-bottom: 20px; }
        h2 { color: #0a4d8c; font-size: 18px; margin: 25px 0 12px 0; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
        .grand-total { background: #0a4d8c; color: white; padding: 16px 20px; border-radius: 6px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
        .grand-total .label { font-size: 15px; }
        .grand-total .value { font-size: 26px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f0f0f0; color: #333; padding: 8px 10px; text-align: left; border: 1px solid #333; }
        td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
        td.amount { text-align: right; font-weight: 600; }
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
      <div class="title">BILAN FINANCIER</div>
      <div class="subtitle">Période : ${periode} &nbsp;&nbsp;|&nbsp;&nbsp; Généré le : ${new Date().toLocaleDateString('fr-FR')}</div>

      <div class="grand-total">
        <span class="label">Total général</span>
        <span class="value">${fmt(data.grandTotal)} FCFA</span>
      </div>

      <h2>Bons de Commande</h2>
      <table>
        <tr><td>Nombre de bons</td><td class="amount">${data.purchaseOrders.count}</td></tr>
        <tr><td>Montant HT</td><td class="amount">${fmt(data.purchaseOrders.total_ht)} FCFA</td></tr>
        <tr><td>Montant TTC</td><td class="amount">${fmt(data.purchaseOrders.total_ttc)} FCFA</td></tr>
      </table>

      <h2>Autres Postes</h2>
      <table>
        <tr><td>Charges fixes (${data.charges.count})</td><td class="amount">${fmt(data.charges.total)} FCFA</td></tr>
        <tr><td>Commandes à prévoir (${data.orders.count})</td><td class="amount">${fmt(data.orders.total)} FCFA</td></tr>
        <tr><td>Valeur du stock</td><td class="amount">${fmt(data.stockValue)} FCFA</td></tr>
      </table>

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

  const cards = data ? [
    { label: 'Bons de commande', value: data.purchaseOrders.count, icon: TrendingUp, color: 'bg-blue-500' },
    { label: 'Montant HT', value: data.purchaseOrders.total_ht, icon: Wallet, color: 'bg-orange-500' },
    { label: 'Montant TTC', value: data.purchaseOrders.total_ttc, icon: Calendar, color: 'bg-green-500' },
    { label: 'Charges fixes', value: data.charges.total, icon: FileText, color: 'bg-purple-500' },
    { label: 'Commandes à prévoir', value: data.orders.total, icon: Package, color: 'bg-cyan-500' },
    { label: 'Valeur du stock', value: data.stockValue, icon: TrendingDown, color: 'bg-red-500' }
  ] : [];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Période</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="input-field w-40">
              <option value="daily">Journalier</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
          </div>
          <div className="text-sm text-gray-400">— ou —</div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date début</label>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="jj/mm/aaaa" className="w-40" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date fin</label>
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="jj/mm/aaaa" className="w-40" />
          </div>
          <button onClick={load} className="btn-primary">Calculer</button>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-8 text-gray-400">Calcul du bilan...</div>
      ) : data ? (
        <>
          <div className="card bg-gradient-to-r from-stn-primary to-stn-dark text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Bilan {dateFrom && dateTo ? `du ${fmtDate(dateFrom)} au ${fmtDate(dateTo)}` : periodLabels[data.period]}</h3>
                <p className="text-sm text-stn-light mt-1">Synthèse financière globale</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-stn-light">Total général</p>
                  <p className="text-3xl font-bold">{fmt(data.grandTotal)} FCFA</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => api.bilan.export(dateFrom && dateTo ? { date_from: dateFrom, date_to: dateTo } : { period })} className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <Download size={16} /> Exporter
                  </button>
                  <button onClick={printBilan} className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <Printer size={16} /> Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{c.label}</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">{fmt(c.value)} FCFA</p>
                    </div>
                    <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center text-white`}>
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bons de Commande</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Nombre de bons</span>
                  <span className="text-sm font-semibold">{data.purchaseOrders.count}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Montant HT</span>
                  <span className="text-sm font-semibold">{fmt(data.purchaseOrders.total_ht)} FCFA</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Montant TTC</span>
                  <span className="text-sm font-semibold text-green-600">{fmt(data.purchaseOrders.total_ttc)} FCFA</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Autres Postes</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Charges fixes ({data.charges.count})</span>
                  <span className="text-sm font-semibold">{fmt(data.charges.total)} FCFA</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Commandes à prévoir ({data.orders.count})</span>
                  <span className="text-sm font-semibold">{fmt(data.orders.total)} FCFA</span>
                </div>
                <div className="flex justify-between p-3 bg-stn-light rounded-lg">
                  <span className="text-sm text-stn-primary font-medium">Valeur du stock</span>
                  <span className="text-sm font-bold text-stn-primary">{fmt(data.stockValue)} FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

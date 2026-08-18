import React, { useState, useEffect } from 'react';
import { ShoppingCart, Truck, Package, TrendingUp, Wallet, Ship, Anchor, Building2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client.js';
import { fmtDate } from '../utils/dateUtils.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.dashboard.get().then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.alerts.list().then(d => setAlerts(d)).catch(() => setAlerts([]));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Chargement...</p></div>;
  if (!data) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Aucune donnée disponible</p></div>;

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  const statRows = [
    [
      { label: 'Montant total HT', value: `${fmt(data.totalPurchaseOrders.total_ht)} FCFA`, icon: TrendingUp, color: 'bg-orange-500' },
      { label: 'Montant total TTC', value: `${fmt(data.totalPurchaseOrders.total_ttc)} FCFA`, icon: Wallet, color: 'bg-teal-500' }
    ],
    [
      { label: 'Articles en stock', value: data.totalStocks.count, icon: Package, color: 'bg-purple-500' },
      { label: 'Produits en alerte', value: alerts.length, icon: AlertTriangle, color: 'bg-red-500' }
    ],
    [
      { label: 'Bons de commande', value: data.totalPurchaseOrders.count, icon: ShoppingCart, color: 'bg-blue-500' },
      { label: 'Fournisseurs', value: data.totalSuppliers.count, icon: Truck, color: 'bg-green-500' }
    ]
  ];

  return (
    <div className="space-y-6">

      {statRows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {row.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-white`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bons de commande par Section</h3>
          {data.purchaseOrdersBySection.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {data.purchaseOrdersBySection.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{s.section || '—'}</span>
                  <span className="text-sm font-semibold text-gray-800">{s.count} bon(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Charges Fixes par Département</h3>
          {data.chargesByDept.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {data.chargesByDept.map((c, i) => {
                const Icon = c.department === 'ADMIN' ? Building2 : c.department === 'GENTLE' ? Ship : Anchor;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-stn-primary" />
                      <span className="font-medium text-gray-700">{c.department}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{c.count} charge(s)</p>
                      <p className="text-xs text-gray-500">{fmt(c.total)} FCFA</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Commandes à Prévoir par Département</h3>
          {data.ordersByDept.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {data.ordersByDept.map((o, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{o.department}</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{o.count} commande(s)</p>
                    <p className="text-xs text-gray-500">{fmt(o.total)} FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">5 derniers bons de commande</h3>
          {data.recentPurchaseOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun enregistrement</p>
          ) : (
            <div className="space-y-2">
              {data.recentPurchaseOrders.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{p.order_number} — {p.supplier}</p>
                    <p className="text-xs text-gray-500">{fmtDate(p.order_date)} | {p.nb_items} article(s)</p>
                  </div>
                  <span className="text-sm font-semibold text-stn-primary">{fmt(p.total)} FCFA</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-stn-light rounded-lg">
                <span className="text-sm font-medium text-stn-primary">Total des 5 derniers</span>
                <span className="text-sm font-bold text-stn-primary">{fmt(data.recentPurchaseOrders.slice(0, 5).reduce((s, p) => s + (p.total || 0), 0))} FCFA</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

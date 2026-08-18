import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Truck, Package, Building2, DollarSign, BarChart3, LogOut, User as UserIcon, Cog, Tag } from 'lucide-react';
import { api } from './api/client.js';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import PurchaseOrders from './components/PurchaseOrders.jsx';
import Suppliers from './components/Suppliers.jsx';
import Families from './components/Families.jsx';
import Stocks from './components/Stocks.jsx';
import Admin from './components/Admin.jsx';
import Prices from './components/Prices.jsx';
import Bilan from './components/Bilan.jsx';
import SettingsPage from './components/Settings.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import GlobalSearch from './components/GlobalSearch.jsx';

const navSections = [
  {
    title: 'Principal', items: [
      { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
      { id: 'purchase-orders', label: 'Bons de Commande', icon: ShoppingCart },
      { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
      { id: 'families', label: 'Familles des Articles', icon: Tag },
      { id: 'stocks', label: 'Stocks', icon: Package },
    ]
  },
  {
    title: 'Gestion', items: [
      { id: 'prices', label: 'Prix en Temps Réel', icon: DollarSign },
      { id: 'bilan', label: 'Bilan', icon: BarChart3 },
      { id: 'admin', label: 'Administration', icon: Building2 },
      { id: 'settings', label: 'Paramètres', icon: Cog },
    ]
  }
];

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('stn_token');
    const savedUser = localStorage.getItem('stn_user');
    if (token && savedUser) {
      api.auth.verify()
        .then(res => { setUser(res.user); })
        .catch(() => {
          localStorage.removeItem('stn_token');
          localStorage.removeItem('stn_user');
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLogout = () => {
    api.auth.logout().catch(() => { });
    localStorage.removeItem('stn_token');
    localStorage.removeItem('stn_user');
    setUser(null);
    setActivePage('dashboard');
    setLogoutOpen(false);
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-400">Chargement...</p>
    </div>;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'purchase-orders': return <PurchaseOrders />;
      case 'families': return <Families />;
      case 'suppliers': return <Suppliers />;
      case 'stocks': return <Stocks />;
      case 'prices': return <Prices />;
      case 'bilan': return <Bilan />;
      case 'admin': return <Admin />;
      case 'settings': return <SettingsPage user={user} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-stn-primary text-white overflow-hidden flex flex-col`}>
        <div className="p-5 border-b border-stn-dark">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center p-1 flex-shrink-0">
              <img src="/logo.png" alt="Logo STN" className="w-full h-full object-contain" onError={e => { e.target.outerHTML = '<span class="text-stn-primary font-bold text-lg">STN</span>'; }} />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">STN</h1>
              <p className="text-xs text-stn-light opacity-80 leading-tight">Remorquage Portuaire</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si} className="mb-3">
              <p className="text-xs text-stn-light uppercase tracking-wider px-3 py-1.5 font-semibold opacity-60">{section.title}</p>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activePage === item.id ? 'bg-white text-stn-primary' : 'text-stn-light hover:bg-stn-dark'
                        }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-stn-dark">
          <div className="flex items-center gap-2 text-xs text-stn-light mb-2">
            <UserIcon size={14} />
            <span>{user.display_name || user.username}</span>
          </div>
          <button onClick={() => setLogoutOpen(true)} className="flex items-center gap-2 text-xs text-stn-light hover:text-white transition-colors">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {navSections.flatMap(s => s.items).find(n => n.id === activePage)?.label || 'Tableau de Bord'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch onNavigate={setActivePage} />
            <div className="text-sm text-gray-500 hidden lg:block">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter de la plateforme ?"
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}

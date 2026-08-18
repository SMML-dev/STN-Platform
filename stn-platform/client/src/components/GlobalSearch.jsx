import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Package, Truck, X } from 'lucide-react';
import { api } from '../api/client.js';

const typeConfig = {
  achat: { icon: ShoppingCart, label: 'Bon de commande', color: 'text-blue-500 bg-blue-50' },
  stock: { icon: Package, label: 'Stock', color: 'text-green-500 bg-green-50' },
  fournisseur: { icon: Truck, label: 'Fournisseur', color: 'text-orange-500 bg-orange-50' }
};

export default function GlobalSearch({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api.search.global(query.trim())
        .then(data => {
          setResults(data.results || []);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (result) => {
    setOpen(false);
    setQuery('');
    onNavigate(result.page);
  };

  return (
    <div ref={containerRef} className="relative w-80">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder="Recherche globale..."
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stn-primary focus:border-transparent"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <p className="p-4 text-sm text-gray-400 text-center">Recherche...</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">Aucun résultat pour "{query}"</p>
          ) : (
            results.map((r, i) => {
              const cfg = typeConfig[r.type] || typeConfig.achat;
              const Icon = cfg.icon;
              return (
                <button
                  key={`${r.type}-${r.id}-${i}`}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                    <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{cfg.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

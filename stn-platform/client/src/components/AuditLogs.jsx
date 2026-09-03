import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Filter, RefreshCw, Calendar, Clock,
  Search, ShieldAlert, CheckCircle2, User, ChevronLeft, ChevronRight,
  Activity, ArrowUpDown, AlertCircle, RotateCcw
} from 'lucide-react';
import { api } from '../api/client.js';
import DatePicker from './DatePicker.jsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter options loaded from server
  const [filterOptions, setFilterOptions] = useState({
    actions: [],
    entities: [],
    users: []
  });

  // Filter state
  const [actionFilter, setActionFilter] = useState('TOUS');
  const [entityFilter, setEntityFilter] = useState('TOUS');
  const [userFilter, setUserFilter] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        api.auditLogs.list({
          page,
          limit,
          action: actionFilter,
          entity_type: entityFilter,
          username: userFilter,
          search,
          date_from: dateFrom,
          date_to: dateTo
        }),
        api.auditLogs.stats()
      ]);

      setLogs(logsData.logs || []);
      setTotalPages(logsData.totalPages || 1);
      setTotalCount(logsData.total || 0);
      if (logsData.filterOptions) {
        setFilterOptions(logsData.filterOptions);
      }
      setStats(statsData);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, entityFilter, userFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setActionFilter('TOUS');
    setEntityFilter('TOUS');
    setUserFilter('TOUS');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.auditLogs.export({
        action: actionFilter,
        entity_type: entityFilter,
        username: userFilter,
        search,
        date_from: dateFrom,
        date_to: dateTo
      });
    } catch (err) {
      alert("Erreur lors de l'export Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      const datePart = d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timePart = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return `${datePart} à ${timePart}`;
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CRÉATION') || act.includes('CREATION')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('MODIFICATION')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('SUPPRESSION')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('CONNEXION') && !act.includes('ÉCHOUÉE') && !act.includes('REFUSÉE')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (act.includes('ÉCHOUÉE') || act.includes('REFUSÉE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (act.includes('RÉINITIALISATION') || act.includes('REINITIALISATION')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (act.includes('DÉCONNEXION')) {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-stn-dark via-stn-primary to-stn-secondary text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
              <ShieldAlert size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Journal d'Audit</h2>
                <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full font-medium">
                  Admin Only
                </span>
              </div>
              <p className="text-sm text-stn-light opacity-90">
                Historique complet et infalsifiable de toutes les opérations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-lg bg-white bg-opacity-15 hover:bg-opacity-25 transition-all text-white flex items-center gap-2 text-xs font-medium"
              title="Rafraîchir les logs"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              onClick={handleExport}
              disabled={exporting || totalCount === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow transition-all transform active:scale-95"
            >
              <Download size={18} />
              {exporting ? 'Exportation...' : 'Exporter Excel (.xlsx)'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4 border-l-4 border-l-stn-primary">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-stn-primary flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Événements</p>
            <p className="text-2xl font-bold text-gray-900">{stats ? stats.total : '—'}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900">{stats ? stats.today : '—'}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 border-l-4 border-l-indigo-600">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Utilisateurs Actifs</p>
            <p className="text-2xl font-bold text-gray-900">{stats ? stats.activeUsers : '—'}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase">Dernière Opération</p>
            <p className="text-xs font-bold text-gray-900 mt-1 truncate">
              {stats?.lastLog ? formatDateTime(stats.lastLog.created_at) : 'Aucune'}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {stats?.lastLog?.action || ''} {stats?.lastLog?.entity_type ? `• ${stats.lastLog.entity_type}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter size={16} className="text-stn-primary" />
            <span>Filtres de recherche avancés</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {totalCount} résultat{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-gray-600 hover:text-stn-primary flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Recherche texte */}
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher description, référence..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-field pl-9"
            />
          </div>

          {/* Action */}
          <div>
            <select
              value={actionFilter}
              onChange={e => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="input-field text-xs"
            >
              <option value="TOUS">Toutes les actions</option>
              {filterOptions.actions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Entité */}
          <div>
            <select
              value={entityFilter}
              onChange={e => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="input-field text-xs"
            >
              <option value="TOUS">Tous les modules</option>
              {filterOptions.entities.map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>

          {/* Date début */}
          <div>
            <DatePicker
              value={dateFrom}
              onChange={val => {
                setDateFrom(val);
                setPage(1);
              }}
              placeholder="Date début (jj/mm/aaaa)"
              className="w-full"
            />
          </div>

          {/* Date fin */}
          <div>
            <DatePicker
              value={dateTo}
              onChange={val => {
                setDateTo(val);
                setPage(1);
              }}
              placeholder="Date fin (jj/mm/aaaa)"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="table-header w-44">Date & Heure Précise</th>
                <th className="table-header w-48">Utilisateur</th>
                <th className="table-header w-36">Action</th>
                <th className="table-header w-40">Module / Entité</th>
                <th className="table-header w-32">Référence</th>
                <th className="table-header">Description Détaillée</th>
                <th className="table-header w-24 text-right">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-stn-primary" />
                    Chargement du journal d'audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    Aucun événement d'audit ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors text-xs">
                    {/* Horodatage précis */}
                    <td className="table-cell font-mono text-gray-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock size={13} className="text-gray-400 flex-shrink-0" />
                        <span>{formatDateTime(log.created_at)}</span>
                      </div>
                    </td>

                    {/* Utilisateur */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-stn-light text-stn-primary flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                          {log.username ? log.username.slice(0, 1).toUpperCase() : '?'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-gray-900 truncate">
                            {log.username || 'Système'}
                          </p>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                            [{log.user_role || 'auto'}]
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action badge */}
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Module / Entité */}
                    <td className="table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-medium">
                        {log.entity_type || 'Général'}
                      </span>
                    </td>

                    {/* Référence Entité */}
                    <td className="table-cell font-mono text-gray-600">
                      {log.entity_id ? (
                        <span className="bg-blue-50/60 text-blue-800 px-1.5 py-0.5 rounded border border-blue-100">
                          {log.entity_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Description détaillée */}
                    <td className="table-cell text-gray-800 font-normal text-[13px] leading-relaxed">
                      {log.description}
                    </td>

                    {/* IP */}
                    <td className="table-cell text-right font-mono text-[11px] text-gray-400">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Afficher</span>
            <select
              value={limit}
              onChange={e => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 bg-white text-xs"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>lignes par page (Total: {totalCount} logs)</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Page <strong>{page}</strong> sur <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BASE = '/api';

function getToken() {
  return localStorage.getItem('stn_token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, { headers, ...options });
  if (res.status === 401) {
    localStorage.removeItem('stn_token');
    localStorage.removeItem('stn_user');
    window.location.reload();
    throw new Error('Session expirée');
  }
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

function downloadCSV(url) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE}${url}`, { headers })
    .then(res => {
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return res.blob();
    })
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = url.includes('bilan') ? 'bilan_stn.xlsx' : 'achats_stn.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
}

export const api = {
  auth: {
    login: async (username, password) => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de connexion');
      }
      const data = await res.json();
      localStorage.setItem('stn_token', data.token);
      localStorage.setItem('stn_user', JSON.stringify(data.user));
      return data;
    },
    verify: () => request('/auth/verify'),
    logout: () => {
      localStorage.removeItem('stn_token');
      localStorage.removeItem('stn_user');
      return request('/auth/logout', { method: 'POST' });
    },
    changePassword: (currentPassword, newPassword) =>
      request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
  },
  purchases: {
    list: () => request('/purchases'),
    create: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/purchases/${id}`, { method: 'DELETE' }),
    export: () => downloadCSV('/purchases/export')
  },
  purchaseOrders: {
    list: () => request('/purchase-orders'),
    get: (id) => request(`/purchase-orders/${id}`),
    create: (data) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/purchase-orders/${id}`, { method: 'DELETE' }),
    nextNumber: () => request('/purchase-orders/next-number')
  },
  receptionOrders: {
    list: () => request('/reception-orders'),
    get: (id) => request(`/reception-orders/${id}`),
    create: (data) => request('/reception-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/reception-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/reception-orders/${id}`, { method: 'DELETE' }),
    nextNumber: () => request('/reception-orders/next-number')
  },
  sections: {
    list: () => request('/sections'),
    create: (data) => request('/sections', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => request(`/sections/${id}`, { method: 'DELETE' })
  },
  suppliers: {
    list: () => request('/suppliers'),
    create: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
    categories: () => request('/suppliers/categories'),
    createCategory: (data) => request('/suppliers/categories', { method: 'POST', body: JSON.stringify(data) }),
    removeCategory: (id) => request(`/suppliers/categories/${id}`, { method: 'DELETE' })
  },
  families: {
    list: () => request('/families'),
    create: (data) => request('/families', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/families/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/families/${id}`, { method: 'DELETE' })
  },
  stocks: {
    list: () => request('/stocks'),
    create: (data) => request('/stocks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/stocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/stocks/${id}`, { method: 'DELETE' })
  },
  charges: {
    list: (dept) => request(`/charges${dept ? `?department=${dept}` : ''}`),
    create: (data) => request('/charges', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/charges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/charges/${id}`, { method: 'DELETE' })
  },
  orders: {
    list: (dept) => request(`/orders${dept ? `?department=${dept}` : ''}`),
    create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/orders/${id}`, { method: 'DELETE' })
  },
  works: {
    list: (dept) => request(`/works${dept ? `?department=${dept}` : ''}`),
    create: (data) => request('/works', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/works/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/works/${id}`, { method: 'DELETE' })
  },
  dashboard: {
    get: () => request('/dashboard')
  },
  prices: {
    list: (designation, scope) => {
      const params = new URLSearchParams();
      if (designation) params.set('designation', designation);
      if (scope) params.set('scope', scope);
      const qs = params.toString();
      return request(`/prices${qs ? `?${qs}` : ''}`);
    },
    compare: (designation) => request(`/prices/compare${designation ? `?designation=${encodeURIComponent(designation)}` : ''}`),
    create: (data) => request('/prices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/prices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/prices/${id}`, { method: 'DELETE' }),
    designations: () => request('/prices/designations')
  },
  invoices: {
    list: () => request('/invoices'),
    get: (id) => request(`/invoices/${id}`),
    create: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
    nextNumber: () => request('/invoices/next-number')
  },
  quotes: {
    list: () => request('/quotes'),
    get: (id) => request(`/quotes/${id}`),
    create: (data) => request('/quotes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/quotes/${id}`, { method: 'DELETE' }),
    nextNumber: () => request('/quotes/next-number')
  },
  history: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/history${qs ? `?${qs}` : ''}`);
    }
  },
  bilan: {
    get: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/bilan${qs ? `?${qs}` : ''}`);
    },
    export: (params) => {
      const qs = new URLSearchParams(params).toString();
      return downloadCSV(`/bilan/export${qs ? `?${qs}` : ''}`);
    }
  },
  alerts: {
    list: () => request('/alerts'),
    all: () => request('/alerts/all'),
    setThreshold: (data) => request('/alerts/threshold', { method: 'POST', body: JSON.stringify(data) }),
    getDefaultThreshold: () => request('/alerts/default-threshold'),
    setDefaultThreshold: (value) => request('/alerts/default-threshold', { method: 'POST', body: JSON.stringify({ value }) })
  },
  payments: {
    forInvoice: (invoiceId) => request(`/payments/invoice/${invoiceId}`),
    create: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => request(`/payments/${id}`, { method: 'DELETE' })
  },
  search: {
    global: (q) => request(`/search?q=${encodeURIComponent(q)}`)
  }
};

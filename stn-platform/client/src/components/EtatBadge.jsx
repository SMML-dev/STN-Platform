import React from 'react';

const etatColors = {
  'validé': 'bg-green-100 text-green-700',
  'validé et acquis': 'bg-green-100 text-green-700',
  'valide et acquis': 'bg-green-100 text-green-700',
  'en attente': 'bg-yellow-100 text-yellow-700',
  "en attente d'échantillon": 'bg-yellow-100 text-yellow-700',
  'en attente de livraison': 'bg-yellow-100 text-yellow-700',
  'en cours': 'bg-blue-100 text-blue-700',
  'en cours de production': 'bg-blue-100 text-blue-700',
  'en cours de production pour la gravure': 'bg-blue-100 text-blue-700',
  'soldé': 'bg-gray-200 text-gray-700',
  'livré': 'bg-green-100 text-green-700',
  'Tarif à renegocier': 'bg-orange-100 text-orange-700',
  'attente de retour du fournisseur': 'bg-orange-100 text-orange-700',
  'indisponible': 'bg-red-100 text-red-700',
  'disponible': 'bg-green-100 text-green-700'
};

export default function EtatBadge({ etat }) {
  const colorClass = etatColors[etat?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${colorClass}`}>{etat || '—'}</span>
  );
}

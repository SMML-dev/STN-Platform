import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, onSave, saveLabel = 'Enregistrer' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          {onSave && (
            <button onClick={onSave} className="btn-primary">{saveLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

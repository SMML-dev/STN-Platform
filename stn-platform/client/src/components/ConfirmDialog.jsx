import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = true
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              danger
                ? 'bg-red-50 text-red-500 ring-8 ring-red-50/60'
                : 'bg-blue-50 text-blue-500 ring-8 ring-blue-50/60'
            }`}
          >
            <AlertTriangle size={24} className="stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 leading-6">{title}</h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors -mr-1.5 -mt-1.5"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 transition-all shadow-sm hover:border-gray-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md active:scale-95 ${
              danger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/25 active:bg-red-800'
                : 'bg-stn-primary hover:bg-stn-dark shadow-stn-primary/25'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


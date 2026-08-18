import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { fmtDate } from '../utils/dateUtils.js';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

/**
 * Composant de sélection de date en français (JJ/MM/AAAA)
 * @param {string} value - Valeur au format ISO YYYY-MM-DD
 * @param {function} onChange - Callback avec la valeur ISO YYYY-MM-DD
 * @param {string} placeholder - Texte indicatif
 * @param {string} className - Classes CSS additionnelles
 */
export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'jj/mm/aaaa',
  className = ''
}) {
  const [open, setOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const containerRef = useRef(null);

  // Parse ISO (YYYY-MM-DD) en Date locale
  const parseISO = (isoStr) => {
    if (!isoStr) return null;
    const parts = isoStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const selectedDate = parseISO(value);

  // Année et mois visualisés dans le calendrier
  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  );

  // Synchroniser le champ texte avec la valeur reçue
  useEffect(() => {
    if (value) {
      setTextInput(fmtDate(value));
      const parsed = parseISO(value);
      if (parsed) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    } else {
      setTextInput('');
    }
  }, [value]);

  // Fermer le popover si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestion de la saisie manuelle (JJ/MM/AAAA)
  const handleTextChange = (e) => {
    let input = e.target.value;
    setTextInput(input);

    // Valider format JJ/MM/AAAA
    const clean = input.trim();
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = clean.match(regex);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        onChange?.(iso);
      }
    } else if (clean === '') {
      onChange?.('');
    }
  };

  const selectDay = (day) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange?.(iso);
    setOpen(false);
  };

  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const setToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onChange?.(iso);
    setOpen(false);
  };

  const clearDate = (e) => {
    e.stopPropagation();
    onChange?.('');
    setTextInput('');
  };

  // Calcul des jours du mois
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    // 0 = dimanche -> convertir pour semaine commençant le lundi (0 = lundi, 6 = dimanche)
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  const today = new Date();
  const isToday = (day) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getFullYear() === viewYear;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <div
        className="input-field flex items-center justify-between cursor-pointer gap-2 bg-white"
        onClick={() => setOpen(prev => !prev)}
      >
        <input
          type="text"
          value={textInput}
          placeholder={placeholder}
          onChange={handleTextChange}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="w-full bg-transparent outline-none text-gray-800 text-sm placeholder-gray-400"
        />
        <div className="flex items-center gap-1 text-gray-400">
          {value && (
            <button
              type="button"
              onClick={clearDate}
              className="hover:text-red-500 p-0.5 rounded transition-colors"
              title="Effacer"
            >
              <X size={14} />
            </button>
          )}
          <CalendarIcon size={16} className="text-gray-500 hover:text-stn-primary transition-colors" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64 text-sm animate-in fade-in zoom-in-95 duration-100">
          {/* Entête mois / année avec navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Mois précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-gray-800 text-xs uppercase tracking-wide">
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Mois suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* En-têtes jours de la semaine (Lundi -> Dimanche) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_FR.map((d, i) => (
              <span key={i} className="text-[11px] font-medium text-gray-400 py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Jours du mois précédent */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <span
                key={`prev-${i}`}
                className="text-xs text-gray-300 py-1.5 rounded-lg select-none"
              >
                {prevMonthDays - firstDay + i + 1}
              </span>
            ))}

            {/* Jours du mois courant */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const todayMark = isToday(day);

              return (
                <button
                  type="button"
                  key={`cur-${day}`}
                  onClick={() => selectDay(day)}
                  className={`text-xs py-1.5 rounded-lg transition-colors font-medium select-none ${
                    selected
                      ? 'bg-stn-primary text-white font-bold shadow-sm'
                      : todayMark
                      ? 'border border-stn-primary text-stn-primary hover:bg-blue-50 font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Boutons d'action rapides */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={setToday}
              className="text-stn-primary hover:underline font-medium"
            >
              Aujourd'hui
            </button>
            {value && (
              <button
                type="button"
                onClick={clearDate}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

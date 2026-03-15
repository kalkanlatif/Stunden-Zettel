'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check } from 'lucide-react';

interface Props {
  value: string; // "HH:mm" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function TimePicker({ value, onChange, placeholder = '00:00', label }: Props) {
  const [open, setOpen] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const [hour, minute] = value ? value.split(':') : ['', ''];
  const [tempHour, setTempHour] = useState(hour || '09');
  const [tempMinute, setTempMinute] = useState(minute || '00');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync temp values when opening
  useEffect(() => {
    if (open) {
      setTempHour(hour || '09');
      setTempMinute(minute || '00');
    }
  }, [open, hour, minute]);

  // Scroll to current hour when opening
  useEffect(() => {
    if (open && hourRef.current) {
      const hourIndex = parseInt(tempHour);
      const el = hourRef.current.children[hourIndex] as HTMLElement;
      if (el) {
        setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'instant' }), 50);
      }
    }
  }, [open, tempHour]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleConfirm = useCallback(() => {
    onChange(`${tempHour}:${tempMinute}`);
    setOpen(false);
  }, [tempHour, tempMinute, onChange]);

  const pickerOverlay = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
        style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />

      {/* Picker panel */}
      <div
        className="relative w-full max-w-md animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-3 mb-3 overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div className="border-b border-neutral-100 bg-gradient-to-r from-amber-50 to-amber-100/50 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">{label || 'Uhrzeit wählen'}</p>
            <p className="mt-1 text-3xl font-black tabular-nums text-amber-900">
              {tempHour}<span className="text-amber-400">:</span>{tempMinute}
            </p>
          </div>

          {/* Scrollable pickers */}
          <div className="flex divide-x divide-neutral-100">
            {/* Hours */}
            <div className="flex-1 py-2">
              <p className="px-4 pb-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400">Stunde</p>
              <div ref={hourRef} className="h-52 overflow-y-auto px-2 scrollbar-thin">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setTempHour(h)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${
                      h === tempHour
                        ? 'bg-amber-400 font-bold text-white shadow-sm'
                        : 'font-medium text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100'
                    }`}
                  >
                    <span className="tabular-nums">{h}:00</span>
                    {h === tempHour && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 py-2">
              <p className="px-4 pb-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400">Minute</p>
              <div className="h-52 overflow-y-auto px-2 scrollbar-thin">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTempMinute(m)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${
                      m === tempMinute
                        ? 'bg-amber-400 font-bold text-white shadow-sm'
                        : 'font-medium text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100'
                    }`}
                  >
                    <span className="tabular-nums">:{m}</span>
                    {m === tempMinute && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-neutral-100 p-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-2xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-500 transition-all active:scale-[0.98]"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              Übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex-1">
      {label && (
        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-base font-bold transition-all ${
          value
            ? 'border-amber-300 bg-white text-amber-900 shadow-sm'
            : 'border-dashed border-neutral-200 bg-neutral-50 text-neutral-300'
        } hover:border-amber-400 hover:shadow-md active:scale-[0.98]`}
      >
        <Clock className={`h-4 w-4 ${value ? 'text-amber-500' : 'text-neutral-300'}`} />
        <span className="tabular-nums">{value || placeholder}</span>
      </button>

      {pickerOverlay}
    </div>
  );
}

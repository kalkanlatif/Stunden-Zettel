'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props {
  value: string; // "yyyy-MM-dd"
  onChange: (value: string) => void;
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const selectedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewMonth, setViewMonth] = useState(selectedDate);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setViewMonth(selectedDate);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSelect = useCallback((date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  }, [onChange]);

  // Build calendar grid
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const today = new Date();
  const displayDate = value ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de }) : 'Datum wählen';

  const overlay = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
        style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />

      {/* Calendar panel */}
      <div
        className="relative w-full max-w-md animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-3 mb-3 overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="border-b border-neutral-100 bg-gradient-to-r from-amber-50 to-amber-100/50 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">Arbeitstag</p>
            <p className="mt-1 text-lg font-bold text-amber-900 capitalize">{displayDate}</p>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-amber-900 capitalize">
              {format(viewMonth, 'MMMM yyyy', { locale: de })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-4 pb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {wd}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 px-4 pb-4">
            {days.map((d, i) => {
              const inMonth = isSameMonth(d, viewMonth);
              const isSelected = isSameDay(d, selectedDate);
              const isToday = isSameDay(d, today);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(d)}
                  className={`relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-white shadow-sm'
                      : isToday
                      ? 'bg-amber-100 text-amber-900 font-bold'
                      : inMonth
                      ? 'text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100'
                      : 'text-neutral-300'
                  }`}
                >
                  {format(d, 'd')}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
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
              onClick={() => handleSelect(today)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              Heute
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/60 px-4 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99] backdrop-blur-xl"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <CalendarDays className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Arbeitstag</span>
          <p className="truncate text-sm font-bold text-amber-900 capitalize">
            {value ? format(selectedDate, 'EEE, d. MMM yyyy', { locale: de }) : 'Datum wählen'}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
      </button>

      {overlay}
    </>
  );
}

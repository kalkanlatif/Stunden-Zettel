'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  value: string; // "HH:mm" or ""
  onChange: (value: string) => void;
  placeholder?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimePicker({ value, onChange, placeholder = '00:00' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);

  const [hour, minute] = value ? value.split(':') : ['', ''];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to current hour when opening
  useEffect(() => {
    if (open && hourRef.current && hour) {
      const hourIndex = parseInt(hour);
      const el = hourRef.current.children[hourIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [open, hour]);

  const handleHourClick = (h: string) => {
    const m = minute || '00';
    onChange(`${h}:${m}`);
  };

  const handleMinuteClick = (m: string) => {
    const h = hour || '00';
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
          value
            ? 'border-amber-300 bg-white text-amber-900 shadow-sm'
            : 'border-dashed border-neutral-300 bg-white text-neutral-400'
        } hover:border-amber-400 hover:shadow-md`}
      >
        <Clock className={`h-3.5 w-3.5 ${value ? 'text-amber-500' : 'text-neutral-300'}`} />
        {value || placeholder}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 flex overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {/* Hours */}
          <div ref={hourRef} className="h-48 w-14 overflow-y-auto border-r border-neutral-100 py-1 scrollbar-thin">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleHourClick(h)}
                className={`flex w-full items-center justify-center py-1.5 text-sm transition-colors ${
                  h === hour
                    ? 'bg-amber-400 font-bold text-amber-900'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
          {/* Minutes */}
          <div className="flex w-14 flex-col py-1">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMinuteClick(m)}
                className={`flex flex-1 items-center justify-center text-sm transition-colors ${
                  m === minute
                    ? 'bg-amber-400 font-bold text-amber-900'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                :{m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

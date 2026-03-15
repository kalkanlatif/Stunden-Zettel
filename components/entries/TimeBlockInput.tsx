'use client';

import { X } from 'lucide-react';
import { TimeBlock } from '@/types';
import { calculateHours, formatHours } from '@/lib/utils/time';
import { TimePicker } from './TimePicker';

interface Props {
  index: number;
  block: TimeBlock;
  onChange: (index: number, block: TimeBlock) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function TimeBlockInput({ index, block, onChange, onRemove, canRemove }: Props) {
  const hours = block.start && block.end && block.end > block.start
    ? calculateHours(block.start, block.end)
    : 0;

  return (
    <div
      className="relative rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      {/* Shift label + remove */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-[10px] font-bold text-white">
            {index + 1}
          </div>
          <span className="text-xs font-semibold text-amber-900">Schicht {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          {hours > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
              {formatHours(hours)}
            </span>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-400 transition-colors hover:bg-red-100 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Time pickers */}
      <div className="flex items-end gap-3">
        <TimePicker
          value={block.start}
          onChange={(v) => onChange(index, { ...block, start: v })}
          placeholder="00:00"
          label="Von"
        />
        <div className="pb-3 text-neutral-300">→</div>
        <TimePicker
          value={block.end}
          onChange={(v) => onChange(index, { ...block, end: v })}
          placeholder="00:00"
          label="Bis"
        />
      </div>
    </div>
  );
}

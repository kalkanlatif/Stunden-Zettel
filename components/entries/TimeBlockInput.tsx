'use client';

import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';
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
    <div className="flex items-center gap-2">
      <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-50 px-3 py-1.5">
        <TimePicker
          value={block.start}
          onChange={(v) => onChange(index, { ...block, start: v })}
          placeholder="Von"
        />
        <ArrowRight className="h-3 w-3 shrink-0 text-neutral-300" />
        <TimePicker
          value={block.end}
          onChange={(v) => onChange(index, { ...block, end: v })}
          placeholder="Bis"
        />
      </div>
      {hours > 0 && (
        <span className="min-w-[3.5rem] rounded-lg bg-amber-400/15 px-2 py-1.5 text-center text-xs font-bold text-amber-700">
          {formatHours(hours)}
        </span>
      )}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-8 w-8 shrink-0 text-neutral-300 hover:text-red-500"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

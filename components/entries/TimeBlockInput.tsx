'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { TimeBlock } from '@/types';
import { calculateHours, formatHours } from '@/lib/utils/time';

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
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex-1">
        <span className="mb-1 block text-[10px] uppercase text-neutral-400">Von</span>
        <Input
          type="time"
          value={block.start}
          onChange={(e) => onChange(index, { ...block, start: e.target.value })}
          className="h-9 bg-white text-sm"
        />
      </div>
      <div className="flex-1">
        <span className="mb-1 block text-[10px] uppercase text-neutral-400">Bis</span>
        <Input
          type="time"
          value={block.end}
          onChange={(e) => onChange(index, { ...block, end: e.target.value })}
          className="h-9 bg-white text-sm"
        />
      </div>
      <div className="w-16 text-center">
        <span className="mb-1 block text-[10px] uppercase text-neutral-400">Std.</span>
        <p className="text-sm font-semibold text-neutral-700">
          {hours > 0 ? formatHours(hours) : '-'}
        </p>
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="mt-3 h-8 w-8 text-neutral-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

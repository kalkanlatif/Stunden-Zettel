'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
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
    <div className="flex items-end gap-2 rounded-lg border bg-gray-50 p-3">
      <div className="flex-1">
        <Label className="text-xs text-gray-500">Von</Label>
        <Input
          type="time"
          value={block.start}
          onChange={(e) => onChange(index, { ...block, start: e.target.value })}
          className="bg-white"
        />
      </div>
      <div className="flex-1">
        <Label className="text-xs text-gray-500">Bis</Label>
        <Input
          type="time"
          value={block.end}
          onChange={(e) => onChange(index, { ...block, end: e.target.value })}
          className="bg-white"
        />
      </div>
      <div className="w-20 text-center">
        <Label className="text-xs text-gray-500">Stunden</Label>
        <p className="py-2 text-sm font-medium">
          {hours > 0 ? formatHours(hours) : '-'}
        </p>
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

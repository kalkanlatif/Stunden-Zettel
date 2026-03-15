'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { TimeEntry } from '@/types';
import { formatDate, getWeekday, formatHours, calculatePauses, formatMinutes } from '@/lib/utils/time';

interface Props {
  entries: TimeEntry[];
  loading: boolean;
  missingDays?: number;
}

function TimeBlocksWithPauses({ entry }: { entry: TimeEntry }) {
  const sorted = [...entry.time_blocks].sort((a, b) => a.start.localeCompare(b.start));
  const pauses = calculatePauses(entry.time_blocks);

  if (sorted.length <= 1) {
    return (
      <p className="mt-0.5 text-xs text-neutral-500">
        {sorted[0] ? `${sorted[0].start}–${sorted[0].end}` : ''}
      </p>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {sorted.map((block, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-500">{block.start}–{block.end}</span>
          {i < sorted.length - 1 && pauses[i] && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              ☕ {formatMinutes(pauses[i].minutes)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function MonthlyOverview({ entries, loading, missingDays = 0 }: Props) {
  const sorted = [...entries].sort((a, b) => a.work_date.localeCompare(b.work_date));
  const totalHours = sorted.reduce((sum, e) => sum + Number(e.total_hours), 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        {missingDays > 0 && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              {missingDays} Tage ohne Eintrag (letzte 5-7 Tage).
              Bitte gem. § 17 MiLoG innerhalb von 7 Tagen nachtragen!
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-400">
            Noch keine Einträge in diesem Monat.
          </p>
        ) : (
          <div className="space-y-1.5">
            {sorted.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl bg-amber-50/50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-900">{formatDate(entry.work_date)}</span>
                    <span className="text-[11px] text-neutral-400">{getWeekday(entry.work_date)}</span>
                  </div>
                  <TimeBlocksWithPauses entry={entry} />
                </div>
                <span className="ml-3 shrink-0 rounded-lg bg-white px-2.5 py-1 text-sm font-bold text-amber-900 shadow-sm">
                  {formatHours(Number(entry.total_hours))}
                </span>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-amber-400/15 px-3 py-3 mt-1">
              <span className="text-sm font-semibold text-amber-800">
                {sorted.length} {sorted.length === 1 ? 'Tag' : 'Tage'}
              </span>
              <span className="text-base font-bold text-amber-900">
                {formatHours(totalHours)} Std.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { z } from 'zod/v4';
import { MAX_TIME_BLOCKS } from '@/lib/constants';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeBlockSchema = z.object({
  start: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:mm)'),
  end: z.string().regex(timeRegex, 'Ungültiges Zeitformat (HH:mm)'),
}).refine((data) => data.end > data.start, {
  message: 'Endzeit muss nach Startzeit liegen',
  path: ['end'],
});

export const entrySchema = z.object({
  employee_id: z.string().uuid('Ungültige Mitarbeiter-ID'),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  time_blocks: z.array(timeBlockSchema)
    .min(1, 'Mindestens ein Zeitblock erforderlich')
    .max(MAX_TIME_BLOCKS, `Maximal ${MAX_TIME_BLOCKS} Zeitblöcke pro Tag`),
  break_minutes: z.number().int().min(0, 'Pause kann nicht negativ sein').max(120, 'Maximale Pause: 120 Minuten').default(0),
  notes: z.string().max(500, 'Bemerkung darf maximal 500 Zeichen haben').optional(),
});

export type EntryFormData = z.infer<typeof entrySchema>;

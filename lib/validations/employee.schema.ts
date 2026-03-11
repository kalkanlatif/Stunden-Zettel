import { z } from 'zod/v4';

export const employeeSchema = z.object({
  first_name: z.string().min(2, 'Vorname muss mindestens 2 Zeichen haben').max(50, 'Vorname darf maximal 50 Zeichen haben'),
  last_name: z.string().min(2, 'Nachname muss mindestens 2 Zeichen haben').max(50, 'Nachname darf maximal 50 Zeichen haben'),
  employment_type: z.enum(['Minijob', 'Teilzeit', 'Vollzeit', 'Aushilfe'], {
    error: 'Bitte eine gültige Beschäftigungsart wählen',
  }),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

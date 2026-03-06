export const APP_NAME = 'Kalkan Stundenzettel';
export const BUSINESS_NAME = process.env.NEXT_PUBLIC_BETRIEB_NAME || 'Kalkan Restaurant';

export const EMPLOYMENT_TYPES = ['Minijob', 'Teilzeit', 'Vollzeit', 'Aushilfe'] as const;

export const EMPLOYMENT_BADGE_COLORS: Record<string, string> = {
  Minijob: 'bg-neutral-100 text-neutral-600',
  Teilzeit: 'bg-amber-50 text-amber-700',
  Vollzeit: 'bg-neutral-900 text-white',
  Aushilfe: 'bg-amber-400/20 text-amber-800',
};

// § 17 MiLoG: records must be kept within 7 days of work
export const MILOG_DEADLINE_DAYS = 7;

// ArbZG § 3: max daily working hours
export const MAX_HOURS_PER_DAY = 10;

// Max time blocks per day
export const MAX_TIME_BLOCKS = 6;

// Default admin PIN
export const DEFAULT_ADMIN_PIN = '1234';

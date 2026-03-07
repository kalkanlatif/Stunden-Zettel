export type EmploymentType = 'Minijob' | 'Teilzeit' | 'Vollzeit' | 'Aushilfe';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employment_type: EmploymentType;
  password: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeBlock {
  start: string; // Format: "HH:mm"
  end: string;   // Format: "HH:mm"
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  work_date: string; // Format: "YYYY-MM-DD"
  time_blocks: TimeBlock[];
  total_hours: number;
  break_minutes: number;
  notes?: string;
  recorded_at: string;
  updated_at: string;
}

export interface TimeEntryWithEmployee extends TimeEntry {
  employee: Employee;
}

export interface MonthlyReport {
  employee_id: string;
  first_name: string;
  last_name: string;
  employment_type: EmploymentType;
  month: string;
  work_days: number;
  total_hours_month: number;
  total_break_minutes: number;
}

export type AbsenceType = 'Urlaub' | 'Krank' | 'Feiertag' | 'Unbezahlter Urlaub' | 'Sonstiges';

export interface Absence {
  id: string;
  employee_id: string;
  absence_date: string; // Format: "YYYY-MM-DD"
  absence_type: AbsenceType;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * seed-history.ts
 * Generates realistic historical time entries and absences for one employee.
 *
 * Usage (local Supabase – reads from .env.local):
 *   bun run scripts/seed-history.ts --list
 *   bun run scripts/seed-history.ts --employee "Miran Kalkan" [--dry-run]
 *
 * Usage (cloud Supabase – pass credentials directly):
 *   bun run scripts/seed-history.ts --url https://xxx.supabase.co --key SERVICE_ROLE_KEY --list
 *   bun run scripts/seed-history.ts --url https://xxx.supabase.co --key SERVICE_ROLE_KEY --employee "Miran Kalkan"
 *
 * Rules:
 *  - Monday  → absence "Sonstiges" (Ruhetag – Betrieb geschlossen)
 *  - Sunday  → no entry (regular day off)
 *  - Urlaub days → absence "Urlaub"
 *  - Tue–Sat → time_entry ~8 h/day (Vollzeit 40 h/week target)
 */

import { createClient } from '@supabase/supabase-js';

// ── Parse --url / --key from CLI args (override env vars) ────────────────────
const _args = process.argv.slice(2);
const _urlIdx = _args.indexOf('--url');
const _keyIdx = _args.indexOf('--key');
const CLI_URL = _urlIdx !== -1 ? _args[_urlIdx + 1] : undefined;
const CLI_KEY = _keyIdx !== -1 ? _args[_keyIdx + 1] : undefined;

const SUPABASE_URL      = CLI_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = CLI_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Supabase credentials missing.');
  console.error('Either set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('or pass them directly: --url https://xxx.supabase.co --key <service_role_key>');
  process.exit(1);
}

console.log(`Connecting to: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Date range ────────────────────────────────────────────────────────────────
const START_DATE = new Date('2025-12-15');
const END_DATE   = new Date('2026-03-20');

// ── Fixed Urlaub days (spread across months for realism) ─────────────────────
// Chosen on Fri/Sat to keep weekly hours balanced (Vollzeit 40 h/week)
const URLAUB_DAYS = new Set([
  '2025-12-19', // Friday – Dec week 3
  '2025-12-27', // Saturday – Christmas week
  '2026-01-10', // Saturday
  '2026-01-16', // Friday
  '2026-01-31', // Saturday
  '2026-02-06', // Friday
  '2026-02-21', // Saturday
  '2026-03-07', // Saturday
  '2026-03-13', // Friday
]);

// ── Shift templates (time_blocks + break_minutes) ─────────────────────────────
// total_hours = sum of block durations (breaks are gaps between blocks, not deducted)
const SHIFT_TEMPLATES = [
  // Morning-afternoon single block 8 h
  { blocks: [{ start: '10:00', end: '18:00' }], break_minutes: 30 },
  { blocks: [{ start: '10:30', end: '18:30' }], break_minutes: 30 },
  { blocks: [{ start: '11:00', end: '19:00' }], break_minutes: 30 },
  // Evening-heavy single block 8.5 h
  { blocks: [{ start: '13:00', end: '21:30' }], break_minutes: 30 },
  { blocks: [{ start: '14:00', end: '22:00' }], break_minutes: 30 },
  // Split shift: lunch + dinner  (total 8.5 h worked, 2 h gap = natural break)
  { blocks: [{ start: '10:30', end: '15:00' }, { start: '17:00', end: '21:30' }], break_minutes: 30 },
  { blocks: [{ start: '11:00', end: '15:30' }, { start: '17:30', end: '22:00' }], break_minutes: 30 },
  { blocks: [{ start: '10:00', end: '14:30' }, { start: '17:00', end: '21:30' }], break_minutes: 30 },
  // Shorter day (7.5 h) – used to balance heavy weeks
  { blocks: [{ start: '11:00', end: '18:30' }], break_minutes: 30 },
  { blocks: [{ start: '14:00', end: '21:30' }], break_minutes: 30 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Seeded pseudo-random number generator (deterministic for reproducibility) */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20250101); // fixed seed → same data every run

function pickShift(dayIndex: number) {
  // Use day index + rand for variety but stability
  return SHIFT_TEMPLATES[Math.floor(rand() * SHIFT_TEMPLATES.length)];
}

function calculateTotalHours(blocks: { start: string; end: string }[]): number {
  const total = blocks.reduce((sum, b) => {
    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);
  return Math.round(total * 100) / 100;
}

/** Iterate every date from start to end (inclusive) */
function* dateRange(start: Date, end: Date): Generator<Date> {
  const cur = new Date(start);
  while (cur <= end) {
    yield new Date(cur);
    cur.setDate(cur.getDate() + 1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function listEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employment_type, active')
    .order('last_name');

  if (error) { console.error(error.message); process.exit(1); }
  console.log('\nEmployees in database:\n');
  for (const e of data ?? []) {
    console.log(`  ${e.first_name} ${e.last_name}  [${e.employment_type}]  active=${e.active}  id=${e.id}`);
  }
  console.log('');
}

async function findEmployee(nameArg: string) {
  const [firstName, ...rest] = nameArg.trim().split(' ');
  const lastName = rest.join(' ');

  let query = supabase.from('employees').select('id, first_name, last_name, employment_type');

  if (lastName) {
    query = query.ilike('first_name', firstName).ilike('last_name', lastName);
  } else {
    query = query.or(`first_name.ilike.${firstName},last_name.ilike.${firstName}`);
  }

  const { data, error } = await query.limit(5);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data || data.length === 0) {
    console.error(`No employee found matching "${nameArg}". Run --list to see all employees.`);
    process.exit(1);
  }
  if (data.length > 1) {
    console.error(`Multiple matches for "${nameArg}". Be more specific:`);
    for (const e of data) console.log(`  ${e.first_name} ${e.last_name} [${e.id}]`);
    process.exit(1);
  }
  return data[0];
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (args.includes('--list')) {
    await listEmployees();
    return;
  }

  const empIdx = args.indexOf('--employee');
  if (empIdx === -1 || !args[empIdx + 1]) {
    console.log('Usage:');
    console.log('  bun run scripts/seed-history.ts [--url <url> --key <service_role_key>] --list');
    console.log('  bun run scripts/seed-history.ts [--url <url> --key <service_role_key>] --employee "First Last" [--dry-run]');
    process.exit(0);
  }

  const employeeArg = args[empIdx + 1];
  const employee = await findEmployee(employeeArg);
  console.log(`\nTarget employee: ${employee.first_name} ${employee.last_name} [${employee.employment_type}] id=${employee.id}`);

  if (dryRun) console.log('\n[DRY RUN] – no data will be written\n');

  // Fetch already-existing entries and absences for this employee in range
  const startStr = toDateString(START_DATE);
  const endStr   = toDateString(END_DATE);

  const { data: existingEntries } = await supabase
    .from('time_entries')
    .select('work_date')
    .eq('employee_id', employee.id)
    .gte('work_date', startStr)
    .lte('work_date', endStr);

  const { data: existingAbsences } = await supabase
    .from('absences')
    .select('absence_date')
    .eq('employee_id', employee.id)
    .gte('absence_date', startStr)
    .lte('absence_date', endStr);

  const existingEntryDates  = new Set((existingEntries  ?? []).map((e) => e.work_date));
  const existingAbsenceDates = new Set((existingAbsences ?? []).map((a) => a.absence_date));

  const newEntries: object[]  = [];
  const newAbsences: object[] = [];
  let dayIndex = 0;

  for (const date of Array.from(dateRange(START_DATE, END_DATE))) {
    const dateStr  = toDateString(date);
    const weekday  = date.getDay(); // 0=Sun,1=Mon,...,6=Sat

    // Skip if already exists
    if (existingEntryDates.has(dateStr) || existingAbsenceDates.has(dateStr)) {
      console.log(`  SKIP  ${dateStr} (already exists)`);
      dayIndex++;
      continue;
    }

    // Sunday → regular day off, no entry
    if (weekday === 0) {
      console.log(`  FREE  ${dateStr} Sun`);
      dayIndex++;
      continue;
    }

    // Monday → Ruhetag
    if (weekday === 1) {
      newAbsences.push({
        employee_id:  employee.id,
        absence_date: dateStr,
        absence_type: 'Sonstiges',
        notes:        'Ruhetag – Betrieb geschlossen',
      });
      console.log(`  REST  ${dateStr} Mon → Ruhetag`);
      dayIndex++;
      continue;
    }

    // Urlaub days
    if (URLAUB_DAYS.has(dateStr)) {
      newAbsences.push({
        employee_id:  employee.id,
        absence_date: dateStr,
        absence_type: 'Urlaub',
        notes:        null,
      });
      console.log(`  URL   ${dateStr} → Urlaub`);
      dayIndex++;
      continue;
    }

    // Work day (Tue–Sat, not holiday, not Urlaub)
    const shift = pickShift(dayIndex);
    const totalHours = calculateTotalHours(shift.blocks);
    newEntries.push({
      employee_id:   employee.id,
      work_date:     dateStr,
      time_blocks:   shift.blocks,
      total_hours:   totalHours,
      break_minutes: shift.break_minutes,
      notes:         null,
    });
    const blocksStr = shift.blocks.map((b) => `${b.start}–${b.end}`).join(', ');
    console.log(`  WORK  ${dateStr} → ${blocksStr} = ${totalHours}h`);
    dayIndex++;
  }

  // Summary
  console.log(`\n──────────────────────────────────────────`);
  console.log(`Work entries to insert : ${newEntries.length}`);
  console.log(`Absence entries to insert: ${newAbsences.length}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Done. Re-run without --dry-run to write data.');
    return;
  }

  if (newEntries.length === 0 && newAbsences.length === 0) {
    console.log('\nNothing to insert – all days already have entries.');
    return;
  }

  // Insert in batches
  const BATCH = 50;

  for (let i = 0; i < newEntries.length; i += BATCH) {
    const batch = newEntries.slice(i, i + BATCH);
    const { error } = await supabase.from('time_entries').insert(batch);
    if (error) {
      console.error(`\nError inserting time_entries batch ${i}-${i + BATCH}:`, error.message);
      process.exit(1);
    }
  }

  for (let i = 0; i < newAbsences.length; i += BATCH) {
    const batch = newAbsences.slice(i, i + BATCH);
    const { error } = await supabase.from('absences').insert(batch);
    if (error) {
      console.error(`\nError inserting absences batch ${i}-${i + BATCH}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\nDone! Data inserted successfully.');
  console.log(`  ${newEntries.length} work entries`);
  console.log(`  ${newAbsences.length} absences`);
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

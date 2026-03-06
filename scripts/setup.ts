/**
 * Setup script for Kalkan Stundenzettel
 * Run with: bun run scripts/setup.ts
 *
 * 1. Checks Supabase connection
 * 2. Inserts default admin PIN hash
 * 3. Optionally creates test employees
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Checking Supabase connection...');

  const { data, error } = await supabase.from('employees').select('id').limit(1);

  if (error) {
    console.error('Connection failed:', error.message);
    console.log('\nMake sure you have run the migration in supabase/migrations/001_initial.sql');
    process.exit(1);
  }

  console.log('Supabase connection OK');

  // Set default admin PIN (plain text "1234" — in production use bcrypt)
  const { error: pinError } = await supabase
    .from('admin_settings')
    .upsert({ key: 'admin_pin_hash', value: '1234' });

  if (pinError) {
    console.error('Failed to set admin PIN:', pinError.message);
  } else {
    console.log('Default admin PIN set (1234)');
  }

  // Create test employees
  const ADD_TEST_DATA = process.argv.includes('--test-data');

  if (ADD_TEST_DATA) {
    const testEmployees = [
      { first_name: 'Miran', last_name: 'Kalkan', employment_type: 'Vollzeit' },
      { first_name: 'Melek Eylül', last_name: 'Kalkan', employment_type: 'Teilzeit' },
      { first_name: 'Eymen', last_name: 'Kalkan', employment_type: 'Minijob' },
      { first_name: 'Salihcan', last_name: 'Kalkan', employment_type: 'Aushilfe' },
      { first_name: 'Yusuf', last_name: 'Bilgin', employment_type: 'Vollzeit' },
      { first_name: 'Diyar', last_name: 'Bilgin', employment_type: 'Teilzeit' },
      { first_name: 'Baran', last_name: 'Kalkan', employment_type: 'Minijob' },
    ];

    const { error: insertError } = await supabase.from('employees').upsert(
      testEmployees,
      { onConflict: 'id' }
    );

    if (insertError) {
      console.error('Failed to create test employees:', insertError.message);
    } else {
      console.log(`Created ${testEmployees.length} test employees`);
    }
  }

  console.log('\nSetup complete!');
}

main();

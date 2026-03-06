-- Allow multiple entries per employee per day
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS unique_employee_date;

-- Allow future dates
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS no_future_date;

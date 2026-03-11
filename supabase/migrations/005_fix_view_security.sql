-- Fix Security Advisor error: monthly_overview was created as SECURITY DEFINER (default).
-- Recreate it with SECURITY INVOKER so RLS policies are evaluated for the calling user.

CREATE OR REPLACE VIEW monthly_overview
WITH (security_invoker = true)
AS
SELECT
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  e.employment_type,
  DATE_TRUNC('month', t.work_date) AS month,
  COUNT(t.id) AS work_days,
  SUM(t.total_hours) AS total_hours_month,
  SUM(t.break_minutes) AS total_break_minutes
FROM employees e
LEFT JOIN time_entries t ON t.employee_id = e.id
WHERE e.active = true
GROUP BY e.id, e.first_name, e.last_name, e.employment_type, DATE_TRUNC('month', t.work_date);

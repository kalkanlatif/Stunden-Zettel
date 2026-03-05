-- ============================================================
-- Kalkan Stundenzettel — Database Schema
-- Compliant with § 17 MiLoG, GDPR-ready
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Minijob', 'Teilzeit', 'Vollzeit', 'Aushilfe')),
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: time_entries
-- Core of § 17 MiLoG documentation
-- Each row = one work day of an employee
-- ============================================================
CREATE TABLE time_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,

  -- § 17 MiLoG required fields
  work_date       DATE NOT NULL,

  -- Time blocks as JSONB (multiple blocks per day, e.g. 10:00-15:00 + 16:00-19:00)
  time_blocks     JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"start": "10:00", "end": "15:00"}, {"start": "16:00", "end": "19:00"}]

  -- Calculated total hours (set automatically server-side)
  total_hours     NUMERIC(4,2) NOT NULL,

  -- Break time in minutes
  break_minutes   INTEGER NOT NULL DEFAULT 0,

  -- Notes (optional)
  notes           TEXT,

  -- Audit fields (§ 17 MiLoG: recording date must be provable)
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One entry per employee per day
  CONSTRAINT unique_employee_date UNIQUE (employee_id, work_date),

  -- Work date must not be in the future
  CONSTRAINT no_future_date CHECK (work_date <= CURRENT_DATE)
);

-- ============================================================
-- TABLE: admin_settings
-- Simple key-value configuration
-- ============================================================
CREATE TABLE admin_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default admin PIN (hashed in app, placeholder here)
INSERT INTO admin_settings (key, value)
VALUES ('admin_pin_hash', 'PLACEHOLDER_SET_BY_APP');

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON time_entries(work_date);
CREATE INDEX idx_time_entries_month ON time_entries(DATE_TRUNC('month', work_date));
CREATE INDEX idx_employees_active ON employees(active);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_employees_updated
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_time_entries_updated
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (GDPR compliant)
-- ============================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- All access via service role (server-side via Next.js API)
-- No direct client access to sensitive data
CREATE POLICY "service_role_only_employees"
  ON employees FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_time_entries"
  ON time_entries FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_admin"
  ON admin_settings FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- VIEW: monthly_overview
-- Aggregated view for admin reporting
-- ============================================================
CREATE VIEW monthly_overview AS
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

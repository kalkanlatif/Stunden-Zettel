-- Absences table (Abwesenheiten)
CREATE TABLE absences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  absence_date    DATE NOT NULL,
  absence_type    TEXT NOT NULL CHECK (absence_type IN ('Urlaub', 'Krank', 'Feiertag', 'Unbezahlter Urlaub', 'Sonstiges')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_absences_employee ON absences(employee_id);
CREATE INDEX idx_absences_date ON absences(absence_date);
CREATE INDEX idx_absences_year_month ON absences(EXTRACT(YEAR FROM absence_date), EXTRACT(MONTH FROM absence_date));

CREATE TRIGGER trigger_absences_updated
  BEFORE UPDATE ON absences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_absences"
  ON absences FOR ALL
  USING (auth.role() = 'service_role');

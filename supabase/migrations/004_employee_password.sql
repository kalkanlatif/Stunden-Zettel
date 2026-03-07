-- Add password column to employees
-- Default password = first name lowercase (set via trigger for existing rows)
ALTER TABLE employees ADD COLUMN password TEXT;

-- Set default passwords for existing employees (first_name lowercase)
UPDATE employees SET password = LOWER(first_name);

-- Make password NOT NULL after setting defaults
ALTER TABLE employees ALTER COLUMN password SET NOT NULL;

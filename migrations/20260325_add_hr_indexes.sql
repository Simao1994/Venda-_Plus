-- Performance Optimization for HR Module
-- Adding indexes on company_id for all HR related tables

CREATE INDEX IF NOT EXISTS idx_hr_employees_company_id ON hr_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_departments_company_id ON hr_departments(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_date ON hr_attendance(date);
-- employee_id is already a FK but an index on it helps with filtering
CREATE INDEX IF NOT EXISTS idx_hr_attendance_employee_id ON hr_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_payrolls_company_id ON hr_payrolls(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_metas_company_id ON hr_metas(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_contas_bancarias_company_id ON hr_contas_bancarias(company_id);

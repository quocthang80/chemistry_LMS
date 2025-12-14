-- Add constraints to exams table
ALTER TABLE exams ADD COLUMN max_attempts INTEGER DEFAULT 0;
ALTER TABLE exams ADD COLUMN deadline DATETIME NULL;

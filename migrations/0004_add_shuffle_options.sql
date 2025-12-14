-- Add shuffle_options column to exams table
ALTER TABLE exams ADD COLUMN shuffle_options BOOLEAN DEFAULT 0;

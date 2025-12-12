-- Données de test pour l'enseignant
INSERT OR IGNORE INTO teachers (username, password, name) VALUES 
  ('admin', 'admin123', 'Professeur Nguyen');

-- Données de test pour les étudiants
INSERT OR IGNORE INTO students (student_code, name, class) VALUES 
  ('HS001', 'Tran Van A', '10A1'),
  ('HS002', 'Le Thi B', '10A1'),
  ('HS003', 'Nguyen Van C', '10A2'),
  ('HS004', 'Pham Thi D', '10A2');

-- Dossiers d'examens
INSERT OR IGNORE INTO exam_folders (name, description) VALUES 
  ('Chimie Organique', 'Tests sur la chimie organique'),
  ('Chimie Inorganique', 'Tests sur la chimie inorganique'),
  ('Chimie Générale', 'Tests généraux de chimie');

-- Exemple d'examen
INSERT OR IGNORE INTO exams (folder_id, title, description, duration, source) VALUES 
  (1, 'Test Alcanes et Alcènes', 'Test sur les hydrocarbures', 45, 'manual');

-- Questions d'exemple (MCQ)
INSERT OR IGNORE INTO questions (exam_id, question_type, content, difficulty_level, points, order_num) VALUES 
  (1, 'mcq', 'Quelle est la formule générale des alcanes?', 'Biết', 1.0, 1),
  (1, 'true_false', 'Évaluez les affirmations suivantes sur les alcènes:', 'Hiểu', 2.0, 2),
  (1, 'essay', 'Expliquez le mécanisme de la réaction d''addition sur les alcènes.', 'Vận dụng', 3.0, 3);

-- Options pour la question MCQ
INSERT OR IGNORE INTO question_options (question_id, option_text, is_correct, order_num) VALUES 
  (1, 'CnH2n+2', 1, 1),
  (1, 'CnH2n', 0, 2),
  (1, 'CnH2n-2', 0, 3),
  (1, 'CnHn', 0, 4);

-- Statements pour la question True/False
INSERT OR IGNORE INTO question_statements (question_id, statement_text, is_correct, order_num) VALUES 
  (2, 'Les alcènes contiennent une double liaison C=C', 1, 1),
  (2, 'Les alcènes ont la formule CnH2n+2', 0, 2),
  (2, 'Les alcènes sont plus réactifs que les alcanes', 1, 3),
  (2, 'Tous les alcènes sont gazeux à température ambiante', 0, 4);

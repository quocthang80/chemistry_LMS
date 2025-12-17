import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Redirect to static HTML pages
app.get('/teacher', (c) => {
  return c.redirect('/static/teacher_v5.html?v=' + Date.now())
})

app.get('/student', (c) => {
  return c.redirect('/static/student_v5.html?v=' + Date.now())
})

// ============================================
// API ROUTES - AUTHENTICATION
// ============================================

// Teacher login
app.post('/api/auth/teacher/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    const result = await c.env.DB.prepare(
      'SELECT id, username, name FROM teachers WHERE username = ? AND password = ?'
    ).bind(username, password).first()

    if (!result) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    return c.json({ success: true, teacher: result })
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Student login
app.post('/api/auth/student/login', async (c) => {
  try {
    const { student_code } = await c.req.json()
    const result = await c.env.DB.prepare(
      'SELECT id, student_code, name, class FROM students WHERE student_code = ?'
    ).bind(student_code).first()

    if (!result) {
      return c.json({ error: 'Student not found' }, 404)
    }

    return c.json({ success: true, student: result })
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

// ============================================
// API ROUTES - STUDENTS MANAGEMENT
// ============================================

// Get all students
app.get('/api/students', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM students ORDER BY class, name'
    ).all()
    return c.json({ students: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch students' }, 500)
  }
})

// Get student by ID
app.get('/api/students/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const student = await c.env.DB.prepare(
      'SELECT * FROM students WHERE id = ?'
    ).bind(id).first()

    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }

    return c.json({ student })
  } catch (error) {
    return c.json({ error: 'Failed to fetch student' }, 500)
  }
})

// Create student
app.post('/api/students', async (c) => {
  try {
    const { student_code, name, class: className } = await c.req.json()
    
    const result = await c.env.DB.prepare(
      'INSERT INTO students (student_code, name, class) VALUES (?, ?, ?)'
    ).bind(student_code, name, className).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to create student' }, 500)
  }
})

// Update student
app.put('/api/students/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { student_code, name, class: className } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE students SET student_code = ?, name = ?, class = ? WHERE id = ?'
    ).bind(student_code, name, className, id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update student' }, 500)
  }
})

// Delete student
app.delete('/api/students/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM students WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete student' }, 500)
  }
})

// Bulk import students
app.post('/api/students/bulk', async (c) => {
  try {
    const students = await c.req.json()
    
    if (!Array.isArray(students)) {
      return c.json({ error: 'Invalid data format' }, 400)
    }

    let successCount = 0;
    
    // Using transaction would be better but D1 batches are simpler for now
    const stmt = c.env.DB.prepare('INSERT OR IGNORE INTO students (student_code, name, class) VALUES (?, ?, ?)');
    
    // Batch execution - limit to 100 per batch to be safe
    const batchSize = 50;
    for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize).map(s => 
            stmt.bind(s.student_code, s.name, s.class)
        );
        const results = await c.env.DB.batch(batch);
        successCount += results.length; // Approximate, as IGNORE might return success but 0 rows affected
    }

    return c.json({ success: true, count: successCount })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to import students' }, 500)
  }
})

// Get Template
app.get('/api/students/template', async (c) => {
    const headers = ['Mã HS', 'Họ tên', 'Lớp']
    const csvContent = '\uFEFF' + headers.join(',')
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="file_mau_nhap_hoc_sinh.csv"'
      }
    })
})

// ============================================
// API ROUTES - EXAM FOLDERS MANAGEMENT
// ============================================

// Get all folders
app.get('/api/folders', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM exam_folders ORDER BY created_at DESC'
    ).all()
    return c.json({ folders: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch folders' }, 500)
  }
})

// Create folder
app.post('/api/folders', async (c) => {
  try {
    const { name, description } = await c.req.json()
    
    const result = await c.env.DB.prepare(
      'INSERT INTO exam_folders (name, description) VALUES (?, ?)'
    ).bind(name, description || '').run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Failed to create folder' }, 500)
  }
})

// Update folder
app.put('/api/folders/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { name, description } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE exam_folders SET name = ?, description = ? WHERE id = ?'
    ).bind(name, description || '', id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update folder' }, 500)
  }
})

// Delete folder
app.delete('/api/folders/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM exam_folders WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete folder' }, 500)
  }
})

// ============================================
// API ROUTES - EXAMS MANAGEMENT
// ============================================

// Get all exams
app.get('/api/exams', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT e.*, f.name as folder_name 
      FROM exams e 
      LEFT JOIN exam_folders f ON e.folder_id = f.id 
      ORDER BY e.created_at DESC
    `).all()
    return c.json({ exams: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch exams' }, 500)
  }
})

// Get exams by folder
app.get('/api/folders/:folderId/exams', async (c) => {
  try {
    const folderId = c.req.param('folderId')
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM exams WHERE folder_id = ? ORDER BY created_at DESC'
    ).bind(folderId).all()
    return c.json({ exams: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch exams' }, 500)
  }
})

// Get exam by ID with all questions
app.get('/api/exams/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get exam details
    const exam = await c.env.DB.prepare(
      'SELECT * FROM exams WHERE id = ?'
    ).bind(id).first()

    if (!exam) {
      return c.json({ error: 'Exam not found' }, 404)
    }

    // Get all questions
    const { results: questions } = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE exam_id = ? ORDER BY order_num'
    ).bind(id).all()

    // Get options for each question (parsed from JSON)
    for (const question of questions) {
      if (question.options) {
        try {
          // Parse JSON options if stored as string
          const parsed = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
          
          if (question.question_type === 'mcq') {
            question.options = parsed;
          } else if (question.question_type === 'true_false') {
            question.statements = parsed; // We store statements in the same 'options' column
          }
        } catch (e) {
          console.error('Failed to parse options for question', question.id);
          question.options = [];
        }
      }
    }

    return c.json({ exam, questions })
  } catch (error) {
    return c.json({ error: 'Failed to fetch exam' }, 500)
  }
})

// Create new exam
app.post('/api/exams', async (c) => {
  try {
    const { folder_id, title, description, duration, max_attempts, deadline, source, questions, shuffle_options } = await c.req.json()

    // Create exam
    const exam = await c.env.DB.prepare(
      'INSERT INTO exams (folder_id, title, description, duration, max_attempts, deadline, source, shuffle_options) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(folder_id, title, description || '', duration || 60, max_attempts || 0, deadline || null, source || 'manual', shuffle_options ? 1 : 0).run()

    const examId = exam.meta.last_row_id

    // Insert questions
    if (questions && questions.length > 0) {
      const stmt = c.env.DB.prepare(
        'INSERT INTO questions (exam_id, question_type, content, difficulty_level, points, options, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      
      const batch = questions.map((q, idx) => {
        // Prepare options/statements JSON
        let optionsJson = null
        if (q.question_type === 'mcq') optionsJson = JSON.stringify(q.options)
        else if (q.question_type === 'true_false') optionsJson = JSON.stringify(q.statements) // reuse options col

        return stmt.bind(
          examId, 
          q.question_type, 
          q.content, 
          q.difficulty_level, 
          q.points || 1.0, 
          optionsJson,
          idx
        )
      })

      await c.env.DB.batch(batch)
    }

    return c.json({ success: true, id: examId })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create exam' }, 500)
  }
})

// Update exam
app.put('/api/exams/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { title, description, folder_id, duration, max_attempts, deadline, shuffle_options, questions } = await c.req.json()

    // 1. Update Exam Metadata
    await c.env.DB.prepare(`
      UPDATE exams 
      SET title = ?, description = ?, folder_id = ?, duration = ?, max_attempts = ?, deadline = ?, shuffle_options = ?
      WHERE id = ?
    `).bind(title, description || '', folder_id, duration || 60, max_attempts || 0, deadline || null, shuffle_options ? 1 : 0, id).run()

    // 2. Handle Questions Update
    if (questions && Array.isArray(questions)) {
        // Get existing question IDs
        const existingInfo = await c.env.DB.prepare(
            'SELECT id FROM questions WHERE exam_id = ?'
        ).bind(id).all();
        
        const existingIds = existingInfo.results.map(q => q.id);
        const newIds = questions.map(q => q.id).filter(qid => typeof qid === 'number' && qid < 1000000000000); 
        // Note: Frontend generates temporary IDs using Date.now() which are large numbers.
        // Real DB IDs are small incrementing integers. 
        // While not perfect, checking size or existence in existingIds is better.
        // A better check is: is this ID in existingIds?
        
        const payloadIdsSet = new Set(questions.map(q => q.id));
        const idsToDelete = existingIds.filter(eid => !payloadIdsSet.has(eid));

        // DELETE removed questions
        if (idsToDelete.length > 0) {
            // Using a loop for deletions as D1 doesn't support "WHERE id IN (...)" with array bind easily in raw SQL without helper
            // Or construct the query string manually.
            const placeholders = idsToDelete.map(() => '?').join(',');
            await c.env.DB.prepare(`DELETE FROM questions WHERE id IN (${placeholders})`)
                .bind(...idsToDelete).run();
        }

        // UPSERT (Update existing, Insert new)
        const insertStmt = c.env.DB.prepare(
            'INSERT INTO questions (exam_id, question_type, content, difficulty_level, points, options, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        const updateStmt = c.env.DB.prepare(
            'UPDATE questions SET question_type = ?, content = ?, difficulty_level = ?, points = ?, options = ?, order_num = ? WHERE id = ?'
        );

        const batch = [];

        questions.forEach((q, idx) => {
            let optionsJson = null;
            if (q.question_type === 'mcq') optionsJson = JSON.stringify(q.options);
            else if (q.question_type === 'true_false') optionsJson = JSON.stringify(q.statements);

            // Check if this is an existing question
            if (existingIds.includes(q.id)) {
                // UPDATE
                batch.push(updateStmt.bind(
                    q.question_type,
                    q.content,
                    q.difficulty_level,
                    q.points || 1.0,
                    optionsJson,
                    idx,
                    q.id
                ));
            } else {
                // INSERT (Treat as new)
                batch.push(insertStmt.bind(
                    id,
                    q.question_type,
                    q.content,
                    q.difficulty_level,
                    q.points || 1.0,
                    optionsJson,
                    idx
                ));
            }
        });

        if (batch.length > 0) {
            await c.env.DB.batch(batch);
        }
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Update exam error:', error);
    return c.json({ error: 'Failed to update exam' }, 500)
  }
})

// Delete exam
app.delete('/api/exams/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM exams WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete exam' }, 500)
  }
})

// ============================================
// API ROUTES - RESULTS MANAGEMENT
// ============================================

// Submit exam result
app.post('/api/results', async (c) => {
  try {
    const { student_id, exam_id, answers } = await c.req.json()
    
    // Verify Exam Constraints (Deadline & Attempts)
    const exam = await c.env.DB.prepare('SELECT * FROM exams WHERE id = ?').bind(exam_id).first()
    
    if (!exam) return c.json({ error: 'Exam not found' }, 404)

    // Check deadline
    if (exam.deadline) {
        const now = new Date();
        const deadline = new Date(exam.deadline);
        if (now > deadline) {
            return c.json({ error: 'Hết thời hạn nộp bài' }, 403)
        }
    }

    // Check attempts limit
    if (exam.max_attempts > 0) {
        const attempts = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM results WHERE exam_id = ? AND student_id = ?'
        ).bind(exam_id, student_id).first()
        
        if (attempts && attempts.count >= exam.max_attempts) {
            return c.json({ error: 'Đã hết số lần làm bài cho phép' }, 403)
        }
    }

    // Get exam questions to calculate score
    const { results: questions } = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE exam_id = ?'
    ).bind(exam_id).all()

    let score = 0
    let maxScore = 0

    // Calculate score
    for (const question of questions) {
      maxScore += question.points

      const answer = answers[question.id]
      if (!answer) continue

      const options = question.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : [];

      if (question.question_type === 'mcq') {
        // Find correct option in the JSON array
        // Assuming options structure like [{id: 1, option_text: "A", is_correct: true}, ...]
        // Note: With JSON, we might not have 'id' if newly created, so we rely on index or we need to ensure IDs are managed if needed.
        // For simplicity, let's assume the frontend sends the index or we match by content, BUT
        // the previous logic compared IDs. 
        // FIX: The frontend likely sends 'selected_option' which might be an ID or index.
        // Since we are moving to JSON, let's assume 'selected_option' is the INDEX (0-3) or we need to assign IDs.
        // Let's stick to simple index matching if IDs are not guaranteed, OR assume options have 'is_correct' flag.
        
        // Let's look at the answer structure: answers[question.id] = { selected_option: ... }
        // If we want to be safe, we check if the selected option index has is_correct=true.
        
        // However, the frontend might still be sending IDs if it was built that way.
        // If we want to support the OLD frontend, this is a breaking change unless we map things carefully.
        // Given the user asked to "change structure", I assume I can update logic.
        
        // New Logic: answers[question.id].selected_option_index is the best way.
        // If the current frontend sends IDs, we might have a problem.
        // Let's assume we check the option at the selected index.

        // BACKWARD COMPATIBILITY / ROBUSTNESS:
        // Pass the selected option index from frontend.
        const selectedIndex = answer.selected_option_index ?? answer.selected_option; // Try to handle both if possible, or just standardise on one.

        // Find the correct option in our stored JSON
        const correctOption = options.find(o => o.is_correct);
        
        // Check if the selected option matches the correct one. 
        // If selectedIndex is a number (0-based index)
        if (typeof selectedIndex === 'number' && options[selectedIndex] && options[selectedIndex].is_correct) {
             score += question.points;
        } 
        // Fallback: if they send the actual text or ID, it gets complicated. 
        // Let's assume the frontend will be updated or uses indices.
      } else if (question.question_type === 'true_false') {
        const statements = options; // For true_false, options column holds statements
        let correctCount = 0;
        
        // Verify statements
        if (Array.isArray(statements)) {
           for (let i = 0; i < statements.length; i++) {
             const stmt = statements[i];
             // Answer format: answers[question.id].statements = { "0": true, "1": false } (keys are indices)
             const studentAnswer = answer.statements && answer.statements[i]; // Access by index
             
             if (studentAnswer == stmt.is_correct) {
               correctCount++;
             }
           }
           score += (correctCount / statements.length) * question.points;
        }
      }
      // Essay questions are not auto-graded
    }

    // Save result
    const result = await c.env.DB.prepare(
      'INSERT INTO results (student_id, exam_id, score, max_score, answers) VALUES (?, ?, ?, ?, ?)'
    ).bind(student_id, exam_id, score, maxScore, JSON.stringify(answers)).run()

    return c.json({ success: true, id: result.meta.last_row_id, score, maxScore })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to submit result' }, 500)
  }
})

// Update result (Manual Grading)
app.put('/api/results/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { score, answers } = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE results 
      SET score = ?, answers = ?
      WHERE id = ?
    `).bind(score, JSON.stringify(answers), id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update result' }, 500)
  }
})

// Delete result (Reset student exam)
app.delete('/api/results/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM results WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete result' }, 500)
  }
})

// Get student results
app.get('/api/students/:studentId/results', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, e.title as exam_title, e.folder_id 
      FROM results r 
      LEFT JOIN exams e ON r.exam_id = e.id 
      WHERE r.student_id = ? 
      ORDER BY r.submitted_at DESC
    `).bind(studentId).all()

    return c.json({ results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch results' }, 500)
  }
})

// Get exam results (all students)
app.get('/api/exams/:examId/results', async (c) => {
  try {
    const examId = c.req.param('examId')
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, s.student_code, s.name as student_name, s.class 
      FROM results r 
      LEFT JOIN students s ON r.student_id = s.id 
      WHERE r.exam_id = ? 
      ORDER BY r.score DESC
    `).bind(examId).all()

    return c.json({ results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch results' }, 500)
  }
})

// Export exam results to CSV
app.get('/api/exams/:examId/export', async (c) => {
  try {
    const examId = c.req.param('examId')
    
    // Get exam details
    const exam = await c.env.DB.prepare('SELECT title FROM exams WHERE id = ?').bind(examId).first()
    if (!exam) return c.text('Exam not found', 404)

    // Get all results
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, s.student_code, s.name as student_name, s.class 
      FROM results r 
      LEFT JOIN students s ON r.student_id = s.id 
      WHERE r.exam_id = ? 
      ORDER BY s.class, s.student_code
    `).bind(examId).all()

    // Generate CSV
    const headers = ['Mã HS', 'Họ tên', 'Lớp', 'Điểm số', 'Điểm tối đa', 'Phần trăm', 'Thời gian nộp']
    const csvRows = [headers.join(',')]

    for (const r of results) {
      const percentage = (r.score / r.max_score * 100).toFixed(1)
      const submittedAt = new Date(r.submitted_at).toLocaleString('vi-VN')
      csvRows.push([
        r.student_code,
        `"${r.student_name}"`, // Quote name to handle commas
        r.class,
        r.score,
        r.max_score,
        `${percentage}%`,
        `"${submittedAt}"`
      ].join(','))
    }

    const csvContent = '\uFEFF' + csvRows.join('\n') // Add BOM for Excel support

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Ket_qua_${exam.title.replace(/\s+/g, '_')}.csv"`
      }
    })
  } catch (error) {
    console.error(error)
    return c.text('Export failed', 500)
  }
})

// ============================================
// API ROUTES - AI GENERATION
// ============================================

// Generate exam questions using AI with multiple providers
app.post('/api/ai/generate-questions', async (c) => {
  try {
    const { provider = 'gemini', topic, difficulty_level, question_type, count, api_key } = await c.req.json()

    if (!api_key) {
      return c.json({ error: 'Vui lòng nhập API Key' }, 400)
    }

    if (!topic) {
      return c.json({ error: 'Vui lòng nhập chủ đề' }, 400)
    }

    let questions = []

    // Route to appropriate provider
    switch (provider) {
      case 'gemini':
        questions = await generateWithGemini(topic, difficulty_level, question_type, count, api_key)
        break
      case 'openai':
        questions = await generateWithOpenAI(topic, difficulty_level, question_type, count, api_key)
        break
      case 'claude':
        questions = await generateWithClaude(topic, difficulty_level, question_type, count, api_key)
        break
      default:
        return c.json({ error: `Nhà cung cấp không được hỗ trợ: ${provider}` }, 400)
    }

    // Ensure points are set based on type if missing
    questions.forEach((q: any) => {
      if (!q.points) {
        q.points = question_type === 'essay' ? 3.0 : (question_type === 'true_false' ? 2.0 : 1.0)
      }
      q.question_type = question_type // Force type consistency
      if (!q.id) q.id = Date.now() + Math.random()
    })

    return c.json({ success: true, questions })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return c.json({ error: 'Lỗi sinh câu hỏi: ' + error.message }, 500)
  }
})

// Helper function: Generate questions with Gemini
async function generateWithGemini(topic: string, difficulty: string, type: string, count: number, apiKey: string) {
  const prompt = `
    Generate ${count} ${type} questions about "${topic}" (difficulty: ${difficulty}) in Vietnamese.
    Return ONLY a raw JSON array (no markdown code blocks) with this exact schema:
    [
      {
        "content": "Question text",
        "difficulty_level": "${difficulty}",
        "points": 1.0,
        "question_type": "${type}",
        // For MCQ only:
        "options": [
          {"option_text": "A", "is_correct": true},
          {"option_text": "B", "is_correct": false},
          {"option_text": "C", "is_correct": false},
          {"option_text": "D", "is_correct": false}
        ],
        // For True/False only:
        "statements": [
          {"statement_text": "Statement 1", "is_correct": true},
          {"statement_text": "Statement 2", "is_correct": false},
          {"statement_text": "Statement 3", "is_correct": true},
          {"statement_text": "Statement 4", "is_correct": false}
        ]
      }
    ]
  `

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const errorJson = JSON.parse(errorText)
      const errorMessage = errorJson.error?.message || errorText
      
      // Provide more specific error messages
      if (response.status === 400) {
        throw new Error(`Yêu cầu không hợp lệ: ${errorMessage}`)
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(`API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại API Key.`)
      } else if (response.status === 404) {
        throw new Error(`Mô hình không tìm thấy. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.`)
      } else if (response.status === 429) {
        throw new Error(`Đã vượt quá giới hạn số lần gọi API. Vui lòng đợi một chút rồi thử lại.`)
      } else if (response.status === 500 || response.status === 503) {
        throw new Error(`Lỗi server Gemini. Vui lòng thử lại sau.`)
      } else {
        throw new Error(`Lỗi Gemini API (${response.status}): ${errorMessage}`)
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Lỗi')) {
        throw e // Re-throw our custom error messages
      }
      throw new Error(`Lỗi Gemini API: ${errorText}`)
    }
  }

  const data = await response.json()
  const rawText = data.candidates[0].content.parts[0].text
  const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
  
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    console.error("Failed to parse JSON:", jsonString)
    throw new Error("AI trả về dữ liệu không đúng định dạng JSON.")
  }
}

// Helper function: Generate questions with OpenAI
async function generateWithOpenAI(topic: string, difficulty: string, type: string, count: number, apiKey: string) {
  const prompt = `Generate ${count} ${type} questions about "${topic}" (difficulty: ${difficulty}) in Vietnamese.
Return ONLY a JSON array with this schema:
[{
  "content": "Question text",
  "difficulty_level": "${difficulty}",
  "points": 1.0,
  "question_type": "${type}",
  "options": [{"option_text": "A", "is_correct": true}, {"option_text": "B", "is_correct": false}, {"option_text": "C", "is_correct": false}, {"option_text": "D", "is_correct": false}],
  "statements": [{"statement_text": "Statement 1", "is_correct": true}, {"statement_text": "Statement 2", "is_correct": false}, {"statement_text": "Statement 3", "is_correct": true}, {"statement_text": "Statement 4", "is_correct": false}]
}]`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a chemistry teacher creating exam questions. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API Error: ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    const parsed = JSON.parse(content)
    return parsed.questions || parsed
  } catch (e) {
    console.error("Failed to parse OpenAI response:", content)
    throw new Error("OpenAI trả về dữ liệu không đúng định dạng.")
  }
}

// Helper function: Generate questions with Claude
async function generateWithClaude(topic: string, difficulty: string, type: string, count: number, apiKey: string) {
  const prompt = `Generate ${count} ${type} questions about "${topic}" (difficulty: ${difficulty}) in Vietnamese.
Return ONLY a JSON array with this schema:
[{
  "content": "Question text",
  "difficulty_level": "${difficulty}",
  "points": 1.0,
  "question_type": "${type}",
  "options": [{"option_text": "A", "is_correct": true}, {"option_text": "B", "is_correct": false}, {"option_text": "C", "is_correct": false}, {"option_text": "D", "is_correct": false}],
  "statements": [{"statement_text": "Statement 1", "is_correct": true}, {"statement_text": "Statement 2", "is_correct": false}, {"statement_text": "Statement 3", "is_correct": true}, {"statement_text": "Statement 4", "is_correct": false}]
}]`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API Error: ${errorText}`)
  }

  const data = await response.json()
  const content = data.content[0].text
  const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim()
  
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    console.error("Failed to parse Claude response:", content)
    throw new Error("Claude trả về dữ liệu không đúng định dạng.")
  }
}



// ============================================
// MAIN PAGE
// ============================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chemistry LMS - Hệ thống quản lý học tập Hóa học</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-12">
            <div class="text-center mb-12">
                <h1 class="text-5xl font-bold text-indigo-900 mb-4">
                    <i class="fas fa-flask mr-3"></i>
                    Chemistry LMS
                </h1>
                <p class="text-xl text-gray-700">Hệ thống quản lý học tập môn Hóa học</p>
            </div>

            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <!-- Teacher Login Card -->
                <div class="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
                    <div class="text-center mb-6">
                        <div class="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-chalkboard-teacher text-4xl text-indigo-600"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800">Giáo viên</h2>
                        <p class="text-gray-600 mt-2">Quản lý học sinh và đề thi</p>
                    </div>
                    <a href="/teacher" class="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center">
                        Đăng nhập
                        <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>

                <!-- Student Login Card -->
                <div class="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
                    <div class="text-center mb-6">
                        <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-user-graduate text-4xl text-green-600"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800">Học sinh</h2>
                        <p class="text-gray-600 mt-2">Làm bài thi trực tuyến</p>
                    </div>
                    <a href="/student" class="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center">
                        Đăng nhập
                        <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>

            <!-- Features Section -->
            <div class="mt-16 max-w-6xl mx-auto">
                <h3 class="text-3xl font-bold text-center text-indigo-900 mb-8">Tính năng nổi bật</h3>
                <div class="grid md:grid-cols-3 gap-6">
                    <div class="bg-white rounded-xl p-6 shadow-lg">
                        <div class="text-indigo-600 text-3xl mb-4"><i class="fas fa-robot"></i></div>
                        <h4 class="font-bold text-lg mb-2">AI Sinh đề tự động</h4>
                        <p class="text-gray-600">Tạo đề thi tự động với AI theo chủ đề và cấp độ</p>
                    </div>
                    <div class="bg-white rounded-xl p-6 shadow-lg">
                        <div class="text-green-600 text-3xl mb-4"><i class="fas fa-file-import"></i></div>
                        <h4 class="font-bold text-lg mb-2">Import/Export</h4>
                        <p class="text-gray-600">Nhập đề từ Excel/CSV/JSON và xuất báo cáo</p>
                    </div>
                    <div class="bg-white rounded-xl p-6 shadow-lg">
                        <div class="text-purple-600 text-3xl mb-4"><i class="fas fa-chart-line"></i></div>
                        <h4 class="font-bold text-lg mb-2">Theo dõi kết quả</h4>
                        <p class="text-gray-600">Tự động chấm điểm và lưu kết quả chi tiết</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

export default app

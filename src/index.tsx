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
  return c.redirect('/static/teacher.html')
})

app.get('/student', (c) => {
  return c.redirect('/static/student.html')
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

    // Get options and statements for each question
    for (const question of questions) {
      if (question.question_type === 'mcq') {
        const { results: options } = await c.env.DB.prepare(
          'SELECT * FROM question_options WHERE question_id = ? ORDER BY order_num'
        ).bind(question.id).all()
        question.options = options
      } else if (question.question_type === 'true_false') {
        const { results: statements } = await c.env.DB.prepare(
          'SELECT * FROM question_statements WHERE question_id = ? ORDER BY order_num'
        ).bind(question.id).all()
        question.statements = statements
      }
    }

    return c.json({ exam, questions })
  } catch (error) {
    return c.json({ error: 'Failed to fetch exam' }, 500)
  }
})

// Create exam
app.post('/api/exams', async (c) => {
  try {
    const { folder_id, title, description, duration, source, questions } = await c.req.json()
    
    // Create exam
    const examResult = await c.env.DB.prepare(
      'INSERT INTO exams (folder_id, title, description, duration, source) VALUES (?, ?, ?, ?, ?)'
    ).bind(folder_id, title, description || '', duration || 60, source || 'manual').run()

    const examId = examResult.meta.last_row_id

    // Create questions if provided
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const questionResult = await c.env.DB.prepare(
          'INSERT INTO questions (exam_id, question_type, content, difficulty_level, points, order_num) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(examId, q.question_type, q.content, q.difficulty_level, q.points || 1.0, i).run()

        const questionId = questionResult.meta.last_row_id

        // Add options for MCQ
        if (q.question_type === 'mcq' && q.options) {
          for (let j = 0; j < q.options.length; j++) {
            const opt = q.options[j]
            await c.env.DB.prepare(
              'INSERT INTO question_options (question_id, option_text, is_correct, order_num) VALUES (?, ?, ?, ?)'
            ).bind(questionId, opt.option_text, opt.is_correct ? 1 : 0, j).run()
          }
        }

        // Add statements for True/False
        if (q.question_type === 'true_false' && q.statements) {
          for (let j = 0; j < q.statements.length; j++) {
            const stmt = q.statements[j]
            await c.env.DB.prepare(
              'INSERT INTO question_statements (question_id, statement_text, is_correct, order_num) VALUES (?, ?, ?, ?)'
            ).bind(questionId, stmt.statement_text, stmt.is_correct ? 1 : 0, j).run()
          }
        }
      }
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
    const { title, description, duration } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE exams SET title = ?, description = ?, duration = ? WHERE id = ?'
    ).bind(title, description || '', duration || 60, id).run()

    return c.json({ success: true })
  } catch (error) {
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

      if (question.question_type === 'mcq') {
        // Get correct option
        const correctOption = await c.env.DB.prepare(
          'SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1'
        ).bind(question.id).first()

        if (correctOption && answer.selected_option == correctOption.id) {
          score += question.points
        }
      } else if (question.question_type === 'true_false') {
        // Get correct statements
        const { results: statements } = await c.env.DB.prepare(
          'SELECT id, is_correct FROM question_statements WHERE question_id = ?'
        ).bind(question.id).all()

        let correctCount = 0
        for (const stmt of statements) {
          if (answer.statements && answer.statements[stmt.id] == stmt.is_correct) {
            correctCount++
          }
        }

        // Proportional score
        score += (correctCount / statements.length) * question.points
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

// ============================================
// API ROUTES - AI GENERATION
// ============================================

// Generate exam questions using AI with OpenAI
app.post('/api/ai/generate-questions', async (c) => {
  try {
    const { topic, difficulty_level, question_type, count } = await c.req.json()
    
    // Import OpenAI - use direct fetch API for Cloudflare Workers compatibility
    // Access env vars from Cloudflare Workers context
    const apiKey = c.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL
    
    if (!apiKey || !baseURL) {
      return c.json({ error: 'OpenAI API not configured' }, 500)
    }

    // Create prompt based on question type
    let systemPrompt = `Bạn là một giáo viên Hóa học chuyên nghiệp. Nhiệm vụ của bạn là tạo các câu hỏi chất lượng cao về chủ đề: "${topic}".
Cấp độ: ${difficulty_level} (Biết = kiến thức cơ bản, Hiểu = hiểu khái niệm, Vận dụng = áp dụng kiến thức).
Số lượng câu hỏi: ${count || 5}

Trả về JSON array với cấu trúc chính xác như sau:`

    if (question_type === 'mcq') {
      systemPrompt += `
[
  {
    "question_type": "mcq",
    "content": "Nội dung câu hỏi",
    "difficulty_level": "${difficulty_level}",
    "points": 1.0,
    "options": [
      {"option_text": "Đáp án A", "is_correct": true},
      {"option_text": "Đáp án B", "is_correct": false},
      {"option_text": "Đáp án C", "is_correct": false},
      {"option_text": "Đáp án D", "is_correct": false}
    ]
  }
]
Lưu ý: CHỈ có 1 đáp án đúng cho mỗi câu hỏi MCQ.`
    } else if (question_type === 'true_false') {
      systemPrompt += `
[
  {
    "question_type": "true_false",
    "content": "Đánh giá các mệnh đề sau về ${topic}:",
    "difficulty_level": "${difficulty_level}",
    "points": 2.0,
    "statements": [
      {"statement_text": "Mệnh đề 1", "is_correct": true},
      {"statement_text": "Mệnh đề 2", "is_correct": false},
      {"statement_text": "Mệnh đề 3", "is_correct": true},
      {"statement_text": "Mệnh đề 4", "is_correct": false}
    ]
  }
]
Lưu ý: Mỗi câu hỏi phải có ĐÚNG 4 mệnh đề.`
    } else if (question_type === 'essay') {
      systemPrompt += `
[
  {
    "question_type": "essay",
    "content": "Nội dung câu hỏi tự luận yêu cầu học sinh giải thích, phân tích",
    "difficulty_level": "${difficulty_level}",
    "points": 3.0
  }
]`
    }

    systemPrompt += '\n\nTrả về ĐÚNG định dạng JSON, KHÔNG có markdown hay text khác.'

    // Call OpenAI API using fetch
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Tạo ${count || 5} câu hỏi ${question_type} về ${topic} ở cấp độ ${difficulty_level}` }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const completion = await response.json()
    const responseText = completion.choices[0].message.content
    
    // Parse JSON response
    let questions = []
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      questions = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      // Fallback to mock data if parsing fails
      questions = [{
        question_type,
        content: `Question générée sur ${topic}`,
        difficulty_level,
        points: question_type === 'essay' ? 3.0 : (question_type === 'true_false' ? 2.0 : 1.0),
        ...(question_type === 'mcq' && {
          options: [
            { option_text: 'Option A', is_correct: true },
            { option_text: 'Option B', is_correct: false },
            { option_text: 'Option C', is_correct: false },
            { option_text: 'Option D', is_correct: false }
          ]
        }),
        ...(question_type === 'true_false' && {
          statements: [
            { statement_text: 'Affirmation 1', is_correct: true },
            { statement_text: 'Affirmation 2', is_correct: false },
            { statement_text: 'Affirmation 3', is_correct: true },
            { statement_text: 'Affirmation 4', is_correct: false }
          ]
        })
      }]
    }

    return c.json({ success: true, questions })
  } catch (error) {
    console.error('AI generation error:', error)
    return c.json({ error: 'Failed to generate questions: ' + error.message }, 500)
  }
})

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

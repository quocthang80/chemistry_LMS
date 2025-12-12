let currentStudent = null;
let exams = [];
let currentExam = null;
let currentQuestions = [];
let answers = {};
let timerInterval = null;
let timeRemaining = 0;

// Login
async function login() {
    const student_code = document.getElementById('studentCode').value;

    if (!student_code) {
        alert('Vui lòng nhập mã số học sinh!');
        return;
    }

    try {
        const response = await axios.post('/api/auth/student/login', {
            student_code
        });

        if (response.data.success) {
            currentStudent = response.data.student;
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('dashboardScreen').classList.remove('hidden');
            document.getElementById('studentInfo').textContent = 
                `${currentStudent.name} - ${currentStudent.class}`;
            
            loadExams();
            loadResults();
        }
    } catch (error) {
        alert('Không tìm thấy học sinh với mã số này!');
    }
}

function logout() {
    currentStudent = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
    document.getElementById('examScreen').classList.add('hidden');
}

// Load available exams
async function loadExams() {
    try {
        const response = await axios.get('/api/exams');
        exams = response.data.exams;
        renderExamsList();
    } catch (error) {
        console.error('Failed to load exams:', error);
    }
}

function renderExamsList() {
    const list = document.getElementById('examsList');
    
    if (exams.length === 0) {
        list.innerHTML = '<div class="col-span-full text-center text-gray-500 py-12">Chưa có đề thi nào</div>';
        return;
    }

    list.innerHTML = exams.map(exam => `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="bg-indigo-100 p-3 rounded-lg">
                    <i class="fas fa-file-alt text-2xl text-indigo-600"></i>
                </div>
                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${exam.folder_name || 'General'}</span>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${exam.title}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">${exam.description || 'Không có mô tả'}</p>
            <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span><i class="fas fa-clock mr-1"></i>${exam.duration} phút</span>
                <span><i class="fas fa-calendar mr-1"></i>${new Date(exam.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <button onclick="startExam(${exam.id})" class="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                <i class="fas fa-play mr-2"></i>Bắt đầu
            </button>
        </div>
    `).join('');
}

// Load student results
async function loadResults() {
    try {
        const response = await axios.get(`/api/students/${currentStudent.id}/results`);
        const results = response.data.results;
        renderResultsList(results);
    } catch (error) {
        console.error('Failed to load results:', error);
    }
}

function renderResultsList(results) {
    const list = document.getElementById('resultsList');
    
    if (results.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Bạn chưa hoàn thành bài thi nào</p>';
        return;
    }

    list.innerHTML = results.map(result => {
        const percentage = (result.score / result.max_score * 100).toFixed(1);
        const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800">${result.exam_title}</h4>
                    <p class="text-sm text-gray-500">
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(result.submitted_at).toLocaleString('vi-VN')}
                    </p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold ${colorClass}">
                        ${result.score.toFixed(1)}/${result.max_score}
                    </div>
                    <div class="text-sm text-gray-500">${percentage}%</div>
                </div>
            </div>
        `;
    }).join('');
}

// Start exam
async function startExam(examId) {
    if (!confirm('Bạn có chắc muốn bắt đầu làm bài thi này?')) return;

    try {
        const response = await axios.get(`/api/exams/${examId}`);
        currentExam = response.data.exam;
        currentQuestions = response.data.questions;
        answers = {};

        // Show exam screen
        document.getElementById('dashboardScreen').classList.add('hidden');
        document.getElementById('examScreen').classList.remove('hidden');

        // Set exam info
        document.getElementById('examTitle').textContent = currentExam.title;
        document.getElementById('examDescription').textContent = currentExam.description || '';

        // Render questions
        renderQuestions();

        // Start timer
        timeRemaining = currentExam.duration * 60; // Convert to seconds
        startTimer();
    } catch (error) {
        alert('Lỗi khi tải đề thi!');
    }
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    
    container.innerHTML = currentQuestions.map((question, idx) => {
        let questionHTML = `
            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-600">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded">Câu ${idx + 1}</span>
                            <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">${question.difficulty_level}</span>
                            <span class="text-sm text-gray-500">${question.points} điểm</span>
                        </div>
                        <p class="text-lg font-medium text-gray-800">${question.content}</p>
                    </div>
                </div>
        `;

        if (question.question_type === 'mcq') {
            questionHTML += '<div class="space-y-3">';
            question.options.forEach(option => {
                questionHTML += `
                    <label class="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                        <input type="radio" name="question_${question.id}" value="${option.id}" 
                               onchange="saveAnswer(${question.id}, 'selected_option', ${option.id})"
                               class="w-4 h-4 text-indigo-600">
                        <span class="ml-3 text-gray-700">${option.option_text}</span>
                    </label>
                `;
            });
            questionHTML += '</div>';
        } 
        else if (question.question_type === 'true_false') {
            questionHTML += '<div class="space-y-3">';
            question.statements.forEach((stmt, stmtIdx) => {
                questionHTML += `
                    <div class="p-3 border-2 border-gray-200 rounded-lg">
                        <p class="text-gray-800 mb-2">${stmtIdx + 1}. ${stmt.statement_text}</p>
                        <div class="flex space-x-4">
                            <label class="flex items-center cursor-pointer">
                                <input type="radio" name="statement_${stmt.id}" value="1" 
                                       onchange="saveStatementAnswer(${question.id}, ${stmt.id}, 1)"
                                       class="w-4 h-4 text-green-600">
                                <span class="ml-2 text-green-600 font-medium">Đúng</span>
                            </label>
                            <label class="flex items-center cursor-pointer">
                                <input type="radio" name="statement_${stmt.id}" value="0" 
                                       onchange="saveStatementAnswer(${question.id}, ${stmt.id}, 0)"
                                       class="w-4 h-4 text-red-600">
                                <span class="ml-2 text-red-600 font-medium">Sai</span>
                            </label>
                        </div>
                    </div>
                `;
            });
            questionHTML += '</div>';
        }
        else if (question.question_type === 'essay') {
            questionHTML += `
                <textarea rows="6" 
                          onchange="saveAnswer(${question.id}, 'essay_text', this.value)"
                          class="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                          placeholder="Nhập câu trả lời của bạn..."></textarea>
            `;
        }

        questionHTML += '</div>';
        return questionHTML;
    }).join('');
}

function saveAnswer(questionId, field, value) {
    if (!answers[questionId]) {
        answers[questionId] = {};
    }
    answers[questionId][field] = value;
}

function saveStatementAnswer(questionId, statementId, value) {
    if (!answers[questionId]) {
        answers[questionId] = { statements: {} };
    }
    if (!answers[questionId].statements) {
        answers[questionId].statements = {};
    }
    answers[questionId].statements[statementId] = value;
}

// Timer
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Hết giờ! Bài thi sẽ được nộp tự động.');
            submitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Warning color when less than 5 minutes
    if (timeRemaining < 300) {
        document.getElementById('timer').classList.add('text-red-300');
    }
}

// Submit exam
async function submitExam() {
    if (!confirm('Bạn có chắc muốn nộp bài?')) return;

    clearInterval(timerInterval);

    try {
        const response = await axios.post('/api/results', {
            student_id: currentStudent.id,
            exam_id: currentExam.id,
            answers: answers
        });

        if (response.data.success) {
            // Show result modal
            document.getElementById('finalScore').textContent = response.data.score.toFixed(1);
            document.getElementById('finalMaxScore').textContent = `Tổng điểm: ${response.data.maxScore}`;
            document.getElementById('resultModal').classList.remove('hidden');
        }
    } catch (error) {
        alert('Lỗi khi nộp bài!');
    }
}

function cancelExam() {
    if (!confirm('Bạn có chắc muốn hủy bài thi? Kết quả sẽ không được lưu.')) return;
    
    clearInterval(timerInterval);
    backToDashboard();
}

function backToDashboard() {
    document.getElementById('examScreen').classList.add('hidden');
    document.getElementById('resultModal').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    
    currentExam = null;
    currentQuestions = [];
    answers = {};
    
    loadResults();
}

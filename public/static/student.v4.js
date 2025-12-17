let currentStudent = null;
let exams = [];
let currentExam = null;
let currentQuestions = [];

let answers = {};
let studentResults = [];
let timerInterval = null;
let timeRemaining = 0;

// Render chemical formulas in the document
function renderChemistry(element = document.body) {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(element, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
            ],
            throwOnError: false,
            trust: true
        });
    }
}

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

    list.innerHTML = exams.map(exam => {
        // Calculate constraints
        const now = new Date();
        const deadline = exam.deadline ? new Date(exam.deadline) : null;
        const isExpired = deadline && now > deadline;
        
        const attemptsUsed = studentResults.filter(r => r.exam_id === exam.id).length;
        const isLimitReached = exam.max_attempts > 0 && attemptsUsed >= exam.max_attempts;
        
        const isDisabled = isExpired || isLimitReached;
        
        let statusBadge = '';
        if (isExpired) statusBadge = '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Đã hết hạn</span>';
        else if (isLimitReached) statusBadge = '<span class="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Hết lượt làm bài</span>';

        return `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${isDisabled ? 'opacity-75 bg-gray-50' : ''}">
            <div class="flex items-start justify-between mb-4">
                <div class="bg-indigo-100 p-3 rounded-lg">
                    <i class="fas fa-file-alt text-2xl text-indigo-600"></i>
                </div>
                <div class="flex flex-col items-end space-y-1">
                    <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${exam.folder_name || 'General'}</span>
                    ${statusBadge}
                </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${exam.title}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">${exam.description || 'Không có mô tả'}</p>
            
            <div class="space-y-2 text-sm text-gray-500 mb-4">
                <div class="flex items-center justify-between">
                    <span><i class="fas fa-clock mr-1"></i>${exam.duration} phút</span>
                    <span><i class="fas fa-calendar mr-1"></i>${new Date(exam.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                ${exam.deadline ? `
                <div class="text-orange-600">
                    <i class="fas fa-hourglass-end mr-1"></i>Hạn chót: ${new Date(exam.deadline).toLocaleString('vi-VN')}
                </div>` : ''}
                ${exam.max_attempts > 0 ? `
                <div class="text-blue-600">
                    <i class="fas fa-redo mr-1"></i>Số lần: ${attemptsUsed}/${exam.max_attempts}
                </div>` : ''}
            </div>

            <button onclick="startExam(${exam.id})" ${isDisabled ? 'disabled' : ''} 
                    class="w-full py-2 rounded-lg font-semibold transition-colors
                    ${isDisabled ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}">
                <i class="fas fa-play mr-2"></i>Bắt đầu
            </button>
        </div>
    `}).join('');
}

// Load student results
async function loadResults() {
    try {
        const response = await axios.get(`/api/students/${currentStudent.id}/results`);
        studentResults = response.data.results;
        renderResultsList(studentResults);
        renderExamsList(); // Re-render exams to update attempt counts
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
                <div class="text-right flex items-center space-x-4">
                    <div>
                        <div class="text-2xl font-bold ${colorClass}">
                            ${result.score.toFixed(1)}/${result.max_score}
                        </div>
                        <div class="text-sm text-gray-500">${percentage}%</div>
                    </div>
                    <button onclick="viewResultDetails(${result.id}, ${result.exam_id})" class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded bg-blue-50 border border-blue-200">
                        <i class="fas fa-eye mr-1"></i>Chi tiết
                    </button>
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

        // Parse questions options and shuffle if enabled
        currentQuestions.forEach(q => {
            if (typeof q.options === 'string') {
                try { q.options = JSON.parse(q.options); } catch(e) { console.error("Failed to parse options:", e); }
            }
            if (typeof q.statements === 'string') {
                try { q.statements = JSON.parse(q.statements); } catch(e) { console.error("Failed to parse statements:", e); }
            }

            // Shuffle options if enabled for MCQ
            if (currentExam.shuffle_options && q.question_type === 'mcq' && q.options) {
                // Add original index to track answer
                q.options = q.options.map((opt, idx) => ({ ...opt, _originalIndex: idx }));
                // Fisher-Yates shuffle
                for (let i = q.options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
                }
            }
        });

        // Render questions
        renderQuestions();

        // Start timer
        timeRemaining = currentExam.duration * 60; // Convert to seconds
        startTimer();
    } catch (error) {
        console.error(error);
        alert('Không thể bắt đầu bài thi');
        backToDashboard(); // Using existing backToDashboard function
    }
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer'); // Keep original ID
    
    container.innerHTML = currentQuestions.map((question, idx) => {
        let questionHTML = `
            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-600 mb-6">
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
            question.options.forEach((option, optIdx) => {
                // Use _originalIndex if shuffled, otherwise current index (optIdx)
                const valueToSave = option._originalIndex !== undefined ? option._originalIndex : optIdx;
                
                // Check if this option was previously selected (if answers exist)
                const isSelected = answers[question.id] && answers[question.id].selected_option === valueToSave;

                questionHTML += `
                    <label class="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50' : ''}">
                        <input type="radio" name="question_${question.id}" value="${valueToSave}" 
                               onchange="saveAnswer(${question.id}, 'selected_option', parseInt(this.value))"
                               class="w-4 h-4 text-indigo-600"
                               ${isSelected ? 'checked' : ''}>
                        <span class="ml-3 text-gray-700">${option.option_text}</span>
                    </label>
                `;
            });
            questionHTML += '</div>';
        } 
        else if (question.question_type === 'true_false') {
            questionHTML += '<div class="space-y-3">';
            question.statements.forEach((stmt, stmtIdx) => {
                // Check if this statement's answer was previously selected
                const statementAnswer = answers[question.id] && answers[question.id].statements ? answers[question.id].statements[stmtIdx] : undefined;
                const isTrueSelected = statementAnswer === true;
                const isFalseSelected = statementAnswer === false;

                questionHTML += `
                    <div class="p-3 border-2 border-gray-200 rounded-lg">
                        <p class="text-gray-800 mb-2">${stmtIdx + 1}. ${stmt.statement_text}</p>
                        <div class="flex space-x-4">
                            <label class="flex items-center cursor-pointer">
                                <input type="radio" name="statement_${question.id}_${stmtIdx}" value="true" 
                                       onchange="saveStatementAnswer(${question.id}, ${stmtIdx}, true)"
                                       class="w-4 h-4 text-green-600"
                                       ${isTrueSelected ? 'checked' : ''}>
                                <span class="ml-2 text-green-600 font-medium">Đúng</span>
                            </label>
                            <label class="flex items-center cursor-pointer">
                                <input type="radio" name="statement_${question.id}_${stmtIdx}" value="false" 
                                       onchange="saveStatementAnswer(${question.id}, ${stmtIdx}, false)"
                                       class="w-4 h-4 text-red-600"
                                       ${isFalseSelected ? 'checked' : ''}>
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
    
    // Render chemical formulas after DOM update
    setTimeout(() => renderChemistry(container), 50);
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

async function viewResultDetails(resultId, examId) {
    try {
        const [examResponse, resultsResponse] = await Promise.all([
            axios.get(`/api/exams/${examId}`),
            axios.get(`/api/students/${currentStudent.id}/results`) // We fetch all to find the specific one, simpler than new endpoint
        ]);
        
        const { exam, questions } = examResponse.data;
        const result = resultsResponse.data.results.find(r => r.id === resultId);
        
        if (!result) {
            alert('Không tìm thấy bài làm!');
            return;
        }

        const answers = JSON.parse(result.answers);
        
        let detailsHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-gray-800">Chi tiết bài làm</h3>
                <div class="text-right">
                    <div class="text-xl font-bold text-indigo-600">${result.score.toFixed(1)}/${result.max_score}</div>
                    <div class="text-sm text-gray-500">${new Date(result.submitted_at).toLocaleString('vi-VN')}</div>
                </div>
            </div>
            
            <div class="space-y-6">
        `;

        questions.forEach((q, idx) => {
            const answer = answers[q.id];
            detailsHTML += `
                <div class="bg-gray-50 border-2 rounded-xl p-4">
                    <div class="flex justify-between mb-3">
                        <div>
                            <span class="font-bold mr-2">Câu ${idx + 1}:</span>
                            <span class="text-gray-800">${q.content}</span>
                        </div>
                        <span class="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600 h-fit">${q.points} điểm</span>
                    </div>
            `;

            if (q.question_type === 'mcq' && q.options) {
                const selectedOption = answer ? q.options.find(o => o.id == answer.selected_option) : null;
                // If options are simple (no IDs originally), we rely on index.
                // In student.v3.js saveAnswer, we saved index as 'selected_option'
                const selectedIndex = answer ? answer.selected_option : -1;
                
                detailsHTML += '<div class="space-y-2">';
                q.options.forEach((opt, optIdx) => {
                    const isSelected = selectedIndex == optIdx;
                    const isCorrect = opt.is_correct;
                    
                    let bgClass = 'bg-white border-gray-200';
                    let icon = '';
                    
                    if (isCorrect) {
                        bgClass = 'bg-green-50 border-green-500';
                        icon = '<i class="fas fa-check text-green-600 mr-2"></i>';
                    } else if (isSelected) {
                        bgClass = 'bg-red-50 border-red-500';
                        icon = '<i class="fas fa-times text-red-600 mr-2"></i>';
                    }

                    if (isSelected && isCorrect) {
                        bgClass = 'bg-green-50 border-green-500';
                        icon = '<i class="fas fa-check-circle text-green-600 mr-2"></i>';
                    }

                    detailsHTML += `
                        <div class="flex items-center p-3 border-2 rounded-lg ${bgClass}">
                            ${icon}
                            <span class="${isCorrect || isSelected ? 'font-medium' : ''}">${opt.option_text}</span>
                        </div>
                    `;
                });
                detailsHTML += '</div>';
            } else if (q.question_type === 'true_false' && q.statements) {
                detailsHTML += '<div class="space-y-2">';
                q.statements.forEach((stmt, stmtIdx) => {
                    const studentAnswer = answer && answer.statements ? answer.statements[stmtIdx] : null;
                    const isCorrect = studentAnswer == stmt.is_correct;
                    const isAnswered = studentAnswer !== undefined && studentAnswer !== null;
                    
                    const bgClass = isAnswered 
                        ? (isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                        : 'bg-white border-gray-200';

                    detailsHTML += `
                        <div class="p-3 border rounded-lg ${bgClass}">
                            <p class="mb-1">${stmt.statement_text}</p>
                            <div class="text-xs flex gap-4">
                                <span class="${stmt.is_correct ? 'text-green-600 font-bold' : ''}">
                                    Đáp án: ${stmt.is_correct ? 'Đúng' : 'Sai'}
                                </span>
                                <span class="${!isCorrect && isAnswered ? 'text-red-600 font-bold' : 'text-gray-600'}">
                                    Bạn chọn: ${isAnswered ? (studentAnswer ? 'Đúng' : 'Sai') : 'Chưa chọn'}
                                </span>
                            </div>
                        </div>
                    `;
                });
                detailsHTML += '</div>';
            } else if (q.question_type === 'essay') {
                const essayText = answer && answer.essay_text ? answer.essay_text : 'Không có câu trả lời';
                detailsHTML += `
                    <div class="bg-white p-3 rounded border">
                        <p class="text-sm italic text-gray-600">"${essayText}"</p>
                        <p class="text-xs text-orange-500 mt-2">Đang chờ giáo viên chấm điểm</p>
                    </div>
                `;
            }

            detailsHTML += '</div>';
        });

        detailsHTML += `
            </div>
            <div class="sticky bottom-0 bg-white pt-4 mt-6 border-t">
                <button onclick="hideGenericModal()" class="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900">
                    Đóng
                </button>
            </div>
        `;

        showGenericModal(detailsHTML);

    } catch (error) {
        console.error(error);
        alert('Lỗi khi tải chi tiết bài làm!');
    }
}

// Modal Utilities
function showGenericModal(content) {
    const modal = document.getElementById('genericModal');
    const container = document.getElementById('genericModalContent');
    if (modal && container) {
        container.innerHTML = content;
        modal.classList.remove('hidden');
    }
}

function hideGenericModal() {
    const modal = document.getElementById('genericModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

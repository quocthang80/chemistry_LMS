let currentTeacher = null;
let students = [];
let folders = [];
let exams = [];

// Login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await axios.post('/api/auth/teacher/login', {
            username,
            password
        });

        if (response.data.success) {
            currentTeacher = response.data.teacher;
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('dashboardScreen').classList.remove('hidden');
            document.getElementById('teacherName').textContent = `Xin chào, ${currentTeacher.name}`;
            
            loadStudents();
            loadFolders();
            loadExams();
        }
    } catch (error) {
        alert('Đăng nhập thất bại! Vui lòng kiểm tra tên đăng nhập và mật khẩu.');
    }
}

function logout() {
    currentTeacher = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
}

// Tab Navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('[id^="tab"]').forEach(btn => {
        btn.classList.remove('border-indigo-600', 'text-indigo-600');
        btn.classList.add('text-gray-600');
    });

    // Show selected tab
    document.getElementById(tabName + 'Content').classList.remove('hidden');
    const tabButton = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    tabButton.classList.add('border-indigo-600', 'text-indigo-600');
    tabButton.classList.remove('text-gray-600');
}

// Students Management
async function loadStudents() {
    try {
        const response = await axios.get('/api/students');
        students = response.data.students;
        renderStudentsTable();
    } catch (error) {
        console.error('Failed to load students:', error);
    }
}

function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = students.map(student => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap font-medium">${student.student_code}</td>
            <td class="px-6 py-4 whitespace-nowrap">${student.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${student.class}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editStudent(${student.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteStudent(${student.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddStudentModal() {
    showModal(`
        <h3 class="text-2xl font-bold mb-4">Thêm học sinh mới</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Mã học sinh</label>
                <input type="text" id="studentCode" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Họ tên</label>
                <input type="text" id="studentName" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Lớp</label>
                <input type="text" id="studentClass" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div class="flex space-x-3">
                <button onclick="saveStudent()" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    Lưu
                </button>
                <button onclick="hideModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `);
}

async function saveStudent() {
    const student_code = document.getElementById('studentCode').value;
    const name = document.getElementById('studentName').value;
    const className = document.getElementById('studentClass').value;

    try {
        await axios.post('/api/students', {
            student_code,
            name,
            class: className
        });
        hideModal();
        loadStudents();
        alert('Thêm học sinh thành công!');
    } catch (error) {
        alert('Lỗi khi thêm học sinh!');
    }
}

async function deleteStudent(id) {
    if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;

    try {
        await axios.delete(`/api/students/${id}`);
        loadStudents();
        alert('Xóa học sinh thành công!');
    } catch (error) {
        alert('Lỗi khi xóa học sinh!');
    }
}

// Folders Management
async function loadFolders() {
    try {
        const response = await axios.get('/api/folders');
        folders = response.data.folders;
        renderFoldersGrid();
    } catch (error) {
        console.error('Failed to load folders:', error);
    }
}

function renderFoldersGrid() {
    const grid = document.getElementById('foldersGrid');
    grid.innerHTML = folders.map(folder => `
        <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div class="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center">
                    <i class="fas fa-folder text-white text-xl"></i>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editFolder(${folder.id})" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteFolder(${folder.id})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${folder.name}</h3>
            <p class="text-gray-600 text-sm">${folder.description || 'Không có mô tả'}</p>
        </div>
    `).join('');
}

function showAddFolderModal() {
    showModal(`
        <h3 class="text-2xl font-bold mb-4">Tạo thư mục mới</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Tên thư mục</label>
                <input type="text" id="folderName" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Mô tả</label>
                <textarea id="folderDescription" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea>
            </div>
            <div class="flex space-x-3">
                <button onclick="saveFolder()" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    Tạo
                </button>
                <button onclick="hideModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `);
}

async function saveFolder() {
    const name = document.getElementById('folderName').value;
    const description = document.getElementById('folderDescription').value;

    try {
        await axios.post('/api/folders', { name, description });
        hideModal();
        loadFolders();
        alert('Tạo thư mục thành công!');
    } catch (error) {
        alert('Lỗi khi tạo thư mục!');
    }
}

function editFolder(id) {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;

    showModal(`
        <h3 class="text-2xl font-bold mb-4">Chỉnh sửa thư mục</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Tên thư mục</label>
                <input type="text" id="folderName" value="${folder.name}" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Mô tả</label>
                <textarea id="folderDescription" rows="3" class="w-full px-4 py-2 border rounded-lg">${folder.description || ''}</textarea>
            </div>
            <div class="flex space-x-3">
                <button onclick="updateFolder(${id})" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    Cập nhật
                </button>
                <button onclick="hideModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `);
}

async function updateFolder(id) {
    const name = document.getElementById('folderName').value;
    const description = document.getElementById('folderDescription').value;

    if (!name) {
        alert('Vui lòng nhập tên thư mục!');
        return;
    }

    try {
        await axios.put(`/api/folders/${id}`, { name, description });
        hideModal();
        loadFolders();
        alert('Cập nhật thư mục thành công!');
    } catch (error) {
        alert('Lỗi khi cập nhật thư mục!');
    }
}

async function deleteFolder(id) {
    if (!confirm('Bạn có chắc muốn xóa thư mục này? Tất cả đề thi trong thư mục cũng sẽ bị xóa.')) return;

    try {
        await axios.delete(`/api/folders/${id}`);
        loadFolders();
        alert('Xóa thư mục thành công!');
    } catch (error) {
        alert('Lỗi khi xóa thư mục!');
    }
}

// Exams Management
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
    list.innerHTML = exams.map(exam => `
        <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">${exam.folder_name || 'No folder'}</span>
                        <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${exam.source === 'ai' ? 'AI Generated' : 'Manual'}</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${exam.title}</h3>
                    <p class="text-gray-600 text-sm mb-2">${exam.description || 'Không có mô tả'}</p>
                    <p class="text-sm text-gray-500">
                        <i class="fas fa-clock mr-1"></i>Thời gian: ${exam.duration} phút
                    </p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="viewExam(${exam.id})" class="text-green-600 hover:text-green-800">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="viewExamResults(${exam.id})" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button onclick="deleteExam(${exam.id})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showCreateExamModal() {
    const foldersOptions = folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    
    showModal(`
        <h3 class="text-2xl font-bold mb-4">Tạo đề thi mới</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Thư mục</label>
                <select id="examFolder" class="w-full px-4 py-2 border rounded-lg">
                    ${foldersOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Tiêu đề</label>
                <input type="text" id="examTitle" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Mô tả</label>
                <textarea id="examDescription" rows="2" class="w-full px-4 py-2 border rounded-lg"></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Thời gian (phút)</label>
                <input type="number" id="examDuration" value="60" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div class="border-t pt-4">
                <h4 class="font-bold mb-3">Thêm câu hỏi</h4>
                <div class="flex space-x-2 mb-3">
                    <button onclick="addQuestion('mcq')" class="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200">
                        <i class="fas fa-list mr-2"></i>MCQ
                    </button>
                    <button onclick="addQuestion('true_false')" class="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200">
                        <i class="fas fa-check-circle mr-2"></i>True/False
                    </button>
                    <button onclick="addQuestion('essay')" class="flex-1 bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200">
                        <i class="fas fa-pencil-alt mr-2"></i>Tự luận
                    </button>
                </div>
                <button onclick="showAIGenerateModal()" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-600">
                    <i class="fas fa-robot mr-2"></i>Sinh câu hỏi bằng AI
                </button>
                <div id="questionsContainer" class="mt-4 space-y-3 max-h-60 overflow-y-auto">
                </div>
            </div>
            <div class="flex space-x-3">
                <button onclick="saveExam()" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    Tạo đề thi
                </button>
                <button onclick="hideModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `);
}

let examQuestions = [];

function addQuestion(type) {
    const question = {
        id: Date.now(),
        question_type: type,
        content: '',
        difficulty_level: 'Biết',
        points: type === 'essay' ? 3.0 : (type === 'true_false' ? 2.0 : 1.0),
        options: type === 'mcq' ? [{option_text: '', is_correct: false}] : undefined,
        statements: type === 'true_false' ? [{statement_text: '', is_correct: false}] : undefined
    };
    
    examQuestions.push(question);
    renderQuestions();
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = examQuestions.map((q, idx) => `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-start mb-3">
                <span class="font-bold">Câu ${idx + 1} (${q.question_type.toUpperCase()})</span>
                <button onclick="removeQuestion(${q.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <input type="text" placeholder="Nội dung câu hỏi" value="${q.content}" 
                   onchange="updateQuestion(${q.id}, 'content', this.value)"
                   class="w-full px-3 py-2 border rounded mb-2">
            <div class="flex space-x-2">
                <select onchange="updateQuestion(${q.id}, 'difficulty_level', this.value)" 
                        class="px-3 py-1 border rounded text-sm">
                    <option ${q.difficulty_level === 'Biết' ? 'selected' : ''}>Biết</option>
                    <option ${q.difficulty_level === 'Hiểu' ? 'selected' : ''}>Hiểu</option>
                    <option ${q.difficulty_level === 'Vận dụng' ? 'selected' : ''}>Vận dụng</option>
                </select>
                <input type="number" step="0.5" value="${q.points}" 
                       onchange="updateQuestion(${q.id}, 'points', parseFloat(this.value))"
                       class="w-20 px-3 py-1 border rounded text-sm" placeholder="Điểm">
            </div>
        </div>
    `).join('');
}

function updateQuestion(id, field, value) {
    const question = examQuestions.find(q => q.id === id);
    if (question) question[field] = value;
}

function removeQuestion(id) {
    examQuestions = examQuestions.filter(q => q.id !== id);
    renderQuestions();
}

async function saveExam() {
    const folder_id = document.getElementById('examFolder').value;
    const title = document.getElementById('examTitle').value;
    const description = document.getElementById('examDescription').value;
    const duration = parseInt(document.getElementById('examDuration').value);

    if (!title) {
        alert('Vui lòng nhập tiêu đề đề thi!');
        return;
    }

    try {
        await axios.post('/api/exams', {
            folder_id,
            title,
            description,
            duration,
            source: 'manual',
            questions: examQuestions
        });
        
        examQuestions = [];
        hideModal();
        loadExams();
        alert('Tạo đề thi thành công!');
    } catch (error) {
        alert('Lỗi khi tạo đề thi!');
    }
}

async function deleteExam(id) {
    if (!confirm('Bạn có chắc muốn xóa đề thi này?')) return;

    try {
        await axios.delete(`/api/exams/${id}`);
        loadExams();
        alert('Xóa đề thi thành công!');
    } catch (error) {
        alert('Lỗi khi xóa đề thi!');
    }
}

async function viewExam(id) {
    try {
        const response = await axios.get(`/api/exams/${id}`);
        const { exam, questions } = response.data;
        
        showModal(`
            <h3 class="text-2xl font-bold mb-4">${exam.title}</h3>
            <p class="text-gray-600 mb-4">${exam.description}</p>
            <div class="space-y-4 max-h-96 overflow-y-auto">
                ${questions.map((q, idx) => `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="font-bold mb-2">Câu ${idx + 1}: ${q.content}</p>
                        <p class="text-sm text-gray-600">Cấp độ: ${q.difficulty_level} | Điểm: ${q.points}</p>
                    </div>
                `).join('')}
            </div>
            <button onclick="hideModal()" class="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg">
                Đóng
            </button>
        `);
    } catch (error) {
        alert('Lỗi khi tải đề thi!');
    }
}

async function viewExamResults(examId) {
    try {
        const [resultsResponse, examResponse] = await Promise.all([
            axios.get(`/api/exams/${examId}/results`),
            axios.get(`/api/exams/${examId}`)
        ]);
        
        const results = resultsResponse.data.results;
        const { exam, questions } = examResponse.data;
        
        if (results.length === 0) {
            showModal(`
                <h3 class="text-2xl font-bold mb-4">Kết quả thi: ${exam.title}</h3>
                <div class="text-center py-12">
                    <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">Chưa có học sinh nào làm bài thi này</p>
                </div>
                <button onclick="hideModal()" class="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg">
                    Đóng
                </button>
            `);
            return;
        }

        // Calcul des statistiques
        const scores = results.map(r => (r.score / r.max_score) * 100);
        const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        const maxScore = Math.max(...scores).toFixed(1);
        const minScore = Math.min(...scores).toFixed(1);
        const passRate = ((results.filter(r => (r.score / r.max_score) * 100 >= 50).length / results.length) * 100).toFixed(1);
        
        showModal(`
            <h3 class="text-2xl font-bold mb-4">Kết quả thi: ${exam.title}</h3>
            
            <!-- Statistiques -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-blue-600">${results.length}</div>
                    <div class="text-xs text-gray-600">Học sinh</div>
                </div>
                <div class="bg-green-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-green-600">${avgScore}%</div>
                    <div class="text-xs text-gray-600">Trung bình</div>
                </div>
                <div class="bg-purple-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-purple-600">${maxScore}%</div>
                    <div class="text-xs text-gray-600">Cao nhất</div>
                </div>
                <div class="bg-orange-50 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-orange-600">${passRate}%</div>
                    <div class="text-xs text-gray-600">Tỷ lệ đậu</div>
                </div>
            </div>

            <!-- Table des résultats -->
            <div class="overflow-x-auto max-h-96">
                <table class="w-full">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-4 py-2 text-left">Hạng</th>
                            <th class="px-4 py-2 text-left">Mã HS</th>
                            <th class="px-4 py-2 text-left">Họ tên</th>
                            <th class="px-4 py-2 text-left">Lớp</th>
                            <th class="px-4 py-2 text-left">Điểm</th>
                            <th class="px-4 py-2 text-left">%</th>
                            <th class="px-4 py-2 text-left">Thời gian</th>
                            <th class="px-4 py-2 text-left">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map((r, idx) => {
                            const percentage = (r.score / r.max_score * 100).toFixed(1);
                            const badgeColor = percentage >= 80 ? 'bg-green-100 text-green-800' : 
                                             percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                             'bg-red-100 text-red-800';
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
                            
                            return `
                            <tr class="border-t hover:bg-gray-50">
                                <td class="px-4 py-2 font-bold">${medal} ${idx + 1}</td>
                                <td class="px-4 py-2">${r.student_code}</td>
                                <td class="px-4 py-2">${r.student_name}</td>
                                <td class="px-4 py-2">${r.class}</td>
                                <td class="px-4 py-2 font-bold">${r.score.toFixed(1)}/${r.max_score}</td>
                                <td class="px-4 py-2">
                                    <span class="px-2 py-1 rounded text-xs font-medium ${badgeColor}">
                                        ${percentage}%
                                    </span>
                                </td>
                                <td class="px-4 py-2 text-sm text-gray-600">
                                    ${new Date(r.submitted_at).toLocaleString('vi-VN')}
                                </td>
                                <td class="px-4 py-2">
                                    <button onclick="viewStudentAnswers(${r.id}, ${examId})" 
                                            class="text-blue-600 hover:text-blue-800">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>

            <button onclick="hideModal()" class="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg">
                Đóng
            </button>
        `);
    } catch (error) {
        console.error(error);
        alert('Lỗi khi tải kết quả!');
    }
}

async function viewStudentAnswers(resultId, examId) {
    try {
        const [examResponse, resultsResponse] = await Promise.all([
            axios.get(`/api/exams/${examId}`),
            axios.get(`/api/exams/${examId}/results`)
        ]);
        
        const { exam, questions } = examResponse.data;
        const result = resultsResponse.data.results.find(r => r.id === resultId);
        
        if (!result) {
            alert('Không tìm thấy bài làm!');
            return;
        }

        const answers = JSON.parse(result.answers);
        
        let detailsHTML = `
            <h3 class="text-2xl font-bold mb-2">Chi tiết bài làm</h3>
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Học sinh:</strong> ${result.student_name} (${result.student_code})</p>
                <p><strong>Lớp:</strong> ${result.class}</p>
                <p><strong>Điểm:</strong> ${result.score.toFixed(1)}/${result.max_score}</p>
                <p><strong>Thời gian:</strong> ${new Date(result.submitted_at).toLocaleString('vi-VN')}</p>
            </div>
            <div class="space-y-4 max-h-96 overflow-y-auto">
        `;

        questions.forEach((q, idx) => {
            const answer = answers[q.id];
            detailsHTML += `
                <div class="bg-white border-2 rounded-lg p-4">
                    <p class="font-bold mb-2">Câu ${idx + 1}: ${q.content}</p>
                    <p class="text-sm text-gray-600 mb-2">Cấp độ: ${q.difficulty_level} | Điểm: ${q.points}</p>
            `;

            if (q.question_type === 'mcq' && q.options) {
                const selectedOption = answer ? q.options.find(o => o.id == answer.selected_option) : null;
                const correctOption = q.options.find(o => o.is_correct);
                
                detailsHTML += '<div class="space-y-2">';
                q.options.forEach(opt => {
                    const isSelected = selectedOption && opt.id === selectedOption.id;
                    const isCorrect = opt.is_correct;
                    const bgColor = isCorrect ? 'bg-green-50 border-green-500' : 
                                   (isSelected ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-200');
                    const icon = isCorrect ? '✓' : (isSelected ? '✗' : '');
                    
                    detailsHTML += `
                        <div class="border-2 ${bgColor} rounded p-2 text-sm">
                            ${icon} ${opt.option_text}
                        </div>
                    `;
                });
                detailsHTML += '</div>';
            } else if (q.question_type === 'true_false' && q.statements) {
                detailsHTML += '<div class="space-y-2">';
                q.statements.forEach((stmt, stmtIdx) => {
                    const studentAnswer = answer && answer.statements ? answer.statements[stmt.id] : null;
                    const isCorrect = studentAnswer == stmt.is_correct;
                    const bgColor = isCorrect ? 'bg-green-50' : 'bg-red-50';
                    
                    detailsHTML += `
                        <div class="${bgColor} rounded p-2 text-sm">
                            <p class="font-medium">${stmtIdx + 1}. ${stmt.statement_text}</p>
                            <p class="text-xs mt-1">
                                Đáp án đúng: ${stmt.is_correct ? 'Đúng' : 'Sai'} | 
                                Học sinh chọn: ${studentAnswer == 1 ? 'Đúng' : studentAnswer == 0 ? 'Sai' : 'Không trả lời'}
                                ${isCorrect ? '✓' : '✗'}
                            </p>
                        </div>
                    `;
                });
                detailsHTML += '</div>';
            } else if (q.question_type === 'essay') {
                const essayText = answer && answer.essay_text ? answer.essay_text : 'Không có câu trả lời';
                detailsHTML += `
                    <div class="bg-gray-50 rounded p-3">
                        <p class="text-sm italic">"${essayText}"</p>
                        <p class="text-xs text-orange-600 mt-2">⚠ Cần chấm điểm thủ công</p>
                    </div>
                `;
            }

            detailsHTML += '</div>';
        });

        detailsHTML += `
            </div>
            <button onclick="viewExamResults(${examId})" class="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg">
                Quay lại
            </button>
        `;

        showModal(detailsHTML);
    } catch (error) {
        console.error(error);
        alert('Lỗi khi tải chi tiết bài làm!');
    }
}

function showAIGenerateModal() {
    showModal(`
        <h3 class="text-2xl font-bold mb-4">
            <i class="fas fa-robot mr-2 text-purple-600"></i>
            Sinh câu hỏi bằng AI
        </h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Chủ đề</label>
                <input type="text" id="aiTopic" placeholder="VD: Phản ứng oxi hóa khử" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Cấp độ</label>
                <select id="aiDifficulty" class="w-full px-4 py-2 border rounded-lg">
                    <option>Biết</option>
                    <option>Hiểu</option>
                    <option>Vận dụng</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Loại câu hỏi</label>
                <select id="aiQuestionType" class="w-full px-4 py-2 border rounded-lg">
                    <option value="mcq">Trắc nghiệm (MCQ)</option>
                    <option value="true_false">Đúng/Sai</option>
                    <option value="essay">Tự luận</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Số lượng câu hỏi</label>
                <input type="number" id="aiCount" value="5" min="1" max="10" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div class="flex space-x-3">
                <button onclick="generateAIQuestions()" class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-600">
                    Sinh câu hỏi
                </button>
                <button onclick="showCreateExamModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Quay lại
                </button>
            </div>
        </div>
    `);
}

async function generateAIQuestions() {
    const topic = document.getElementById('aiTopic').value;
    const difficulty_level = document.getElementById('aiDifficulty').value;
    const question_type = document.getElementById('aiQuestionType').value;
    const count = parseInt(document.getElementById('aiCount').value);

    if (!topic) {
        alert('Vui lòng nhập chủ đề!');
        return;
    }

    try {
        const response = await axios.post('/api/ai/generate-questions', {
            topic,
            difficulty_level,
            question_type,
            count
        });

        examQuestions.push(...response.data.questions);
        showCreateExamModal();
        alert(`Đã sinh ${count} câu hỏi thành công!`);
    } catch (error) {
        alert('Lỗi khi sinh câu hỏi!');
    }
}

// Modal Utilities
function showModal(content) {
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

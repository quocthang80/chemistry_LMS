// ==========================================
// CHEMICAL FORMULA UTILITIES
// ==========================================

let currentFormulaTarget = null; // Track which textarea is being edited
let currentEditingQuestionIndex = null; // Track which question is being edited

// Render all chemical formulas in the document
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

// Common chemical formulas for quick insert
const commonFormulas = [
    { label: 'H₂O', latex: '\\ce{H2O}' },
    { label: 'CO₂', latex: '\\ce{CO2}' },
    { label: 'H₂SO₄', latex: '\\ce{H2SO4}' },
    { label: 'NaCl', latex: '\\ce{NaCl}' },
    { label: 'CH₄', latex: '\\ce{CH4}' },
    { label: 'O₂', latex: '\\ce{O2}' },
    { label: 'Fe³⁺', latex: '\\ce{Fe^3+}' },
    { label: 'SO₄²⁻', latex: '\\ce{SO4^2-}' },
    { label: 'NH₃', latex: '\\ce{NH3}' },
    { label: 'HCl', latex: '\\ce{HCl}' },
    { label: 'Ca(OH)₂', latex: '\\ce{Ca(OH)2}' },
    { label: 'CH₃COOH', latex: '\\ce{CH3COOH}' },
];

// Show chemical formula insert modal
function showChemicalFormulaModal(targetId) {
    currentFormulaTarget = targetId;
    
    const commonFormulasHTML = commonFormulas.map(f => 
        `<button onclick="insertCommonFormula('${f.latex.replace(/\\/g, '\\\\')}')" 
                class="px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 text-sm">
            ${f.label}
        </button>`
    ).join('');
    
    const modalContent = `
        <h3 class="text-xl font-bold mb-4">
            <i class="fas fa-flask mr-2 text-blue-600"></i>
            Chèn Công Thức Hóa Học
        </h3>
        
        <div class="space-y-4">
            <!-- Quick Insert Common Formulas -->
            <div>
                <label class="block text-sm font-medium mb-2">Công thức phổ biến (nhấn để chèn):</label>
                <div class="grid grid-cols-4 gap-2">
                    ${commonFormulasHTML}
                </div>
            </div>
            
            <!-- Custom Formula Input -->
            <div>
                <label class="block text-sm font-medium mb-2">Hoặc nhập công thức tùy chỉnh:</label>
                <div class="bg-gray-50 p-3 rounded-lg mb-2">
                    <input type="text" id="customFormulaInput" 
                           placeholder="\\ce{2H2 + O2 -> 2H2O}"
                           class="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                           oninput="updateFormulaPreview()">
                </div>
                
                <!-- Preview -->
                <div class="bg-white border-2 border-blue-200 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
                    <div id="formulaPreview" class="text-lg">
                        <span class="text-gray-400 italic">Preview sẽ hiển thị ở đây...</span>
                    </div>
                </div>
            </div>
            
            <!-- Examples -->
            <div class="bg-blue-50 p-3 rounded-lg">
                <p class="font-bold text-sm mb-2">Ví dụ cú pháp:</p>
                <div class="text-xs space-y-1 font-mono text-gray-700">
                    <div><code>\\ce{H2O}</code> → H₂O</div>
                    <div><code>\\ce{2H2 + O2 -> 2H2O}</code> → 2H₂ + O₂ → 2H₂O</div>
                    <div><code>\\ce{Fe^3+}</code> → Fe³⁺</div>
                    <div><code>\\ce{SO4^2-}</code> → SO₄²⁻</div>
                    <div><code>\\ce{CH3-CH2-OH}</code> → CH₃-CH₂-OH</div>
                </div>
            </div>
            
            <!-- Math Formula Support -->
            <div class="bg-green-50 p-3 rounded-lg">
                <p class="font-bold text-sm mb-2">Công thức toán học:</p>
                <div class="text-xs space-y-1 font-mono text-gray-700">
                    <div><code>$x^2 + y^2 = r^2$</code> → x² + y² = r²</div>
                    <div><code>$\\frac{a}{b}$</code> → phân số a/b</div>
                    <div><code>$\\sqrt{x}$</code> → căn bậc hai của x</div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex space-x-3">
                <button onclick="insertCustomFormula()" 
                        class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    <i class="fas fa-check mr-2"></i>Chèn công thức
                </button>
                <button onclick="hideFormulaModal()" 
                        class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `;
    
    // Use dedicated formula modal
    document.getElementById('formulaModalContent').innerHTML = modalContent;
    document.getElementById('formulaModalOverlay').classList.remove('hidden');
    
    // Focus on input
    setTimeout(() => {
        const input = document.getElementById('customFormulaInput');
        if (input) input.focus();
    }, 100);
}

// Hide formula modal
function hideFormulaModal() {
    document.getElementById('formulaModalOverlay').classList.add('hidden');
}

// Update formula preview in real-time
function updateFormulaPreview() {
    const input = document.getElementById('customFormulaInput');
    const preview = document.getElementById('formulaPreview');
    
    if (!input || !preview) return;
    
    const formula = input.value.trim();
    
    if (!formula) {
        preview.innerHTML = '<span class="text-gray-400 italic">Preview sẽ hiển thị ở đây...</span>';
        return;
    }
    
    // Wrap formula if not already wrapped
    let wrappedFormula = formula;
    if (!formula.startsWith('$')) {
        wrappedFormula = `$${formula}$`;
    }
    
    preview.innerHTML = wrappedFormula;
    
    // Render the formula
    if (typeof renderMathInElement !== 'undefined') {
        try {
            renderMathInElement(preview, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                ],
                throwOnError: false,
                trust: true
            });
        } catch (e) {
            preview.innerHTML = '<span class="text-red-500 text-sm">Lỗi cú pháp</span>';
        }
    }
}

// Insert common formula
function insertCommonFormula(latex) {
    const formula = `$${latex}$`;
    insertFormulaIntoQuestion(formula);
}

// Insert custom formula
function insertCustomFormula() {
    const input = document.getElementById('customFormulaInput');
    
    if (!input) return;
    
    let formula = input.value.trim();
    if (!formula) {
        alert('Vui lòng nhập công thức!');
        return;
    }
    
    // Wrap formula if not already wrapped
    if (!formula.startsWith('$')) {
        formula = `$${formula}$`;
    }
    
    insertFormulaIntoQuestion(formula);
}

// Helper function to insert formula into question content
function insertFormulaIntoQuestion(formula) {
    if (currentEditingQuestionIndex === null) {
        console.error('No question being edited');
        return;
    }
    
    const textarea = document.getElementById('editQuestionContent');
    if (!textarea) {
        console.error('Textarea not found');
        return;
    }
    
    const cursorPos = textarea.selectionStart || 0;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(textarea.selectionEnd || cursorPos);
    
    // Update textarea value
    const newValue = textBefore + formula + textAfter;
    textarea.value = newValue;
    
    // Set cursor position after the inserted formula
    const newCursorPos = cursorPos + formula.length;
    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    
    // Close the formula modal (NOT the main modal!)
    hideFormulaModal();
    
    // Focus back on the textarea
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    }, 100);
}

// ==========================================
// MAIN APPLICATION CODE
// ==========================================

let currentTeacher = null;
let students = [];
let folders = [];
let exams = [];
let examQuestions = []; // Array to hold questions when creating/editing exam

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


function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    showModal(`
        <h3 class="text-2xl font-bold mb-4">Chỉnh sửa thông tin học sinh</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Mã học sinh</label>
                <input type="text" id="studentCode" value="${student.student_code}" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Họ tên</label>
                <input type="text" id="studentName" value="${student.name}" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Lớp</label>
                <input type="text" id="studentClass" value="${student.class}" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div class="flex space-x-3">
                <button onclick="updateStudent(${id})" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    Cập nhật
                </button>
                <button onclick="hideModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `);
}

async function updateStudent(id) {
    const student_code = document.getElementById('studentCode').value;
    const name = document.getElementById('studentName').value;
    const className = document.getElementById('studentClass').value;

    try {
        await axios.put(`/api/students/${id}`, {
            student_code,
            name,
            class: className
        });
        hideModal();
        loadStudents();
        alert('Cập nhật học sinh thành công!');
    } catch (error) {
        alert('Lỗi khi cập nhật học sinh!');
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

function showImportStudentModal() {
    showModal(`
        <h3 class="text-2xl font-bold mb-4">Nhập danh sách từ Excel</h3>
        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <p class="font-bold mb-1">Hướng dẫn:</p>
                <ul class="list-disc list-inside">
                    <li>Tải <a href="/api/students/template" class="underline text-blue-600 font-bold">File mẫu .csv</a></li>
                    <li>Điền thông tin học sinh (Mã HS, Họ tên, Lớp)</li>
                    <li>Không sửa tiêu đề cột đầu tiên</li>
                    <li>Lưu file dưới dạng .xlsx hoặc .csv</li>
                </ul>
            </div>
            
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <i class="fas fa-file-excel text-4xl text-green-600 mb-2"></i>
                <p class="text-gray-600 mb-4">Kéo thả file vào đây hoặc bấm để chọn</p>
                <input type="file" id="excelFile" accept=".xlsx, .xls, .csv" class="hidden" onchange="processExcelFile(this)">
                <button onclick="document.getElementById('excelFile').click()" class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                    Chọn File
                </button>
            </div>

            <div id="importPreview" class="hidden">
                <h4 class="font-bold mb-2">Xem trước (<span id="previewCount">0</span> học sinh)</h4>
                <div class="max-h-40 overflow-y-auto border rounded bg-gray-50 p-2 text-xs">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b">
                                <th class="p-1">Mã HS</th>
                                <th class="p-1">Họ tên</th>
                                <th class="p-1">Lớp</th>
                            </tr>
                        </thead>
                        <tbody id="previewBody"></tbody>
                    </table>
                </div>
                <button onclick="confirmImport()" class="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    <i class="fas fa-upload mr-2"></i>Tiến hành nhập
                </button>
            </div>

            <button onclick="hideModal()" class="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                Hủy
            </button>
        </div>
    `);
}

let importData = [];

function processExcelFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        // Remove header row and map to object
        // Assuming columns: [Mã HS, Họ tên, Lớp] (flexible matching)
        if (jsonData.length < 2) {
            alert('File không có dữ liệu!');
            return;
        }

        importData = jsonData.slice(1).map(row => {
            // Basic mapping by index: 0=Code, 1=Name, 2=Class
            return {
                student_code: row[0] ? String(row[0]).trim() : '',
                name: row[1] ? String(row[1]).trim() : '',
                class: row[2] ? String(row[2]).trim() : ''
            };
        }).filter(s => s.student_code && s.name); // Filter empty rows

        // Show preview
        document.getElementById('previewCount').textContent = importData.length;
        const previewBody = document.getElementById('previewBody');
        previewBody.innerHTML = importData.slice(0, 10).map(s => `
            <tr class="border-b">
                <td class="p-1 font-mono">${s.student_code}</td>
                <td class="p-1">${s.name}</td>
                <td class="p-1">${s.class}</td>
            </tr>
        `).join('') + (importData.length > 10 ? `<tr><td colspan="3" class="p-1 text-center text-gray-500">...còn lại ${importData.length - 10} dòng...</td></tr>` : '');
        
        document.getElementById('importPreview').classList.remove('hidden');
    };
    reader.readAsArrayBuffer(file);
}

async function confirmImport() {
    if (importData.length === 0) return;

    try {
        const response = await axios.post('/api/students/bulk', importData);
        alert(`Đã nhập thành công ${response.data.count} học sinh!`);
        hideModal();
        loadStudents();
    } catch (error) {
        alert('Lỗi khi nhập dữ liệu: ' + (error.response?.data?.error || error.message));
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


let currentEditingExamId = null;

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
                    <button onclick="editExam(${exam.id})" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="viewExamResults(${exam.id})" class="text-purple-600 hover:text-purple-800">
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
    // If we're currently editing an exam, re-show it with current state
    if (currentEditingExamId) {
        // Find the exam in our list
        const exam = exams.find(e => e.id === currentEditingExamId);
        if (exam) {
            showExamModal(exam, examQuestions);
        } else {
            showExamModal();
        }
    } else {
        showExamModal();
    }
}


async function editExam(id) {
    try {
        console.log(`Editing exam ${id}...`);
        const response = await axios.get(`/api/exams/${id}`);
        const { exam, questions } = response.data;
        console.log("Exam data received:", exam);
        console.log("Questions data received:", questions);
        showExamModal(exam, questions);
    } catch (error) {
        alert('Lỗi khi tải thông tin đề thi: ' + (error.message || error));
        console.error("Edit Exam Error:", error);
    }
}

function showExamModal(exam = null, questions = []) {
    currentEditingExamId = exam ? exam.id : null;
    examQuestions = questions || [];
    
    // Safety check: ensure options/statements are parsed (they should be from API)
    examQuestions.forEach(q => {
        if (q.question_type === 'mcq' && typeof q.options === 'string') {
            try { q.options = JSON.parse(q.options); } catch(e) {}
        }
        if (q.question_type === 'true_false' && typeof q.statements === 'string') {
            try { q.statements = JSON.parse(q.statements); } catch(e) {}
        }
    });

    console.log("Showing modal. Current ID:", currentEditingExamId, "Questions:", examQuestions);

    const foldersOptions = folders.map(f => `<option value="${f.id}" ${exam && exam.folder_id == f.id ? 'selected' : ''}>${f.name}</option>`).join('');
    
    showModal(`
        <h3 class="text-2xl font-bold mb-4">${exam ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Thư mục</label>
                <select id="examFolder" class="w-full px-4 py-2 border rounded-lg">
                    ${foldersOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Tiêu đề</label>
                <input type="text" id="examTitle" class="w-full px-4 py-2 border rounded-lg" value="${exam ? exam.title : ''}">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Mô tả</label>
                <textarea id="examDescription" rows="2" class="w-full px-4 py-2 border rounded-lg">${exam ? exam.description : ''}</textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Thời lượng (phút)</label>
                <input type="number" id="examDuration" class="w-full px-4 py-2 border rounded-lg" value="${exam ? exam.duration : '45'}" min="1">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Số lần làm bài tối đa (0 = không giới hạn)</label>
                <input type="number" id="examMaxAttempts" class="w-full px-4 py-2 border rounded-lg" value="${exam ? exam.max_attempts : '0'}" min="0">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Hạn chót (để trống nếu không có)</label>
                <input type="datetime-local" id="examDeadline" class="w-full px-4 py-2 border rounded-lg" value="${exam && exam.deadline ? exam.deadline : ''}">
            </div>
            <div class="flex items-center space-x-2 my-4">
                <input type="checkbox" id="shuffleOptions" class="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" ${exam && exam.shuffle_options ? 'checked' : ''}>
                <label for="shuffleOptions" class="text-sm font-medium text-gray-700 select-none cursor-pointer">
                    Đảo thứ tự đáp án (MCQ) mỗi lần làm bài
                </label>
            </div>
            <div class="border-t pt-4 mt-4">
                <h4 class="font-bold mb-3">Công cụ</h4>
                <div class="flex space-x-2 mb-3">
                    <button onclick="downloadQuestionTemplate()" class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                        <i class="fas fa-download mr-2"></i>Tải mẫu Excel
                    </button>
                    <button onclick="document.getElementById('importQuestionsFile').click()" class="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200">
                        <i class="fas fa-file-upload mr-2"></i>Nhập Excel/JSON
                    </button>
                    <input type="file" id="importQuestionsFile" accept=".xlsx, .xls, .json" class="hidden" onchange="processQuestionImport(this)">
                </div>
                
                <h4 class="font-bold mb-3">Thêm câu hỏi thủ công</h4>
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
                    ${exam ? 'Cập nhật' : 'Tạo đề thi'}
                </button>
                <button onclick="hideModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `);
    
    renderQuestions();
}

// Question Management Functions
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;
    
    if (examQuestions.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Chưa có câu hỏi nào. Hãy thêm câu hỏi!</p>';
        return;
    }
    
    container.innerHTML = examQuestions.map((q, idx) => {
        let questionPreview = '';
        
        if (q.question_type === 'mcq' && q.options) {
            const correctOption = q.options.find(o => o.is_correct);
            questionPreview = `<div class="text-xs text-gray-600 mt-1">Đáp án đúng: ${correctOption ? correctOption.option_text : 'Chưa có'}</div>`;
        } else if (q.question_type === 'true_false' && q.statements) {
            questionPreview = `<div class="text-xs text-gray-600 mt-1">${q.statements.length} câu đúng/sai</div>`;
        } else if (q.question_type === 'essay') {
            questionPreview = `<div class="text-xs text-gray-600 mt-1">Câu tự luận</div>`;
        }
        
        return `
            <div class="bg-gray-50 border rounded-lg p-3">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="text-xs font-bold text-indigo-600">Câu ${idx + 1}</span>
                            <span class="text-xs px-2 py-0.5 rounded ${
                                q.question_type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                                q.question_type === 'true_false' ? 'bg-purple-100 text-purple-700' :
                                'bg-green-100 text-green-700'
                            }">${
                                q.question_type === 'mcq' ? 'MCQ' :
                                q.question_type === 'true_false' ? 'Đúng/Sai' :
                                'Tự luận'
                            }</span>
                            <span class="text-xs text-gray-500">${q.difficulty_level}</span>
                            <span class="text-xs text-gray-500">${q.points} điểm</span>
                        </div>
                        <p class="text-sm font-medium text-gray-800">${q.content}</p>
                        ${questionPreview}
                    </div>
                    <div class="flex space-x-1 ml-2">
                        <button onclick="editQuestion(${idx})" class="text-blue-600 hover:text-blue-800 p-1">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button onclick="deleteQuestion(${idx})" class="text-red-600 hover:text-red-800 p-1">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Render chemical formulas after DOM update
    setTimeout(() => renderChemistry(container), 50);
}

function addQuestion(type) {
    const newQuestion = {
        id: Date.now() + Math.random(), // Temporary ID for new questions
        question_type: type,
        content: '',
        difficulty_level: 'Biết',
        points: type === 'essay' ? 3.0 : (type === 'true_false' ? 2.0 : 1.0),
    };
    
    if (type === 'mcq') {
        newQuestion.options = [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
        ];
    } else if (type === 'true_false') {
        newQuestion.statements = [
            { statement_text: '', is_correct: true },
            { statement_text: '', is_correct: false },
            { statement_text: '', is_correct: true },
            { statement_text: '', is_correct: false }
        ];
    }
    
    examQuestions.push(newQuestion);
    renderQuestions();
    // Auto-scroll to bottom to show new question
    const container = document.getElementById('questionsContainer');
    if (container) container.scrollTop = container.scrollHeight;
    
    // Immediately open edit modal for the new question
    editQuestion(examQuestions.length - 1);
}

function editQuestion(index) {
    const q = examQuestions[index];
    if (!q) return;
    
    // Store the index for formula insertion
    currentEditingQuestionIndex = index;
    
    let questionForm = `
        <h3 class="text-xl font-bold mb-4">Chỉnh sửa câu hỏi ${index + 1}</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Nội dung câu hỏi</label>
                <textarea id="editQuestionContent" rows="3" class="w-full px-4 py-2 border rounded-lg">${q.content}</textarea>
                <button type="button" onclick="showChemicalFormulaModal('editQuestionContent')" 
                        class="mt-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded border border-blue-200">
                    <i class="fas fa-flask mr-1"></i>Chèn công thức hóa học
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Cấp độ</label>
                    <select id="editQuestionDifficulty" class="w-full px-4 py-2 border rounded-lg">
                        <option ${q.difficulty_level === 'Biết' ? 'selected' : ''}>Biết</option>
                        <option ${q.difficulty_level === 'Hiểu' ? 'selected' : ''}>Hiểu</option>
                        <option ${q.difficulty_level === 'Vận dụng' ? 'selected' : ''}>Vận dụng</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Điểm</label>
                    <input type="number" id="editQuestionPoints" value="${q.points}" min="0.1" step="0.1" class="w-full px-4 py-2 border rounded-lg">
                </div>
            </div>
    `;
    
    if (q.question_type === 'mcq') {
        questionForm += `
            <div>
                <label class="block text-sm font-medium mb-2">Các đáp án</label>
                <div class="space-y-2">
        `;
        q.options.forEach((opt, optIdx) => {
            questionForm += `
                <div class="flex items-center space-x-2">
                    <input type="radio" name="correctOption" value="${optIdx}" ${opt.is_correct ? 'checked' : ''} 
                           class="w-4 h-4 text-indigo-600">
                    <input type="text" id="option_${optIdx}" value="${opt.option_text}" 
                           placeholder="Đáp án ${String.fromCharCode(65 + optIdx)}" 
                           class="flex-1 px-3 py-2 border rounded-lg text-sm">
                </div>
            `;
        });
        questionForm += `
                </div>
                <p class="text-xs text-gray-500 mt-1">Chọn radio button để đánh dấu đáp án đúng</p>
            </div>
        `;
    } else if (q.question_type === 'true_false') {
        questionForm += `
            <div>
                <label class="block text-sm font-medium mb-2">Các phát biểu</label>
                <div class="space-y-2">
        `;
        q.statements.forEach((stmt, stmtIdx) => {
            questionForm += `
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="stmt_correct_${stmtIdx}" ${stmt.is_correct ? 'checked' : ''} 
                           class="w-4 h-4 text-indigo-600 rounded">
                    <input type="text" id="stmt_${stmtIdx}" value="${stmt.statement_text}" 
                           placeholder="Phát biểu ${stmtIdx + 1}" 
                           class="flex-1 px-3 py-2 border rounded-lg text-sm">
                    <span class="text-xs text-gray-500">Đúng?</span>
                </div>
            `;
        });
        questionForm += `
                </div>
                <p class="text-xs text-gray-500 mt-1">Đánh dấu checkbox nếu phát biểu đúng</p>
            </div>
        `;
    }
    
    questionForm += `
            <div class="flex space-x-3">
                <button onclick="saveQuestionEdit(${index})" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    Lưu
                </button>
                <button onclick="showCreateExamModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        </div>
    `;
    
    showModal(questionForm);
}

function saveQuestionEdit(index) {
    const q = examQuestions[index];
    
    q.content = document.getElementById('editQuestionContent').value;
    q.difficulty_level = document.getElementById('editQuestionDifficulty').value;
    q.points = parseFloat(document.getElementById('editQuestionPoints').value);
    
    if (q.question_type === 'mcq') {
        const correctOptionIndex = parseInt(document.querySelector('input[name="correctOption"]:checked')?.value);
        q.options.forEach((opt, idx) => {
            opt.option_text = document.getElementById(`option_${idx}`).value;
            opt.is_correct = (idx === correctOptionIndex);
        });
    } else if (q.question_type === 'true_false') {
        q.statements.forEach((stmt, idx) => {
            stmt.statement_text = document.getElementById(`stmt_${idx}`).value;
            stmt.is_correct = document.getElementById(`stmt_correct_${idx}`).checked;
        });
    }
    
    showCreateExamModal(); // Return to exam modal
}

function deleteQuestion(index) {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    examQuestions.splice(index, 1);
    renderQuestions();
}

async function saveExam() {
    const examData = {
        folder_id: document.getElementById('examFolder').value,
        title: document.getElementById('examTitle').value,
        description: document.getElementById('examDescription').value,
        duration: parseInt(document.getElementById('examDuration').value),
        max_attempts: parseInt(document.getElementById('examMaxAttempts').value),
        deadline: document.getElementById('examDeadline').value || null,
        shuffle_options: document.getElementById('shuffleOptions').checked,
        questions: examQuestions
    };

    if (!examData.title) {
        alert('Vui lòng nhập tiêu đề đề thi!');
        return;
    }

    try {
        if (currentEditingExamId) {
            // Update mode
            await axios.put(`/api/exams/${currentEditingExamId}`, examData);
            alert('Cập nhật đề thi thành công!');
        } else {
            // Create mode
            await axios.post('/api/exams', examData);
            alert('Tạo đề thi thành công!');
        }
        
        examQuestions = [];
        currentEditingExamId = null;
        hideModal();
        loadExams();
    } catch (error) {
        alert('Lỗi khi lưu đề thi: ' + (error.message || 'Unknown error'));
        console.error(error);
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
            <div class="flex space-x-2 mt-4">
                <button onclick="exportExamQuestions(${exam.id})" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    <i class="fas fa-file-export mr-2"></i>Xuất Excel
                </button>
                <button onclick="hideModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg">
                    Đóng
                </button>
            </div>
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

            <div class="text-right mb-4">
                <button onclick="exportResults(${examId})" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    <i class="fas fa-file-excel mr-2"></i>Xuất Excel
                </button>
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
            <div id="gradingHeader" class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold">Chi tiết bài làm</h3>
                <div class="text-right">
                    <p class="text-sm text-gray-600">Điểm hiện tại</p>
                    <p class="text-2xl font-bold text-indigo-600">${result.score.toFixed(1)}/${result.max_score}</p>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Học sinh:</strong> ${result.student_name} (${result.student_code})</p>
                <p><strong>Lớp:</strong> ${result.class}</p>
                <p><strong>Thời gian:</strong> ${new Date(result.submitted_at).toLocaleString('vi-VN')}</p>
            </div>
            <div class="space-y-4 max-h-[60vh] overflow-y-auto">
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
                // Use stored score if available, otherwise default to 0
                const currentScore = (answer && answer.score !== undefined) ? answer.score : 0;
                
                detailsHTML += `
                    <div class="bg-gray-50 rounded p-3 mb-2">
                        <p class="text-sm italic whitespace-pre-wrap">"${essayText}"</p>
                    </div>
                    <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p class="font-bold text-yellow-800 text-sm mb-2"><i class="fas fa-pen-alt mr-2"></i>Chấm điểm</p>
                        <div class="flex items-center space-x-2">
                            <label class="text-sm font-medium">Điểm:</label>
                            <input type="number" id="score_${q.id}" value="${currentScore}" max="${q.points}" min="0" step="0.1"
                                   class="w-20 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-yellow-500">
                            <span class="text-sm text-gray-500">/ ${q.points}</span>
                        </div>
                    </div>
                `;
            }

            detailsHTML += '</div>';
        });

        detailsHTML += `
            </div>
            <div class="flex space-x-2 mt-4 pt-4 border-t sticky bottom-0 bg-white">
                <button onclick="saveGrading(${result.id}, ${exam.id})" class="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                    <i class="fas fa-save mr-2"></i>Lưu chấm điểm
                </button>
                <button onclick="viewExamResults(${examId})" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    Hủy
                </button>
            </div>
        `;

        showModal(detailsHTML);
    } catch (error) {
        console.error(error);
        alert('Lỗi khi tải chi tiết bài làm!');
    }
}

async function saveGrading(resultId, examId) {
    try {
        const [examResponse, resultsResponse] = await Promise.all([
            axios.get(`/api/exams/${examId}`),
            axios.get(`/api/exams/${examId}/results`)
        ]);
        
        const questions = examResponse.data.questions;
        const result = resultsResponse.data.results.find(r => r.id === resultId);
        
        if (!result) {
            alert('Không tìm thấy kết quả trong danh sách mới nhất!');
            return;
        }

        let answers = {};
        try {
            answers = JSON.parse(result.answers);
        } catch (e) {
            console.error('JSON parse error for answers:', e);
            alert('Dữ liệu bài làm bị lỗi format!');
            return;
        }

        let totalScore = 0;
        let diffLog = [];

        // Recalculate total score
        questions.forEach(q => {
            const answer = answers[q.id];
            let questionScore = 0;

            if (!answer) {
                 // No answer from student, score 0
            } else if (q.question_type === 'mcq') {
                if (answer.selected_option !== undefined && answer.selected_option !== null) {
                    // Try to find correct option. Options here might come from DB as generic objects?
                    // In teacher.v5 addQuestion: options have 'is_correct'.
                    // In DB: stored in 'options' column (JSON).
                    // viewQuestions parses it.
                    // If student saved index (0,1,2,3...):
                    if (q.options && q.options[answer.selected_option]) {
                        const selectedOpt = q.options[answer.selected_option];
                        if (selectedOpt.is_correct) questionScore = q.points;
                    }
                }
            } else if (q.question_type === 'true_false') {
                 if (answer.statements && q.statements) {
                     let correctCount = 0;
                     let totalStmts = q.statements.length;
                     q.statements.forEach((stmt, idx) => {
                         // Check by ID or Index. 
                         // Prioritize Index if ID not found in answer keys?
                         // student.v3 saves by ID if available, else index?
                         // Actually student.v3 uses: `statement_${stmt.id || stmtIdx}` name.
                         // saveStatementAnswer uses `stmtId` param.
                         // So answers.statements keys are mixed?
                         
                         let studentVal = answer.statements[stmt.id];
                         if (studentVal === undefined) studentVal = answer.statements[idx];
                         // Also check generic string keys "0", "1" etc.
                         if (studentVal === undefined) studentVal = answer.statements[String(idx)];

                         if (studentVal == stmt.is_correct) correctCount++;
                     });
                     if (totalStmts > 0) {
                        questionScore = (correctCount / totalStmts) * q.points;
                     }
                 }
            } else if (q.question_type === 'essay') {
                const scoreInput = document.getElementById(`score_${q.id}`);
                if (scoreInput) {
                    const manualScore = parseFloat(scoreInput.value);
                    if (isNaN(manualScore)) {
                        // If empty or invalid, keep existing or 0? 
                        // If User cleared it, maybe 0.
                        questionScore = 0;
                    } else {
                        if (manualScore > q.points) {
                            throw new Error(`Điểm câu ${q.id} (${manualScore}) vượt quá điểm tối đa (${q.points})`);
                        }
                        if (manualScore < 0) throw new Error(`Điểm không thể âm`);
                        questionScore = manualScore;
                    }
                    // Update the answer object to store the manual score for future
                    answers[q.id].score = questionScore;
                } else {
                    // If input not found (maybe didn't render?), use existing
                    if (answers[q.id] && answers[q.id].score) {
                        questionScore = answers[q.id].score;
                    }
                }
            }

            totalScore += questionScore;
            // diffLog.push({qid: q.id, score: questionScore});
        });

        // Send update
        try {
            await axios.put(`/api/results/${resultId}`, {
                score: totalScore,
                answers: answers
            });
            alert('Lưu bảng điểm thành công!');
            viewExamResults(examId); // Refresh modal
        } catch (axiosError) {
             console.error('Axios PUT error:', axiosError);
             const msg = axiosError.response?.data?.error || axiosError.message;
             alert('Lỗi server khi lưu điểm: ' + msg);
        }

    } catch (error) {
        console.error(error);
        alert(error.message || 'Lỗi không xác định khi tính điểm!');
    }
}

function showAIGenerateModal() {
    const storedKey = localStorage.getItem('gemini_api_key') || '';
    showModal(`
        <h3 class="text-2xl font-bold mb-4">
            <i class="fas fa-robot mr-2 text-purple-600"></i>
            Sinh câu hỏi bằng AI (Gemini)
        </h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Gemini API Key <span class="text-red-500">*</span></label>
                <input type="password" id="aiApiKey" value="${storedKey}" placeholder="Nhập API Key của bạn" class="w-full px-4 py-2 border rounded-lg">
                <p class="text-xs text-green-600 mt-1"><i class="fas fa-check-circle mr-1"></i>Key sẽ được lưu tự động trên trình duyệt này.</p>
            </div>
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
    const api_key = document.getElementById('aiApiKey').value;
    const topic = document.getElementById('aiTopic').value;
    const difficulty_level = document.getElementById('aiDifficulty').value;
    const question_type = document.getElementById('aiQuestionType').value;
    const count = parseInt(document.getElementById('aiCount').value);

    if (!api_key) {
        alert('Vui lòng nhập Gemini API Key!');
        return;
    }

    if (!topic) {
        alert('Vui lòng nhập chủ đề!');
        return;
    }

    // Save key for future use
    localStorage.setItem('gemini_api_key', api_key);

    try {
        // Show loading state
        const btn = document.querySelector('button[onclick="generateAIQuestions()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang sinh câu hỏi...';
        btn.disabled = true;

        const response = await axios.post('/api/ai/generate-questions', {
            topic,
            difficulty_level,
            question_type,
            count,
            api_key
        });

        examQuestions.push(...response.data.questions);
        showCreateExamModal();
        alert(`Đã sinh ${count} câu hỏi thành công!`);
    } catch (error) {
        console.error(error);
        alert('Lỗi khi sinh câu hỏi: ' + (error.response?.data?.error || error.message));
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

function exportResults(examId) {
    window.location.href = `/api/exams/${examId}/export`;
}

// ==========================================
// IMPORT / EXPORT FUNCTIONS
// ==========================================

function downloadQuestionTemplate() {
    const headers = [
        ['Loai_CH', 'Noi_dung', 'Do_kho', 'Diem', 'Dap_an_A', 'Dap_an_B', 'Dap_an_C', 'Dap_an_D', 'Dap_an_Dung'],
        ['mcq', 'Câu hỏi ví dụ 1', 'Biết', 1, 'Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D', 'A'],
        ['mcq', 'Câu hỏi ví dụ 2', 'Hiểu', 1, 'Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D', 'B'],
        ['essay', 'Câu hỏi tự luận ví dụ', 'Vận dụng', 3, '', '', '', '', '']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Cau_Hoi");
    XLSX.writeFile(wb, "mau_nhap_cau_hoi.xlsx");
}

function processQuestionImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            // Use local variable to avoid scope issues in strict mode if any, 
            // though 'examQuestions' is global.
            let newQuestions = [];

            if (file.name.endsWith('.json')) {
                const jsonData = JSON.parse(data);
                if (Array.isArray(jsonData)) {
                    newQuestions = jsonData.map(q => ({
                        ...q,
                        id: Date.now() + Math.random(),
                        points: q.points || (q.question_type === 'essay' ? 3.0 : 1.0)
                    }));
                }
            } else {
                const workbook = XLSX.read(data, {type: 'binary'});
                const firstSheet = workbook.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                
                newQuestions = rows.map(row => {
                    const type = (row.Loai_CH || 'mcq').toLowerCase().trim();
                    const q = {
                        id: Date.now() + Math.random(),
                        question_type: type,
                        content: row.Noi_dung || 'Cau hoi khong co noi dung',
                        difficulty_level: row.Do_kho || 'Biết',
                        points: parseFloat(row.Diem) || 1.0,
                    };

                    if (type === 'mcq') {
                        q.options = [
                            { option_text: row.Dap_an_A || '', is_correct: false },
                            { option_text: row.Dap_an_B || '', is_correct: false },
                            { option_text: row.Dap_an_C || '', is_correct: false },
                            { option_text: row.Dap_an_D || '', is_correct: false }
                        ];
                        const correctChar = (row.Dap_an_Dung || '').toUpperCase().trim();
                        if (correctChar === 'A') q.options[0].is_correct = true;
                        if (correctChar === 'B') q.options[1].is_correct = true;
                        if (correctChar === 'C') q.options[2].is_correct = true;
                        if (correctChar === 'D') q.options[3].is_correct = true;
                    }
                    return q;
                });
            }

            if (newQuestions.length > 0) {
                examQuestions = [...examQuestions, ...newQuestions];
                renderQuestions();
                alert(`Đã nhập thành công ${newQuestions.length} câu hỏi!`);
            } else {
                alert('Không tìm thấy dữ liệu câu hỏi hợp lệ!');
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi đọc file! Vui lòng kiểm tra định dạng.');
        }
        input.value = '';
    };

    if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

async function exportExamQuestions(examId) {
    try {
        const response = await axios.get(`/api/exams/${examId}`);
        const { exam, questions } = response.data;

        const rows = questions.map(q => {
            const row = {
                Loai_CH: q.question_type,
                Noi_dung: q.content,
                Do_kho: q.difficulty_level,
                Diem: q.points
            };
            
            if (q.question_type === 'mcq' && q.options) {
                const opts = q.options; 
                if (Array.isArray(opts)) {
                   row.Dap_an_A = opts[0]?.option_text || '';
                   row.Dap_an_B = opts[1]?.option_text || '';
                   row.Dap_an_C = opts[2]?.option_text || '';
                   row.Dap_an_D = opts[3]?.option_text || '';
                   
                   const correctIdx = opts.findIndex(o => o.is_correct);
                   if (correctIdx === 0) row.Dap_an_Dung = 'A';
                   else if (correctIdx === 1) row.Dap_an_Dung = 'B';
                   else if (correctIdx === 2) row.Dap_an_Dung = 'C';
                   else if (correctIdx === 3) row.Dap_an_Dung = 'D';
                }
            }
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "De_Thi");
        XLSX.writeFile(wb, `De_thi_${exam.title}.xlsx`);
        
    } catch (error) {
        console.error(error);
        alert('Lỗi khi xuất đề thi!');
    }
}

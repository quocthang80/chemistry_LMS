# Chemistry LMS - Hệ thống quản lý học tập môn Hóa học

## Tổng quan dự án

**Chemistry LMS** là một hệ thống quản lý học tập (Learning Management System) chuyên biệt cho môn Hóa học, được xây dựng trên nền tảng Cloudflare Pages với Hono Framework.

### Mục tiêu
- Cung cấp nền tảng thi trực tuyến cho học sinh
- Hỗ trợ giáo viên quản lý đề thi và học sinh hiệu quả
- Tích hợp AI để tự động sinh đề thi
- Hỗ trợ nhiều dạng câu hỏi: trắc nghiệm, đúng/sai, tự luận

### Tính năng chính

#### Dành cho Giáo viên
- ✅ Quản lý học sinh (thêm, sửa, xóa)
- ✅ Quản lý thư mục đề thi (tạo, **chỉnh sửa**, xóa)
- ✅ Tạo đề thi với 3 dạng câu hỏi:
  - Trắc nghiệm nhiều lựa chọn (MCQ)
  - Trắc nghiệm đúng/sai (4 mệnh đề)
  - Tự luận
- ✅ Phân loại câu hỏi theo cấp độ: Biết, Hiểu, Vận dụng
- ✅ Xem kết quả chi tiết với:
  - **Thống kê tổng hợp** (điểm TB, cao nhất, tỷ lệ đậu)
  - **Bảng xếp hạng** với huy chương
  - **Chi tiết từng bài làm** của học sinh
  - **Màu sắc đánh dấu** đáp án đúng/sai
- ✅ **Tích hợp AI sinh đề tự động** với OpenAI GPT-5
- 🔄 Import/Export đề thi (Excel/CSV/JSON) - Đang phát triển

#### Dành cho Học sinh
- ✅ Đăng nhập bằng mã số học sinh
- ✅ Xem danh sách đề thi có sẵn
- ✅ Làm bài thi trực tuyến với đồng hồ đếm ngược
- ✅ Hệ thống tự động chấm điểm
- ✅ Xem lịch sử kết quả thi

## Kiến trúc dữ liệu

### Cloudflare D1 Database (SQLite)

#### Collections chính:
- **teachers**: Quản lý tài khoản giáo viên
- **students**: Thông tin học sinh (mã số, tên, lớp)
- **exam_folders**: Thư mục phân loại đề thi
- **exams**: Đề thi (tiêu đề, thời gian, nguồn tạo)
- **questions**: Câu hỏi (nội dung, loại, cấp độ, điểm)
- **question_options**: Lựa chọn cho câu MCQ
- **question_statements**: Mệnh đề cho câu True/False
- **results**: Kết quả thi (điểm số, thời gian nộp)

### Luồng dữ liệu:
```
Giáo viên tạo đề → Exams + Questions
                      ↓
Học sinh làm bài → Answers (lưu tạm)
                      ↓
Nộp bài → Results (tự động tính điểm)
```

## API Endpoints

### Authentication
- `POST /api/auth/teacher/login` - Đăng nhập giáo viên
- `POST /api/auth/student/login` - Đăng nhập học sinh

### Students Management
- `GET /api/students` - Lấy danh sách học sinh
- `POST /api/students` - Thêm học sinh mới
- `PUT /api/students/:id` - Cập nhật học sinh
- `DELETE /api/students/:id` - Xóa học sinh

### Exam Folders
- `GET /api/folders` - Lấy danh sách thư mục
- `POST /api/folders` - Tạo thư mục mới
- `PUT /api/folders/:id` - Cập nhật thư mục
- `DELETE /api/folders/:id` - Xóa thư mục

### Exams Management
- `GET /api/exams` - Lấy tất cả đề thi
- `GET /api/exams/:id` - Lấy chi tiết đề thi
- `POST /api/exams` - Tạo đề thi mới
- `PUT /api/exams/:id` - Cập nhật đề thi
- `DELETE /api/exams/:id` - Xóa đề thi

### Results
- `POST /api/results` - Nộp bài thi
- `GET /api/students/:studentId/results` - Kết quả của học sinh
- `GET /api/exams/:examId/results` - Kết quả của đề thi

### AI Generation
- `POST /api/ai/generate-questions` - Sinh câu hỏi bằng AI (OpenAI GPT-5)
  - Tham số: `topic`, `difficulty_level`, `question_type`, `count`
  - Hỗ trợ: MCQ, True/False, Essay
  - Tự động tạo đáp án và mệnh đề

## Hướng dẫn sử dụng

### Dành cho Giáo viên
1. Truy cập trang chủ và chọn "Giáo viên"
2. Đăng nhập với tài khoản (mặc định: `admin` / `admin123`)
3. Quản lý học sinh: Thêm danh sách học sinh vào hệ thống
4. Tạo thư mục đề thi để phân loại
5. Tạo đề thi mới:
   - Chọn thư mục
   - Thêm câu hỏi (MCQ, True/False, Essay)
   - Gán cấp độ và điểm cho mỗi câu
6. Xem kết quả và thống kê của học sinh

### Dành cho Học sinh
1. Truy cập trang chủ và chọn "Học sinh"
2. Đăng nhập bằng mã số học sinh (VD: `HS001`)
3. Chọn đề thi từ danh sách
4. Làm bài trong thời gian quy định
5. Nộp bài và xem điểm ngay lập tức
6. Xem lại lịch sử các bài đã làm

## Công nghệ sử dụng

### Backend
- **Hono Framework**: Lightweight web framework
- **Cloudflare Workers**: Edge runtime
- **Cloudflare D1**: Distributed SQLite database
- **TypeScript**: Type-safe development

### Frontend
- **HTML/CSS/JavaScript**: Native web technologies
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client
- **Font Awesome**: Icon library

### Development Tools
- **Wrangler**: Cloudflare CLI
- **Vite**: Build tool
- **PM2**: Process manager (development)

## URLs

### Development (Sandbox)
- **Homepage**: https://3000-io9one81qpapvxe0wt0l6-ad490db5.sandbox.novita.ai
- **Teacher Portal**: https://3000-io9one81qpapvxe0wt0l6-ad490db5.sandbox.novita.ai/teacher
- **Student Portal**: https://3000-io9one81qpapvxe0wt0l6-ad490db5.sandbox.novita.ai/student
- **API Base**: https://3000-io9one81qpapvxe0wt0l6-ad490db5.sandbox.novita.ai/api

### GitHub Repository
- **Repository**: https://github.com/qtquocthang8-ship-it/chemclass
- **Clone**: `git clone https://github.com/qtquocthang8-ship-it/chemclass.git`

### Production
- Sẽ được cập nhật sau khi deploy lên Cloudflare Pages

## Trạng thái triển khai

- **Platform**: Cloudflare Pages
- **Status**: ✅ Active (Development Sandbox)
- **Database**: Cloudflare D1 (Local mode)
- **Last Updated**: 2025-12-05
- **Backup**: [Download](https://www.genspark.ai/api/files/s/jZ6bmWva)

## Tính năng hoàn thiện

### ✅ Đã triển khai
- ✅ Chỉnh sửa thư mục đề thi
- ✅ Xem chi tiết bài làm của học sinh
- ✅ Thống kê kết quả với biểu đồ và bảng xếp hạng
- ✅ Tích hợp OpenAI GPT-5 để sinh câu hỏi tự động
- ✅ Hỗ trợ sinh 3 loại câu hỏi bằng AI
- ✅ Chấm điểm tự động cho MCQ và True/False
- ✅ Hiển thị màu sắc đánh dấu đáp án

### 🔄 Đang phát triển
- [ ] Import đề thi từ Excel/CSV/JSON
- [ ] Export kết quả ra báo cáo Excel/PDF
- [ ] Chấm điểm tự luận bằng AI
- [ ] Hệ thống thông báo real-time
- [ ] Phân quyền nâng cao (nhiều giáo viên)
- [ ] Lịch thi tự động

## Khởi động dự án

### Cài đặt dependencies
```bash
npm install
```

### Khởi tạo database
```bash
npm run db:migrate:local
npm run db:seed
```

### Chạy development server
```bash
npm run build
pm2 start ecosystem.config.cjs
```

### Xem logs
```bash
pm2 logs chemistry-lms --nostream
```

### Dừng server
```bash
pm2 delete chemistry-lms
```

## Tác giả

Dự án được phát triển với mục đích hỗ trợ giảng dạy và học tập môn Hóa học hiệu quả hơn.

## License

MIT

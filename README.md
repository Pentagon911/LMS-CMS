# LMS-CMS: Learning Management & Content Management System

A comprehensive full-stack Learning Management System (LMS) and Content Management System (CMS) built for academic institutions. This platform provides integrated tools for managing courses, students, instructors, academic appeals, exams, and learning content with a modern React frontend and Django REST backend.

---

## 📋 Features

### Core LMS Features
- **Academic Structure**: Manage faculties, departments, batches, programs, and courses
- **Course Management**: Create and organize courses with modules, credit tracking, and instructor assignment
- **Student Enrollment**: Track student enrollments with status management (enrolled, dropped, completed)
- **Exam Management**: Upload exam timetables and manage exam results with score tracking
- **Grading System**: Support for grade assignment and GPA calculations

### CMS Features
- **Content Management**: Manage learning materials and course content
- **Rich Text Editing**: Integrated rich text editor (Quill) with LaTeX/KaTeX support for mathematical content
- **File Management**: Upload and manage course materials, supporting documents, and media

### Student Appeals System
A robust multi-category appeals system for students:

#### Appeal Types:
- **Bursary Applications**: Financial aid requests with income bracket assessment
- **Hostel Facility**: Accommodation requests with room allocation
- **Exam Rewrite**: Appeals for exam re-attempts with medical/conflict justification
- **Medical Leave**: Absence applications with medical documentation
- **Result Re-evaluation**: Grade appeal requests with detailed review tracking

#### Appeal Management:
- Status tracking (Pending → Under Review → Approved/Rejected → Processed)
- Priority-based review queue (High/Medium/Low)
- Comprehensive document upload and attachment system
- Admin review workflow with notes and decision tracking
- Department/Faculty/Batch-based filtering and categorization

### Authentication & Authorization
- JWT-based authentication with token blacklisting
- Role-based access control:
  - **Student**: Enroll in courses, submit appeals, view results
  - **Instructor**: Manage courses, grade students, review appeals
  - **Admin**: System administration and approval workflows
- Token refresh and session management

---

## 🏗️ Architecture

### Stack
- **Frontend**: React 19 + Vite, React Router 7 for client-side routing
- **Backend**: Django 5.2 + Django REST Framework, PostgreSQL/SQLite
- **Authentication**: JWT (SimpleJWT) with token rotation and blacklisting
- **Rich Content**: Quill 2.0 (rich text editor) + KaTeX/React-KaTeX (LaTeX support)

### Notable Libraries
- **django-cors-headers**: Cross-origin request handling
- **djangorestframework-simplejwt**: JWT authentication implementation
- **axios**: HTTP client for React frontend
- **react-router-dom**: Client-side routing and navigation
- **react-icons**: Icon library for UI components
- **mathquill**: Mathematical expression input

### Project Structure

```
Backend/
  manage.py              Django command-line tool
  requirements.txt       Python dependencies
  Backend/               Django project settings
    settings.py          Configuration (JWT, CORS, apps)
    urls.py              Main URL router
    wsgi.py              Production application
  users/                 User management app
    models.py            Custom User model with roles
    views.py             Authentication endpoints
    permissions.py       Role-based permissions
    serializers.py       User data serialization
  lms/                   Learning management app
    models.py            Course, enrollment, exam models
    views.py             LMS API endpoints
    serializers.py       LMS data validation
    appeal_urls.py       Appeal-specific URL routes
  CMS/                   Content management app
    models.py            Content and material models
    views.py             CMS API endpoints
    serializers.py       Content serialization

frontend/
  src/
    main.jsx             Application entry point
    App.jsx              Root React component
    index.css            Global styling
    modules/             Modular feature components
    routes/              Route definitions
    utils/               Utility functions and helpers
    assets/              Static images and resources
  vite.config.js         Vite build configuration
  package.json           JavaScript dependencies
  index.html             HTML template
```

### Data Flow
1. **Frontend** (React + Vite) renders UI and sends API requests via axios
2. **Backend** (Django REST) handles HTTP requests, applies role-based permissions
3. **Authentication** enforced at endpoint level using JWT tokens
4. **Database** stores academic structure, user data, courses, appeals, and content
5. **Media Files** uploaded to media/ directory for exam PDFs, documents, profile pictures

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+ and npm
- SQLite (included) or PostgreSQL

### Backend Setup

1. **Navigate to Backend directory**
   ```bash
   cd Backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```
   Backend API available at: `http://localhost:8000`
   Admin panel: `http://localhost:8000/admin`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend available at: `http://localhost:5173`

### Configuration

**CORS Settings** (Backend/Backend/settings.py):
- Default allows localhost:5173 for development
- Configure for production in `CORS_ALLOWED_ORIGINS`

**JWT Settings**:
- Access token lifetime: 30 minutes
- Refresh token lifetime: 60 minutes
- Algorithm: HS256

**Database**:
- Default: SQLite (db.sqlite3)
- For production, configure PostgreSQL in settings.py

---

## 🔌 API Endpoints

### Authentication
- `POST /users/login/` - User login (returns JWT tokens)
- `POST /users/refresh/` - Refresh access token
- `POST /users/logout/` - Logout and blacklist token

### Courses
- `GET/POST /lms/courses/` - List/create courses
- `GET/PUT /lms/courses/{id}/` - Retrieve/update course
- `GET /lms/courses/{id}/enrollments/` - Course enrollments

### Student Enrollments
- `GET/POST /lms/enrollments/` - List/create enrollments
- `GET/PUT /lms/enrollments/{id}/` - Retrieve/update enrollment

### Exams
- `GET/POST /lms/exams/` - List/create exam timetables
- `GET/POST /lms/exam-results/` - List/create exam results

### Appeals
- `GET/POST /lms/appeals/bursary/` - Bursary applications
- `GET/POST /lms/appeals/hostel/` - Hostel applications
- `GET/POST /lms/appeals/exam-rewrite/` - Exam rewrite appeals
- `GET/POST /lms/appeals/medical-leave/` - Medical leave applications
- `GET/POST /lms/appeals/result-reevaluation/` - Result re-evaluation appeals
- `GET /lms/appeals/review-queue/` - Admin review queue

### CMS Content
- `GET/POST /cms/content/` - List/create content
- `GET/PUT /cms/content/{id}/` - Retrieve/update content

---

## 📦 Database Models

### Core Models
- **User**: Custom user with roles (student/instructor/admin)
- **Faculty**: University faculty/college
- **Department**: Department within faculty
- **Batch**: Academic batch/year
- **Program**: Degree program
- **Course**: Course with instructors, credits, semester info
- **Module**: Course modules/chapters
- **Enrollment**: Student course enrollment with status

### Exam Models
- **ExamTimetable**: Published exam schedule with PDF
- **ExamResult**: Student exam scores and grades

### Appeal Models (Polymorphic Design)
- **BaseAppeal**: Abstract base with common fields
  - BursaryAppeal
  - HostelAppeal
  - ExamRewriteAppeal
  - MedicalLeaveAppeal
  - ResultReEvaluationAppeal
- **AppealReviewQueue**: Admin review tracking
- **AppealAttachment**: Additional documents for appeals

---

## 🔐 Security Features

- JWT authentication with token rotation
- Token blacklisting on logout
- CORS configured for specified origins
- Role-based permission checks on all endpoints
- Password validation and change tracking
- Secure file upload handling
- Database query optimization with indexes

---

## 🛠️ Development

### Running Tests
```bash
# Backend
python manage.py test

# Frontend
npm run lint
```

### Building for Production

**Backend**:
- Configure DEBUG = False
- Set ALLOWED_HOSTS
- Use environment variables for SECRET_KEY
- Migrate to PostgreSQL for production

**Frontend**:
```bash
npm run build
```
Production build in `dist/` directory

---

## 📝 Notes

- LaTeX/KaTeX support integrated for mathematical content in CMS
- Exam PDFs can be uploaded and stored in media directory
- Appeal system supports extensibility for new appeal types
- Admin interface available at `/admin/` for direct database management
- Comprehensive logging available for audit trails

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Backend changes maintain backward API compatibility
- Frontend components follow React best practices
- All models have appropriate Django admin registration
- Documentation is updated with new features

---

## 📄 License

[Add your license here]

---

## 👥 Team

Pentagon911 Organization

---

## 📞 Support

For issues, feature requests, or questions, please open an issue in the repository.

---

**Last Updated**: July 2026

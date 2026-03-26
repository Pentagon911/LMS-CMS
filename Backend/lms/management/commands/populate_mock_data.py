import random
from datetime import date, timedelta, time
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from lms.models import *
from CMS.models import *
from users.models import User
from users.profiles import *

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with mock data for development'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Starting to populate mock data...'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        try:
            # 1. Create faculties
            self.stdout.write('\n📚 Creating faculties...')
            faculties = self.create_faculties()
            
            # 2. Create departments
            self.stdout.write('\n🏛️ Creating departments...')
            departments = self.create_departments(faculties)
            
            # 3. Create programs
            self.stdout.write('\n📜 Creating programs...')
            programs = self.create_programs(departments)
            
            # 4. Create batches
            self.stdout.write('\n📅 Creating batches...')
            batches = self.create_batches(departments)
            
            # 5. Create users (students, instructors, admins)
            self.stdout.write('\n👥 Creating users...')
            users = self.create_users(departments, batches, programs)
            
            # 6. Create courses and modules
            self.stdout.write('\n📖 Creating courses and modules...')
            courses, modules = self.create_courses_modules(departments, batches, users['instructors'], programs)
            
            # 7. Create enrollments
            self.stdout.write('\n📝 Creating enrollments...')
            self.create_enrollments(users['students'], courses)
            
            # 8. Create exam timetables (PDF uploads only)
            self.stdout.write('\n📅 Creating exam timetables...')
            self.create_exam_timetables(courses)
            
            # 9. Create exam results
            self.stdout.write('\n📊 Creating exam results...')
            self.create_exam_results(users['students'], courses)
            
            # 10. Create CMS content (Weeks, Videos, PDFs, Links) - EXACTLY 14 WEEKS
            self.stdout.write('\n🎥 Creating CMS content...')
            weeks = self.create_cms_content(courses, target_weeks=14)
            
            # 11. Create quizzes and questions
            self.stdout.write('\n📝 Creating quizzes and questions...')
            self.create_quizzes(weeks, courses)
            
            # 12. Create quiz attempts and answers
            self.stdout.write('\n✓ Creating quiz attempts...')
            self.create_quiz_attempts(users['students'])
            
            # 13. Create announcements
            self.stdout.write('\n📢 Creating announcements...')
            self.create_announcements(users['instructors'], users['admins'], batches, courses, weeks)
            
            # 14. Create appeals
            self.stdout.write('\n✉️ Creating appeals...')
            self.create_appeals(users['students'], departments, faculties, batches, courses, modules)
            
            # 15. Create review queue
            self.stdout.write('\n🗂️ Creating review queue...')
            self.create_review_queue(users['admins'])
            
            self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
            self.stdout.write(self.style.SUCCESS('✅ Mock data population completed successfully!'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error: {str(e)}'))
            self.stdout.write(self.style.ERROR('\n💡 Tip: Make sure you have run migrations first:'))
            self.stdout.write(self.style.ERROR('   python manage.py makemigrations'))
            self.stdout.write(self.style.ERROR('   python manage.py migrate'))
            raise
    
    def create_faculties(self):
        faculties_data = [
            {'name': 'Faculty of Engineering', 'code': 'ENG', 'description': 'Engineering and Technology'},
            {'name': 'Faculty of Science', 'code': 'SCI', 'description': 'Science and Mathematics'},
            {'name': 'Faculty of Business', 'code': 'BUS', 'description': 'Business and Management'},
            {'name': 'Faculty of Medicine', 'code': 'MED', 'description': 'Medical and Health Sciences'},
            {'name': 'Faculty of Arts', 'code': 'ART', 'description': 'Arts and Humanities'},
        ]
        
        faculties = []
        for data in faculties_data:
            faculty, created = Faculty.objects.get_or_create(code=data['code'], defaults=data)
            faculties.append(faculty)
            if created:
                self.stdout.write(f"  ✓ Created faculty: {faculty.name}")
            else:
                self.stdout.write(f"  → Faculty already exists: {faculty.name}")
        return faculties
    
    def create_departments(self, faculties):
        departments_data = {
            'ENG': [
                {'name': 'Computer Science', 'code': 'CS', 'description': 'Computer Science and Engineering'},
                {'name': 'Electrical Engineering', 'code': 'EE', 'description': 'Electrical and Electronic Engineering'},
                {'name': 'Mechanical Engineering', 'code': 'ME', 'description': 'Mechanical Engineering'},
                {'name': 'Civil Engineering', 'code': 'CE', 'description': 'Civil Engineering'},
            ],
            'SCI': [
                {'name': 'Mathematics', 'code': 'MATH', 'description': 'Mathematics and Statistics'},
                {'name': 'Physics', 'code': 'PHY', 'description': 'Physics and Astronomy'},
                {'name': 'Chemistry', 'code': 'CHEM', 'description': 'Chemistry and Biochemistry'},
                {'name': 'Biology', 'code': 'BIO', 'description': 'Biological Sciences'},
            ],
            'BUS': [
                {'name': 'Management', 'code': 'MGT', 'description': 'Business Management'},
                {'name': 'Finance', 'code': 'FIN', 'description': 'Finance and Accounting'},
                {'name': 'Marketing', 'code': 'MKT', 'description': 'Marketing and Communications'},
            ],
        }
        
        departments = []
        for faculty in faculties:
            if faculty.code in departments_data:
                for data in departments_data[faculty.code]:
                    dept, created = Department.objects.get_or_create(
                        code=data['code'],
                        defaults={
                            'name': data['name'],
                            'faculty': faculty,
                            'description': data['description']
                        }
                    )
                    departments.append(dept)
                    if created:
                        self.stdout.write(f"  ✓ Created department: {dept.name}")
        return departments
    
    def create_programs(self, departments):
        """Create programs for each department and store default program per department"""
        programs = []
        self.default_programs = {}   # attribute to store default program for each department

        program_templates = {
            'CS': [
                {'code': 'BSCS', 'name': 'Bachelor of Science in Computer Science', 'description': 'Comprehensive computer science program'},
                {'code': 'BSIT', 'name': 'Bachelor of Science in Information Technology', 'description': 'IT and systems management'},
            ],
            'EE': [
                {'code': 'BSEE', 'name': 'Bachelor of Science in Electrical Engineering', 'description': 'Electrical engineering program'},
            ],
            'ME': [
                {'code': 'BSME', 'name': 'Bachelor of Science in Mechanical Engineering', 'description': 'Mechanical engineering program'},
            ],
            'CE': [
                {'code': 'BSCE', 'name': 'Bachelor of Science in Civil Engineering', 'description': 'Civil engineering program'},
            ],
            'MATH': [
                {'code': 'BSMATH', 'name': 'Bachelor of Science in Mathematics', 'description': 'Mathematics program'},
            ],
            'MGT': [
                {'code': 'BBA', 'name': 'Bachelor of Business Administration', 'description': 'Business administration program'},
            ],
        }
        
        for department in departments:
            if department.code in program_templates:
                for template in program_templates[department.code]:
                    program, created = Program.objects.get_or_create(
                        code=template['code'],
                        defaults={
                            'name': template['name'],
                            'department': department,
                            'description': template['description']
                        }
                    )
                    programs.append(program)
                    if created:
                        self.stdout.write(f"  ✓ Created program: {program.name} ({department.code})")
                    # Store the first program for this department as default
                    if department.id not in self.default_programs:
                        self.default_programs[department.id] = program

        # For departments without templates, create a generic program and set as default
        for department in departments:
            if not any(p.department == department for p in programs):
                generic_program, created = Program.objects.get_or_create(
                    code=f"GEN-{department.code}",
                    defaults={
                        'name': f"General Program in {department.name}",
                        'department': department,
                        'description': f"General program in {department.name}"
                    }
                )
                programs.append(generic_program)
                if created:
                    self.stdout.write(f"  ✓ Created generic program: {generic_program.name}")
                self.default_programs[department.id] = generic_program

        self.stdout.write(f"  ✓ Created total {len(programs)} programs")
        return programs
    
    def create_batches(self, departments):
        current_year = date.today().year
        batches = []
        
        for department in departments:
            for year in range(current_year - 3, current_year + 1):
                batch, created = Batch.objects.get_or_create(
                    year=year,
                    department=department,
                    defaults={'name': f'Batch {year % 100}'}
                )
                batches.append(batch)
                if created:
                    self.stdout.write(f"  ✓ Created batch: {batch.name} ({department.name})")
        
        self.stdout.write(f"  ✓ Created total {len(batches)} batches")
        return batches
    
    def create_users(self, departments, batches, programs):
        users = {
            'admins': [],
            'instructors': [],
            'students': []
        }
        
        # Create admin users
        admin_data = [
            {'username': 'admin', 'email': 'admin@lms.com', 'first_name': 'Admin', 'last_name': 'User'},
            {'username': 'superadmin', 'email': 'superadmin@lms.com', 'first_name': 'Super', 'last_name': 'Admin'},
        ]
        
        for data in admin_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'admin',
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            if created:
                user.set_password('admin123')
                user.save()
            users['admins'].append(user)
            self.stdout.write(f"  ✓ Created admin: {user.username}")
        
        # Create instructors
        instructor_names = [
            ('Dr. John', 'Smith'), ('Prof. Sarah', 'Johnson'), ('Dr. Michael', 'Brown'),
            ('Prof. Emily', 'Davis'), ('Dr. David', 'Wilson'), ('Prof. Lisa', 'Anderson'),
            ('Dr. Robert', 'Taylor'), ('Prof. Maria', 'Martinez'), ('Dr. James', 'Thomas')
        ]
        
        for i, (first, last) in enumerate(instructor_names[:len(departments)]):
            username = f"{first.lower().replace('dr.', '').replace('prof.', '').strip()}_{last.lower()}"
            username = username.replace('.', '').strip()
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{first.lower().replace('.', '')}.{last.lower()}@lms.com",
                    'first_name': first.replace('Dr.', '').replace('Prof.', '').strip(),
                    'last_name': last,
                    'role': 'instructor',
                    'is_staff': True,
                }
            )
            if created:
                user.set_password('instructor123')
                user.save()
            
            # Create instructor profile
            try:
                InstructorProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'instructor_id': f"INS{user.id:06d}",
                        'department': departments[i % len(departments)],
                    }
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create instructor profile: {e}")
            
            users['instructors'].append(user)
            self.stdout.write(f"  ✓ Created instructor: {user.username}")
        
        # Create students
        student_first_names = ['John', 'Jane', 'Mike', 'Sarah', 'Tom', 'Emma', 'Alex', 'Olivia', 'William', 'Sophia']
        student_last_names = ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Lee', 'Kim', 'Chen', 'Patel']
        
        for i in range(20):
            first = random.choice(student_first_names)
            last = random.choice(student_last_names)
            username = f"{first.lower()}_{last.lower()}_{i+1}"
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{first.lower()}.{last.lower()}{i+1}@student.lms.com",
                    'first_name': first,
                    'last_name': last,
                    'role': 'student',
                }
            )
            if created:
                user.set_password('student123')
                user.save()
            
            # Create student profile with program (now a ForeignKey)
            try:
                department = random.choice(departments)
                batch = random.choice([b for b in batches if b.department == department])
                program = self.default_programs.get(department.id)
                
                StudentProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'student_id': f"STU{user.id:06d}",
                        'department': department,
                        'batch': batch,
                        'program': program,
                        'current_semester': random.randint(1, 8),
                        'cgpa': round(random.uniform(2.0, 4.0), 2),
                        'completed_credits': random.randint(30, 120)
                    }
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create student profile: {e}")
            
            users['students'].append(user)
            
            if i < 10:
                self.stdout.write(f"  ✓ Created student: {user.username}")
        
        self.stdout.write(f"  ✓ Created total {len(users['students'])} students")
        return users
    
    def create_courses_modules(self, departments, batches, instructors, programs):
        courses = []
        modules = []
        
        # Expanded templates with gpa_applicable and offering_type
        course_templates = [
            {'code': '101', 'name': 'Programming Fundamentals', 'credits': 3, 'semester': 1, 'gpa': True, 'offering': 'compulsory'},
            {'code': '102', 'name': 'Data Structures', 'credits': 3, 'semester': 1, 'gpa': True, 'offering': 'compulsory'},
            {'code': '103', 'name': 'Mathematics', 'credits': 3, 'semester': 1, 'gpa': True, 'offering': 'compulsory'},
            {'code': '104', 'name': 'Physics Lab', 'credits': 1, 'semester': 1, 'gpa': False, 'offering': 'compulsory'},
            {'code': '201', 'name': 'Database Systems', 'credits': 3, 'semester': 2, 'gpa': True, 'offering': 'compulsory'},
            {'code': '202', 'name': 'Web Development', 'credits': 3, 'semester': 2, 'gpa': True, 'offering': 'elective'},
            {'code': '203', 'name': 'Software Engineering', 'credits': 3, 'semester': 3, 'gpa': True, 'offering': 'compulsory'},
            {'code': '204', 'name': 'Mobile App Development', 'credits': 3, 'semester': 3, 'gpa': True, 'offering': 'elective'},
        ]
        
        for department in departments[:3]:  # Limit to first 3 departments
            department_programs = [p for p in programs if p.department == department]
            program = self.default_programs.get(department.id)
            
            for template in course_templates:
                course_code = f"{department.code}{template['code']}"
                department_batches = [b for b in batches if b.department == department]
                batch = department_batches[0] if department_batches else None
                
                course, created = Course.objects.get_or_create(
                    code=course_code,
                    defaults={
                        'name': template['name'],
                        'credits': template['credits'],
                        'department': department,
                        'semester': template['semester'],
                        'batch': batch,
                        'program': program,
                        'instructor': random.choice(instructors) if instructors else None,
                        'gpa_applicable': template['gpa'],
                        'offering_type': template['offering']
                    }
                )
                courses.append(course)
                if created:
                    self.stdout.write(f"  ✓ Created course: {course.code} (GPA: {course.gpa_applicable}, Type: {course.offering_type})")
                
                # Create modules for each course
                for j in range(1, 3):
                    module, created = Module.objects.get_or_create(
                        code=f"{course_code}_M{j}",
                        course=course,
                        defaults={
                            'name': f"Module {j}: {course.name} Part {j}",
                            'credits': random.randint(1, 2)
                        }
                    )
                    modules.append(module)
        
        return courses, modules
    
    def create_enrollments(self, students, courses):
        enrollment_count = 0
        for student in students:
            enrolled_courses = random.sample(courses, min(random.randint(2, 4), len(courses)))
            for course in enrolled_courses:
                try:
                    enrollment, created = Enrollment.objects.get_or_create(
                        student=student,
                        course=course,
                        defaults={'status': 'enrolled'}
                    )
                    if created:
                        enrollment_count += 1
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create enrollment: {e}")
        self.stdout.write(f"  ✓ Created {enrollment_count} enrollments for {len(students)} students")
    
    def create_exam_timetables(self, courses):
        """Create exam timetables for all courses (without date/time fields)"""
        exam_count = 0
        
        exam_titles = [
            "Final Exam",
            "Mid-term Exam",
            "Quiz 1",
            "Quiz 2",
            "Practical Exam",
            "Theory Exam"
        ]
        
        for course in courses:
            exam, created = ExamTimetable.objects.get_or_create(
                course=course,
                title=f"{random.choice(exam_titles)} - {course.code}",
                defaults={
                    'semester': course.semester if hasattr(course, 'semester') else random.randint(1, 8),
                    # PDF will be uploaded separately by admins
                }
            )
            if created:
                exam_count += 1
        
        self.stdout.write(f"  ✓ Created {exam_count} exam timetables")
    
    def create_exam_results(self, students, courses):
        """Create exam results for each student for their enrolled courses"""
        result_count = 0
        grade_mapping = {
            (90, 100): 'A+', (85, 89): 'A', (80, 84): 'A-',
            (75, 79): 'B+', (70, 74): 'B', (65, 69): 'B-',
            (60, 64): 'C+', (55, 59): 'C', (50, 54): 'C-',
            (45, 49): 'D', (0, 44): 'F'
        }
        
        for student in students:
            enrolled_courses = Course.objects.filter(enrollments__student=student)
            for course in enrolled_courses:
                exam = ExamTimetable.objects.filter(course=course).first()
                if exam:
                    score = random.randint(40, 100)
                    grade = 'F'
                    for (low, high), g in grade_mapping.items():
                        if low <= score <= high:
                            grade = g
                            break
                    
                    result, created = ExamResult.objects.get_or_create(
                        student=student,
                        exam=exam,
                        defaults={
                            'score': score,
                            'grade': grade,
                            'is_reevaluated': False
                        }
                    )
                    if created:
                        result_count += 1
        
        self.stdout.write(f"  ✓ Created {result_count} exam results")
    
    def create_cms_content(self, courses, target_weeks=14):
        """Create exactly target_weeks weeks distributed across courses"""
        all_weeks = []
        
        topics = [
            "Introduction to the Course",
            "Core Concepts",
            "Advanced Topics",
            "Practical Applications",
            "Review and Assessment",
            "Project Work",
            "Case Studies",
            "Industry Insights",
            "Hands-on Lab",
            "Group Discussion",
            "Guest Lecture",
            "Revision Session",
            "Mid-term Review",
            "Final Project Preparation"
        ]
        
        if not courses:
            self.stdout.write("  ⚠️ No courses available to create weeks")
            return all_weeks
        
        # Calculate weeks per course
        weeks_per_course = target_weeks // len(courses)
        remainder = target_weeks % len(courses)
        
        week_counter = 1
        for idx, course in enumerate(courses):
            num_weeks_for_course = weeks_per_course + (1 if idx < remainder else 0)
            self.stdout.write(f"  → Creating {num_weeks_for_course} weeks for {course.code}")
            
            for week_num in range(1, num_weeks_for_course + 1):
                topic_index = (week_counter - 1) % len(topics)
                week, created = Week.objects.get_or_create(
                    course=course,
                    order=week_num,
                    defaults={
                        'topic': topics[topic_index],
                        'description': f"Week {week_num}: {topics[topic_index]} - Detailed exploration of {topics[topic_index].lower()}"
                    }
                )
                if created:
                    all_weeks.append(week)
                    self.stdout.write(f"    ✓ Created week {week_num}: {week.topic}")
                    week_counter += 1
                    self.create_week_content(week)
        
        self.stdout.write(f"  ✓ Created total {len(all_weeks)} weeks (target: {target_weeks})")
        return all_weeks
    
    def create_week_content(self, week):
        """Create videos, PDFs, and links for a week"""
        # Create 1-2 videos
        video_titles = [
            "Lecture Video",
            "Tutorial Session",
            "Lab Demonstration",
            "Concept Explanation",
            "Case Study"
        ]
        
        for i in range(random.randint(1, 2)):
            video_title = f"{random.choice(video_titles)} - {week.topic}"
            try:
                Video.objects.create(
                    week=week,
                    title=video_title,
                    description=f"This video covers {week.topic}. Watch and take notes.",
                    file=f"videos/{week.course.code}_week{week.order}_video{i+1}.mp4"
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create video: {e}")
        
        # Create 1-2 PDFs
        pdf_titles = [
            "Lecture Notes",
            "Reading Material",
            "Slides",
            "Reference Document",
            "Practice Problems"
        ]
        
        for i in range(random.randint(1, 2)):
            pdf_title = f"{random.choice(pdf_titles)} - {week.topic}"
            try:
                Pdf.objects.create(
                    week=week,
                    title=pdf_title,
                    description=f"Download this PDF for {week.topic} materials.",
                    file=f"pdfs/{week.course.code}_week{week.order}_doc{i+1}.pdf"
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create PDF: {e}")
        
        # Create 1-2 links
        link_titles = [
            "Documentation",
            "External Resource",
            "Reference Website",
            "Video Tutorial",
            "Practice Site"
        ]
        
        for i in range(random.randint(1, 2)):
            link_title = f"{random.choice(link_titles)} - {week.topic}"
            try:
                Link.objects.create(
                    week=week,
                    title=link_title,
                    description=f"Useful external resource for {week.topic}.",
                    link_url=f"https://example.com/{week.course.code.lower()}/week{week.order}/resource{i+1}"
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create link: {e}")
    
    def create_quizzes(self, weeks, courses):
        """Create quizzes for weeks"""
        quiz_count = 0
        quiz_titles = [
            "Knowledge Check",
            "Weekly Assessment",
            "Practice Quiz",
            "Concept Review",
            "Self-Assessment"
        ]
        
        for week in weeks:
            quiz_title = f"{random.choice(quiz_titles)}: {week.topic}"
            try:
                quiz = Quiz.objects.create(
                    courseCode=week.course,
                    week=week,
                    title=quiz_title,
                    timeLimitMinutes=random.choice([10, 15, 20, 30]),
                    description=f"Test your understanding of {week.topic}",
                    order=week.order,
                    status=random.choice(['draft', 'scheduled', 'active']),
                    start_time=timezone.now() + timedelta(days=random.randint(-5, 10))
                )
                quiz_count += 1
                self.create_quiz_questions(quiz)
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create quiz for week {week.order}: {e}")
        
        self.stdout.write(f"  ✓ Created {quiz_count} quizzes")
    
    def create_quiz_questions(self, quiz):
        """Create questions and options for a quiz"""
        question_count = random.randint(3, 8)
        question_texts = [
            "What is the main concept discussed in this week?",
            "Which of the following is correct about this topic?",
            "How would you apply this concept?",
            "What is the key takeaway from this module?",
            "Which statement best describes this concept?",
            "What is the primary purpose of this?",
            "Which of the following is an example?",
            "What should you consider when implementing this?"
        ]
        
        for i in range(question_count):
            question_type = random.choice(['single', 'multiple', 'true_false'])
            try:
                question = Question.objects.create(
                    quiz=quiz,
                    order=i + 1,
                    questionTypes=question_type,
                    text=random.choice(question_texts)
                )
                
                if question_type == 'true_false':
                    Option.objects.create(question=question, order=1, text="True", is_correct=random.choice([True, False]))
                    Option.objects.create(question=question, order=2, text="False", is_correct=not Option.objects.get(question=question, text="True").is_correct)
                else:
                    num_options = random.randint(3, 5)
                    correct_option_index = random.randint(0, num_options - 1)
                    for j in range(num_options):
                        Option.objects.create(
                            question=question,
                            order=j + 1,
                            text=f"Option {chr(65 + j)}: This is {'correct' if j == correct_option_index else 'incorrect'} option for this question.",
                            is_correct=(j == correct_option_index)
                        )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create question: {e}")
    
    def create_quiz_attempts(self, students):
        """Create quiz attempts for students"""
        attempts_count = 0
        quizzes = Quiz.objects.filter(status='active')
        
        for student in students[:10]:
            available_quizzes = list(quizzes)
            if available_quizzes:
                for quiz in random.sample(available_quizzes, min(random.randint(2, 4), len(available_quizzes))):
                    try:
                        if not QuizAttempt.objects.filter(student=student, quiz=quiz, endAt__isnull=False).exists():
                            attempt = QuizAttempt.objects.create(
                                student=student,
                                quiz=quiz,
                                startedAt=timezone.now() - timedelta(days=random.randint(1, 7)),
                                endAt=timezone.now() - timedelta(days=random.randint(0, 6)),
                                score=round(random.uniform(60, 100), 2)
                            )
                            attempts_count += 1
                            self.create_student_answers(attempt)
                    except Exception as e:
                        self.stdout.write(f"  ⚠️ Could not create quiz attempt: {e}")
        
        self.stdout.write(f"  ✓ Created {attempts_count} quiz attempts")
    
    def create_student_answers(self, attempt):
        """Create student answers for a quiz attempt"""
        for question in attempt.quiz.questions.all():
            try:
                correct_options = question.options.filter(is_correct=True)
                if correct_options.exists():
                    student_answer = StudentAnswer.objects.create(
                        attempt=attempt,
                        question=question,
                        isCorrect=random.choice([True, False]),
                        pointsEarned=random.choice([0, 1, 2])
                    )
                    num_selected = random.randint(1, min(3, correct_options.count()))
                    selected_options = random.sample(list(correct_options), num_selected)
                    student_answer.selectedOptions.set(selected_options)
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create student answer: {e}")
    
    def create_announcements(self, instructors, admins, batches, courses, weeks):
        """Create announcements at different levels"""
        announcement_count = 0
        
        # Batch announcements
        for batch in batches[:5]:
            try:
                Announcement.objects.create(
                    announcement_type='batch',
                    batch=batch,
                    title=f"Important Update for {batch.name}",
                    content=f"This announcement is for all students in {batch.name}. Please check the new policies and deadlines.",
                    created_by=random.choice(instructors + admins),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                announcement_count += 1
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create batch announcement: {e}")
        
        # Course announcements
        for course in courses[:8]:
            try:
                Announcement.objects.create(
                    announcement_type='course',
                    course=course,
                    title=f"Course Update: {course.name}",
                    content=f"Important information about {course.name}. Please review the syllabus and upcoming deadlines.",
                    created_by=random.choice(instructors + admins),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                announcement_count += 1
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create course announcement: {e}")
        
        # Week announcements
        for week in weeks[:10]:
            try:
                Announcement.objects.create(
                    announcement_type='week',
                    week=week,
                    title=f"Week {week.order} Update: {week.topic}",
                    content=f"This week we will cover {week.topic}. Please complete the assigned readings and quizzes.",
                    created_by=random.choice(instructors + admins),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 14))
                )
                announcement_count += 1
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create week announcement: {e}")
        
        self.stdout.write(f"  ✓ Created {announcement_count} announcements")
    
    def create_appeals(self, students, departments, faculties, batches, courses, modules):
        """Create appeals with error handling"""
        appeal_statuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
        
        appeal_models = []
        for model in [BursaryAppeal, HostelAppeal, ExamRewriteAppeal, MedicalLeaveAppeal, ResultReEvaluationAppeal]:
            try:
                model.objects.exists()
                appeal_models.append(model)
            except Exception:
                self.stdout.write(f"  ⚠️ Skipping {model.__name__} - table doesn't exist yet")
        
        if not appeal_models:
            self.stdout.write(f"  ⚠️ No appeal models available yet. Run migrations first.")
            return
        
        # Bursary appeals
        if BursaryAppeal in appeal_models:
            bursary_count = 0
            for student in random.sample(students, min(5, len(students))):
                try:
                    BursaryAppeal.objects.create(
                        student=student,
                        academic_year='2024-2025',
                        department=random.choice(departments),
                        faculty=random.choice(faculties),
                        batch=random.choice([b for b in batches if b.department == student.student_profile.department]) if hasattr(student, 'student_profile') and batches else None,
                        title="Financial Assistance Request",
                        description="Need help with tuition fees due to family financial difficulties",
                        family_income_bracket=random.choice(['LOW', 'MEDIUM', 'HIGH']),
                        has_scholarship=random.choice([True, False]),
                        reason_for_aid="Family income insufficient to cover educational expenses",
                        status=random.choice(appeal_statuses)
                    )
                    bursary_count += 1
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create bursary appeal: {e}")
            self.stdout.write(f"  ✓ Created {bursary_count} bursary appeals")
        
        # Hostel appeals
        if HostelAppeal in appeal_models:
            hostel_count = 0
            for student in random.sample(students, min(5, len(students))):
                try:
                    HostelAppeal.objects.create(
                        student=student,
                        academic_year='2024-2025',
                        department=random.choice(departments),
                        faculty=random.choice(faculties),
                        batch=random.choice([b for b in batches if b.department == student.student_profile.department]) if hasattr(student, 'student_profile') and batches else None,
                        title="Hostel Accommodation Request",
                        description="Need hostel accommodation for the upcoming semester",
                        preferred_check_in=date.today() + timedelta(days=random.randint(7, 30)),
                        duration_months=random.choice([3, 6, 9, 12]),
                        has_medical_condition=random.choice([True, False]),
                        status=random.choice(appeal_statuses)
                    )
                    hostel_count += 1
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create hostel appeal: {e}")
            self.stdout.write(f"  ✓ Created {hostel_count} hostel appeals")
        
        # Exam rewrite appeals
        if ExamRewriteAppeal in appeal_models and courses:
            exam_count = 0
            for student in random.sample(students, min(5, len(students))):
                try:
                    ExamRewriteAppeal.objects.create(
                        student=student,
                        academic_year='2024-2025',
                        department=random.choice(departments),
                        faculty=random.choice(faculties),
                        batch=random.choice([b for b in batches if b.department == student.student_profile.department]) if hasattr(student, 'student_profile') and batches else None,
                        title="Exam Rewrite Request",
                        description="Request to rewrite the exam due to medical reasons",
                        course=random.choice(courses),
                        module=random.choice(modules) if modules else None,
                        semester=random.randint(1, 4),
                        original_exam_date=date.today() - timedelta(days=random.randint(30, 60)),
                        reason_type=random.choice(['MEDICAL', 'CONFLICT', 'PERSONAL']),
                        detailed_reason="Medical emergency during exam period",
                        status=random.choice(appeal_statuses)
                    )
                    exam_count += 1
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create exam rewrite appeal: {e}")
            self.stdout.write(f"  ✓ Created {exam_count} exam rewrite appeals")
        
        # Medical leave appeals
        if MedicalLeaveAppeal in appeal_models:
            medical_count = 0
            for student in random.sample(students, min(5, len(students))):
                try:
                    MedicalLeaveAppeal.objects.create(
                        student=student,
                        academic_year='2024-2025',
                        department=random.choice(departments),
                        faculty=random.choice(faculties),
                        batch=random.choice([b for b in batches if b.department == student.student_profile.department]) if hasattr(student, 'student_profile') and batches else None,
                        title="Medical Leave Request",
                        description="Request for medical leave due to surgery",
                        start_date=date.today() + timedelta(days=random.randint(1, 14)),
                        end_date=date.today() + timedelta(days=random.randint(15, 30)),
                        hospital_name="City General Hospital",
                        doctor_name="Dr. Smith",
                        status=random.choice(appeal_statuses)
                    )
                    medical_count += 1
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create medical leave appeal: {e}")
            self.stdout.write(f"  ✓ Created {medical_count} medical leave appeals")
        
        # Result re-evaluation appeals
        if ResultReEvaluationAppeal in appeal_models:
            reeval_count = 0
            exam_results = ExamResult.objects.all()
            for exam in random.sample(list(exam_results), min(3, len(exam_results))):
                try:
                    ResultReEvaluationAppeal.objects.create(
                        student=exam.student,
                        academic_year='2024-2025',
                        department=exam.exam.course.department,
                        faculty=exam.exam.course.department.faculty,
                        title="Result Re-evaluation Request",
                        description="Request to re-evaluate the exam paper",
                        exam_result=exam,
                        reason_type=random.choice(['CALCULATION', 'PAPER_REVIEW', 'GRADE_BOUNDARY']),
                        specific_concerns="Marks seem lower than expected",
                        status=random.choice(appeal_statuses)
                    )
                    reeval_count += 1
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create result re-evaluation appeal: {e}")
            self.stdout.write(f"  ✓ Created {reeval_count} result re-evaluation appeals")
    
    def create_review_queue(self, admins):
        """Create review queue entries"""
        all_appeals = []
        for model in [BursaryAppeal, HostelAppeal, ExamRewriteAppeal, MedicalLeaveAppeal, ResultReEvaluationAppeal]:
            try:
                all_appeals.extend(model.objects.all())
            except Exception:
                pass
        
        if not all_appeals:
            self.stdout.write(f"  ⚠️ No appeals found to add to review queue")
            return
        
        queue_count = 0
        category_map = {
            'BursaryAppeal': 'financial',
            'HostelAppeal': 'welfare',
            'ExamRewriteAppeal': 'academic',
            'MedicalLeaveAppeal': 'medical',
            'ResultReEvaluationAppeal': 'academic'
        }
        
        for appeal in all_appeals[:20]:
            if hasattr(appeal, 'status') and appeal.status in ['PENDING', 'UNDER_REVIEW']:
                category = category_map.get(appeal.__class__.__name__, 'other')
                try:
                    queue_item, created = AppealReviewQueue.objects.get_or_create(
                        content_type=ContentType.objects.get_for_model(appeal),
                        object_id=appeal.id,
                        defaults={
                            'category': category,
                            'priority': random.choice(['HIGH', 'MEDIUM', 'LOW']),
                            'assigned_to': random.choice(admins) if admins else None,
                            'department': appeal.department,
                            'faculty': appeal.faculty,
                            'batch': appeal.batch if hasattr(appeal, 'batch') else None,
                            'academic_year': appeal.academic_year,
                            'is_processed': False
                        }
                    )
                    if created:
                        queue_count += 1
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create review queue entry: {e}")
        
        self.stdout.write(f"  ✓ Created {queue_count} review queue entries")
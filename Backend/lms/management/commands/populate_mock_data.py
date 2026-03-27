import random
from datetime import date, timedelta, time
from django.core.management.base import BaseCommand
from django.db import OperationalError
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

    def __init__(self):
        super().__init__()
        # Store data that needs to be accessed across methods
        self.departments = []
        self.faculties = []
        self.batches = []
        self.programs = []
        self.default_programs = {}
        self.courses = []
        self.modules = []
        self.instructors_list = []  # Store all instructors for multiple assignment

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Starting to populate mock data...'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        # Check if tables exist
        try:
            # Try to access the User table to see if it exists
            User.objects.exists()
        except OperationalError as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Database tables not found: {e}'))
            self.stdout.write(self.style.ERROR('\n📝 Please run migrations first:'))
            self.stdout.write(self.style.ERROR('   python manage.py makemigrations users'))
            self.stdout.write(self.style.ERROR('   python manage.py makemigrations lms'))
            self.stdout.write(self.style.ERROR('   python manage.py makemigrations CMS'))
            self.stdout.write(self.style.ERROR('   python manage.py migrate'))
            return
        
        try:
            # 1. Create faculties
            self.stdout.write('\n📚 Creating faculties...')
            self.faculties = self.create_faculties()
            
            # 2. Create departments
            self.stdout.write('\n🏛️ Creating departments...')
            self.departments = self.create_departments(self.faculties)
            
            # 3. Create programs
            self.stdout.write('\n📜 Creating programs...')
            self.programs, self.default_programs = self.create_programs(self.departments)
            
            # 4. Create batches
            self.stdout.write('\n📅 Creating batches...')
            self.batches = self.create_batches(self.departments)
            
            # 5. Create users (students, instructors, admins)
            self.stdout.write('\n👥 Creating users...')
            users = self.create_users(self.departments, self.batches, self.programs, self.default_programs)
            self.instructors_list = users['instructors']  # Store for later use
            
            # 6. Create courses and modules with multiple instructors
            self.stdout.write('\n📖 Creating courses and modules...')
            self.courses, self.modules = self.create_courses_modules(
                self.departments, self.batches, self.instructors_list, self.programs, self.default_programs
            )
            
            # 7. Create enrollments (each student assigned 4 modules)
            self.stdout.write('\n📝 Creating enrollments...')
            self.create_enrollments(users['students'], self.courses, target_modules=4)
            
            # 8. Create exam timetables (PDF uploads only)
            self.stdout.write('\n📅 Creating exam timetables...')
            self.create_exam_timetables(self.courses)
            
            # 9. Create exam results
            self.stdout.write('\n📊 Creating exam results...')
            self.create_exam_results(users['students'], self.courses)
            
            # 10. Create CMS content (14 weeks per module)
            self.stdout.write('\n🎥 Creating CMS content...')
            weeks = self.create_cms_content(self.courses, target_weeks=14)
            
            # 11. Create quizzes (5 quizzes per instructor)
            self.stdout.write('\n📝 Creating quizzes...')
            self.create_quizzes(weeks, self.courses, self.instructors_list, self.departments, self.default_programs)
            
            # 12. Create quiz attempts and answers
            self.stdout.write('\n✓ Creating quiz attempts...')
            self.create_quiz_attempts(users['students'])
            
            # 13. Create announcements (for batch, faculty, course)
            self.stdout.write('\n📢 Creating announcements...')
            self.create_announcements(self.instructors_list, users['admins'], self.batches, self.faculties, self.courses)
            
            # 13b. Create GLOBAL announcements (new)
            self.stdout.write('\n🌍 Creating global announcements...')
            self.create_global_announcements(
                self.instructors_list, 
                users['admins'], 
                self.faculties, 
                self.departments, 
                self.batches,
                self.programs
            )
            # 14. Create academic calendars
            self.stdout.write('\n📅 Creating academic calendars...')
            self.create_academic_calendars(self.faculties, users['admins'])
            
            # 15. Create practical timetables
            self.stdout.write('\n🔬 Creating practical timetables...')
            self.create_practical_timetables(self.faculties, users['admins'])
            
            # 16. Create appeals
            self.stdout.write('\n✉️ Creating appeals...')
            self.create_appeals(users['students'], self.departments, self.faculties, self.batches, self.courses, self.modules)
            
            # 17. Create review queue
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
        default_programs = {}   # attribute to store default program for each department

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
                    if department.id not in default_programs:
                        default_programs[department.id] = program

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
                default_programs[department.id] = generic_program

        self.stdout.write(f"  ✓ Created total {len(programs)} programs")
        return programs, default_programs
    
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
    
    def create_users(self, departments, batches, programs, default_programs):
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
        
        # Create instructors (increase number to 15 for better distribution)
        instructor_names = [
            ('Dr. John', 'Smith'), ('Prof. Sarah', 'Johnson'), ('Dr. Michael', 'Brown'),
            ('Prof. Emily', 'Davis'), ('Dr. David', 'Wilson'), ('Prof. Lisa', 'Anderson'),
            ('Dr. Robert', 'Taylor'), ('Prof. Maria', 'Martinez'), ('Dr. James', 'Thomas'),
            ('Dr. Patricia', 'Garcia'), ('Prof. Charles', 'Rodriguez'), ('Dr. Barbara', 'Miller'),
            ('Prof. Richard', 'Jones'), ('Dr. Susan', 'Williams'), ('Prof. Joseph', 'Clark')
        ]
        
        for i, (first, last) in enumerate(instructor_names[:15]):  # Create 15 instructors
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
                department = departments[i % len(departments)]
                InstructorProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'instructor_id': f"INS{user.id:06d}",
                        'faculty': department.faculty,
                        'department': department,
                        'contract_type': random.choice(['FULL', 'PART', 'TA'])
                    }
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create instructor profile: {e}")
            
            users['instructors'].append(user)
            self.stdout.write(f"  ✓ Created instructor: {user.username}")
        
        # Create students (20 students)
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
                program = default_programs.get(department.id)
                
                StudentProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'student_id': f"STU{user.id:06d}",
                        'faculty': department.faculty,
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
    
    def create_courses_modules(self, departments, batches, instructors, programs, default_programs):
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
            {'code': '301', 'name': 'Artificial Intelligence', 'credits': 3, 'semester': 4, 'gpa': True, 'offering': 'compulsory'},
            {'code': '302', 'name': 'Cloud Computing', 'credits': 3, 'semester': 4, 'gpa': True, 'offering': 'elective'},
            {'code': '401', 'name': 'Machine Learning', 'credits': 3, 'semester': 5, 'gpa': True, 'offering': 'compulsory'},
            {'code': '402', 'name': 'Cybersecurity', 'credits': 3, 'semester': 5, 'gpa': True, 'offering': 'elective'},
        ]
        
        for department in departments[:3]:  # Limit to first 3 departments
            program = default_programs.get(department.id)
            
            for template in course_templates:
                course_code = f"{department.code}{template['code']}"
                department_batches = [b for b in batches if b.department == department]
                batch = department_batches[0] if department_batches else None
                
                # Select 1-3 random instructors for this course
                num_instructors = random.randint(1, min(3, len(instructors)))
                selected_instructors = random.sample(instructors, num_instructors)
                
                course, created = Course.objects.get_or_create(
                    code=course_code,
                    defaults={
                        'name': template['name'],
                        'credits': template['credits'],
                        'department': department,
                        'semester': template['semester'],
                        'batch': batch,
                        'program': program,
                        'gpa_applicable': template['gpa'],
                        'offering_type': template['offering'],
                        'color': random.choice(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'])
                    }
                )
                
                # If course already exists or was just created, assign instructors
                if created:
                    course.instructors.set(selected_instructors)
                    self.stdout.write(f"  ✓ Created course: {course.code} (Instructors: {len(selected_instructors)}, GPA: {course.gpa_applicable}, Type: {course.offering_type})")
                else:
                    # For existing courses, add instructors if none assigned
                    if course.instructors.count() == 0:
                        course.instructors.set(selected_instructors)
                        self.stdout.write(f"  → Updated course: {course.code} with {len(selected_instructors)} instructors")
                
                courses.append(course)
                
                # Create modules for each course (1 module per course)
                module, created = Module.objects.get_or_create(
                    code=f"{course_code}_M1",
                    course=course,
                    defaults={
                        'name': f"Full Course: {course.name}",
                        'credits': course.credits
                    }
                )
                modules.append(module)
        
        self.stdout.write(f"  ✓ Created {len(courses)} courses with multiple instructors and {len(modules)} modules")
        return courses, modules
    
    def create_enrollments(self, students, courses, target_modules=4):
        """Create enrollments - each student gets exactly 4 modules"""
        enrollment_count = 0
        for student in students:
            # Randomly select 4 courses (modules)
            enrolled_courses = random.sample(courses, min(target_modules, len(courses)))
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
        self.stdout.write(f"  ✓ Created {enrollment_count} enrollments for {len(students)} students (each student has {target_modules} modules)")
    
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
        """Create exactly target_weeks weeks for each course (module)"""
        all_weeks = []
        
        topics = [
            "Introduction to the Course",
            "Core Concepts and Fundamentals",
            "Advanced Topics and Techniques",
            "Practical Applications and Case Studies",
            "Review and Assessment Methods",
            "Project Work and Implementation",
            "Industry Best Practices",
            "Hands-on Laboratory Session",
            "Group Discussions and Collaboration",
            "Guest Lecture Series",
            "Revision and Practice Session",
            "Mid-term Review and Feedback",
            "Final Project Preparation",
            "Course Summary and Future Directions"
        ]
        
        if not courses:
            self.stdout.write("  ⚠️ No courses available to create weeks")
            return all_weeks
        
        for course in courses:
            self.stdout.write(f"  → Creating {target_weeks} weeks for {course.code}")
            
            for week_num in range(1, target_weeks + 1):
                topic_index = (week_num - 1) % len(topics)
                week, created = Week.objects.get_or_create(
                    course=course,
                    order=week_num,
                    defaults={
                        'topic': topics[topic_index],
                        'description': f"Week {week_num}: {topics[topic_index]} - Detailed exploration of {topics[topic_index].lower()} with practical examples and exercises"
                    }
                )
                if created:
                    all_weeks.append(week)
                    self.stdout.write(f"    ✓ Created week {week_num}: {week.topic}")
                    self.create_week_content(week)
        
        self.stdout.write(f"  ✓ Created total {len(all_weeks)} weeks (14 weeks per course)")
        return all_weeks
    
    def create_week_content(self, week):
        """Create videos, PDFs, and links for a week"""
        # Create 2-3 videos
        video_titles = [
            "Lecture Video",
            "Tutorial Session",
            "Lab Demonstration",
            "Concept Explanation",
            "Case Study"
        ]
        
        for i in range(random.randint(2, 3)):
            video_title = f"{random.choice(video_titles)} - {week.topic}"
            try:
                Video.objects.create(
                    week=week,
                    title=video_title,
                    description=f"This video covers {week.topic}. Watch and take notes for better understanding.",
                    file=f"videos/{week.course.code}_week{week.order}_video{i+1}.mp4"
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create video: {e}")
        
        # Create 2-3 PDFs
        pdf_titles = [
            "Lecture Notes",
            "Reading Material",
            "Slides",
            "Reference Document",
            "Practice Problems"
        ]
        
        for i in range(random.randint(2, 3)):
            pdf_title = f"{random.choice(pdf_titles)} - {week.topic}"
            try:
                Pdf.objects.create(
                    week=week,
                    title=pdf_title,
                    description=f"Download this PDF for {week.topic} materials and references.",
                    file=f"pdfs/{week.course.code}_week{week.order}_doc{i+1}.pdf"
                )
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create PDF: {e}")
        
        # Create 2-3 links
        link_titles = [
            "Documentation",
            "External Resource",
            "Reference Website",
            "Video Tutorial",
            "Practice Site"
        ]
        
        for i in range(random.randint(2, 3)):
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
    
    def create_quizzes(self, weeks, courses, instructors, departments, default_programs):
        """Create 5 draft quizzes per instructor (all without weeks)"""
        quiz_count = 0
        
        quiz_titles = [
            "Knowledge Check",
            "Weekly Assessment",
            "Practice Quiz",
            "Concept Review",
            "Self-Assessment",
            "Module Quiz",
            "Quick Test",
            "Comprehensive Review",
            "Fundamentals Quiz",
            "Advanced Concepts Quiz"
        ]
        
        # For each instructor, create 5 draft quizzes
        for instructor in instructors:
            # Get courses taught by this instructor (from the many-to-many relationship)
            instructor_courses = Course.objects.filter(instructors=instructor)
            if not instructor_courses:
                self.stdout.write(f"  ⚠️ Instructor {instructor.username} has no courses assigned")
                # Create a course for this instructor if none exists
                if departments:
                    dept = random.choice(departments)
                    course_code = f"{dept.code}INS{instructor.id}"
                    course, created = Course.objects.get_or_create(
                        code=course_code,
                        defaults={
                            'name': f"{instructor.get_full_name()}'s Course",
                            'credits': 3,
                            'department': dept,
                            'semester': 1,
                            'gpa_applicable': True,
                            'offering_type': 'compulsory',
                            'program': default_programs.get(dept.id),
                            'color': '#FF6B6B'
                        }
                    )
                    if created:
                        course.instructors.add(instructor)
                        courses.append(course)
                        instructor_courses = [course]
                        self.stdout.write(f"    ✓ Created course for instructor {instructor.username}: {course.code}")
            
            if instructor_courses:
                quizzes_created = 0
                while quizzes_created < 5:
                    # Randomly select a course
                    course = random.choice(instructor_courses)
                    
                    # Create quiz title
                    quiz_title = f"{random.choice(quiz_titles)}: {course.name} - Draft {quizzes_created + 1}"
                    
                    try:
                        quiz = Quiz.objects.create(
                            courseCode=course,
                            week=None,  # No week assigned - these are standalone drafts
                            title=quiz_title,
                            timeLimitMinutes=random.choice([10, 15, 20, 30, 45, 60]),
                            description=f"Comprehensive quiz for {course.name}. Created by {instructor.get_full_name()}. This is a draft quiz that can be added to any week.",
                            order=1,  # Default order since no week
                            status='draft',  # All quizzes are drafts
                            start_time=timezone.now() + timedelta(days=random.randint(1, 30))  # Future start time
                        )
                        quiz_count += 1
                        quizzes_created += 1
                        
                        # Create questions and options for this quiz
                        self.create_quiz_questions(quiz)
                        
                        self.stdout.write(f"    ✓ Created draft quiz {quizzes_created}/5 for {instructor.username}: {quiz.title} (Course: {course.code})")
                        
                    except Exception as e:
                        self.stdout.write(f"  ⚠️ Could not create quiz for {instructor.username}: {e}")
            else:
                self.stdout.write(f"  ⚠️ No courses available for instructor {instructor.username}, skipping quiz creation")
            
            # Verify quizzes for this instructor
            instructor_quizzes = Quiz.objects.filter(
                courseCode__instructors=instructor,
                status='draft',
                week__isnull=True  # Only count standalone drafts
            )
            self.stdout.write(f"  📊 Instructor {instructor.username}: {instructor_quizzes.count()} standalone draft quizzes")
        
        self.stdout.write(f"  ✓ Created total {quiz_count} draft quizzes (5 per instructor, all without weeks)")
        self.stdout.write(f"  💡 Instructors can now add these quizzes to weeks using the add_to_week endpoint")
    
    def create_quiz_questions(self, quiz):
        """Create questions and options for a quiz"""
        question_count = random.randint(5, 10)
        question_texts = [
            "What is the main concept discussed in this week?",
            "Which of the following is correct about this topic?",
            "How would you apply this concept in real-world scenarios?",
            "What is the key takeaway from this module?",
            "Which statement best describes this concept?",
            "What is the primary purpose of this technique?",
            "Which of the following is an example of this principle?",
            "What should you consider when implementing this solution?",
            "Describe the main advantages of this approach.",
            "What are the limitations of this method?"
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
    
    def create_announcements(self, instructors, admins, batches, faculties, courses):
        """Create announcements for batch, faculty, and course levels"""
        announcement_count = 0
        
        # Batch announcements
        for batch in batches[:5]:
            try:
                Announcement.objects.create(
                    batch=batch,
                    title=f"Important Update for {batch.name}",
                    content=f"This announcement is for all students in {batch.name}. Please check the new policies and upcoming deadlines for this semester.",
                    created_by=random.choice(instructors + admins),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                announcement_count += 1
                self.stdout.write(f"  ✓ Created batch announcement for {batch.name}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create batch announcement: {e}")
        
        # Faculty announcements
        for faculty in faculties[:3]:
            try:
                Announcement.objects.create(
                    faculty=faculty,
                    title=f"Faculty of {faculty.name} Update",
                    content=f"Important information for all students and staff in {faculty.name}. Please review the latest academic calendar and examination schedules.",
                    created_by=random.choice(instructors + admins),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                announcement_count += 1
                self.stdout.write(f"  ✓ Created faculty announcement for {faculty.name}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create faculty announcement: {e}")
        
        # Course announcements
        for course in courses[:8]:
            try:
                Announcement.objects.create(
                    course=course,
                    title=f"Course Update: {course.name}",
                    content=f"Important information about {course.name}. Please review the syllabus, complete assignments on time, and prepare for upcoming assessments.",
                    created_by=random.choice(instructors + admins),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                announcement_count += 1
                self.stdout.write(f"  ✓ Created course announcement for {course.name}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create course announcement: {e}")
        
        self.stdout.write(f"  ✓ Created {announcement_count} announcements (batch, faculty, and course)")
    
    def create_academic_calendars(self, faculties, admins):
        """Create academic calendars for each faculty"""
        calendar_count = 0
        current_year = date.today().year
        
        for faculty in faculties:
            for semester in range(1, 3):  # Create for 2 semesters per year
                try:
                    calendar, created = AcademicCalendar.objects.get_or_create(
                        year=current_year,
                        semester=semester,
                        faculty=faculty.name,
                        defaults={
                            'pdf': f"academic_calendars/{faculty.code}_sem{semester}_{current_year}.pdf",
                            'uploaded_by': random.choice(admins) if admins else None
                        }
                    )
                    if created:
                        calendar_count += 1
                        self.stdout.write(f"  ✓ Created academic calendar: {current_year} Semester {semester} - {faculty.name}")
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create academic calendar: {e}")
        
        self.stdout.write(f"  ✓ Created {calendar_count} academic calendars")
    
    def create_practical_timetables(self, faculties, admins):
        """Create practical timetables for each faculty"""
        timetable_count = 0
        current_year = date.today().year
        
        timetable_titles = [
            "Lab Schedule",
            "Practical Sessions",
            "Workshop Timetable",
            "Hands-on Training Schedule"
        ]
        
        for faculty in faculties:
            for semester in range(1, 3):
                try:
                    timetable, created = PracticalTimetable.objects.get_or_create(
                        year=current_year,
                        semester=semester,
                        faculty=faculty.name,
                        title=f"{random.choice(timetable_titles)} - {faculty.code}",
                        defaults={
                            'pdf': f"practical_timetables/{faculty.code}_sem{semester}_practical_{current_year}.pdf",
                            'uploaded_by': random.choice(admins) if admins else None
                        }
                    )
                    if created:
                        timetable_count += 1
                        self.stdout.write(f"  ✓ Created practical timetable: {current_year} Semester {semester} - {faculty.name}")
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Could not create practical timetable: {e}")
        
        self.stdout.write(f"  ✓ Created {timetable_count} practical timetables")
    
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
                    department = random.choice(departments)
                    BursaryAppeal.objects.create(
                        student=student,
                        appeal_type='BURSARY',
                        academic_year='2024-2025',
                        department=department,
                        faculty=department.faculty,
                        batch=random.choice([b for b in batches if b.department == department]) if batches else None,
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
                    department = random.choice(departments)
                    HostelAppeal.objects.create(
                        student=student,
                        appeal_type='HOSTEL',
                        academic_year='2024-2025',
                        department=department,
                        faculty=department.faculty,
                        batch=random.choice([b for b in batches if b.department == department]) if batches else None,
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
                    department = random.choice(departments)
                    ExamRewriteAppeal.objects.create(
                        student=student,
                        appeal_type='EXAM_REWRITE',
                        academic_year='2024-2025',
                        department=department,
                        faculty=department.faculty,
                        batch=random.choice([b for b in batches if b.department == department]) if batches else None,
                        title="Exam Rewrite Request",
                        description="Request to rewrite the exam due to medical reasons",
                        course=random.choice(courses),
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
                    department = random.choice(departments)
                    MedicalLeaveAppeal.objects.create(
                        student=student,
                        appeal_type='MEDICAL_LEAVE',
                        academic_year='2024-2025',
                        department=department,
                        faculty=department.faculty,
                        batch=random.choice([b for b in batches if b.department == department]) if batches else None,
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
                        appeal_type='RESULT_RE_EVALUATION',
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

    def create_global_announcements(self, instructors, admins, faculties, departments, batches, programs):
        """Create global announcements with different targeting types"""
        announcement_count = 0
        
        # 1. Announcement for ALL students
        try:
            GlobalAnnouncement.objects.create(
                title="Welcome to the New Academic Year",
                content="Welcome back to all students! The new academic year has begun. Please check your course schedules and prepare for the upcoming semester.",
                pdf_file="announcements/pdfs/welcome_2024.pdf",
                target_type='all',
                created_by=random.choice(admins) if admins else None,
                is_active=True,
                publish_from=timezone.now() - timedelta(days=5),
                publish_until=timezone.now() + timedelta(days=60)
            )
            announcement_count += 1
            self.stdout.write("  ✓ Created global announcement for ALL students")
        except Exception as e:
            self.stdout.write(f"  ⚠️ Could not create ALL announcement: {e}")
        
        # 2. Faculty-level announcements
        faculty_announcements = [
            {
                'title': 'Engineering Faculty Research Symposium',
                'content': 'The Faculty of Engineering is hosting its annual research symposium on May 15th. All engineering students are encouraged to participate.',
                'faculties': [f for f in faculties if f.code == 'ENG']
            },
            {
                'title': 'Science Faculty Laboratory Safety Guidelines',
                'content': 'Updated laboratory safety protocols for Science faculty students. Please review the attached guidelines before entering any lab.',
                'faculties': [f for f in faculties if f.code == 'SCI']
            },
            {
                'title': 'Business Faculty Industry Connect Program',
                'content': 'Business faculty students: Registration for the Industry Connect Program is now open. Gain valuable industry experience this semester.',
                'faculties': [f for f in faculties if f.code == 'BUS']
            }
        ]
        
        for announcement_data in faculty_announcements:
            try:
                announcement = GlobalAnnouncement.objects.create(
                    title=announcement_data['title'],
                    content=announcement_data['content'],
                    target_type='faculty',
                    created_by=random.choice(instructors + admins),
                    is_active=True,
                    publish_from=timezone.now() - timedelta(days=random.randint(1, 10)),
                    publish_until=timezone.now() + timedelta(days=random.randint(30, 90))
                )
                if announcement_data['faculties']:
                    announcement.faculties.set(announcement_data['faculties'])
                announcement_count += 1
                self.stdout.write(f"  ✓ Created faculty announcement: {announcement_data['title']}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create faculty announcement: {e}")
        
        # 3. Department-level announcements
        department_announcements = []
        for dept in departments[:6]:  # Take first 6 departments
            department_announcements.append({
                'title': f'{dept.name} Department - Guest Lecture Series',
                'content': f'Join us for a special guest lecture series organized by the {dept.name} Department. Industry experts will share insights on current trends.',
                'departments': [dept]
            })
            department_announcements.append({
                'title': f'{dept.name} - Internship Opportunities',
                'content': f'New internship opportunities available for {dept.name} students. Apply before the deadline.',
                'departments': [dept]
            })
        
        for announcement_data in department_announcements[:10]:  # Limit to 10 announcements
            try:
                announcement = GlobalAnnouncement.objects.create(
                    title=announcement_data['title'],
                    content=announcement_data['content'],
                    target_type='department',
                    created_by=random.choice(instructors + admins),
                    is_active=True,
                    publish_from=timezone.now() - timedelta(days=random.randint(0, 5)),
                    publish_until=timezone.now() + timedelta(days=random.randint(45, 120))
                )
                if announcement_data['departments']:
                    announcement.departments.set(announcement_data['departments'])
                announcement_count += 1
                self.stdout.write(f"  ✓ Created department announcement: {announcement_data['title']}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create department announcement: {e}")
        
        # 4. Batch-level announcements
        batch_announcements = []
        for batch in batches[:8]:  # Take first 8 batches
            batch_announcements.append({
                'title': f'Important: {batch.name} - Exam Schedule Released',
                'content': f'The exam schedule for {batch.name} has been released. Check the timetable and prepare accordingly.',
                'batches': [batch]
            })
            batch_announcements.append({
                'title': f'{batch.name} - Project Submission Deadline',
                'content': f'Final project submissions for {batch.name} are due on March 30th. Late submissions will incur penalties.',
                'batches': [batch]
            })
        
        for announcement_data in batch_announcements[:12]:  # Limit to 12 announcements
            try:
                announcement = GlobalAnnouncement.objects.create(
                    title=announcement_data['title'],
                    content=announcement_data['content'],
                    target_type='batch',
                    created_by=random.choice(instructors + admins),
                    is_active=True,
                    publish_from=timezone.now() - timedelta(days=random.randint(0, 7)),
                    publish_until=timezone.now() + timedelta(days=random.randint(30, 60))
                )
                if announcement_data['batches']:
                    announcement.batches.set(announcement_data['batches'])
                announcement_count += 1
                self.stdout.write(f"  ✓ Created batch announcement: {announcement_data['title']}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create batch announcement: {e}")
        
        # 5. Program-level announcements
        program_announcements = []
        for prog in programs[:5]:  # Take first 5 programs
            program_announcements.append({
                'title': f'{prog.name} Program - Curriculum Update',
                'content': f'Important curriculum updates for the {prog.name} program. Please review the changes for the current semester.',
                'programs': [prog]
            })
            program_announcements.append({
                'title': f'{prog.name} - Scholarship Opportunities',
                'content': f'Scholarship opportunities available for {prog.name} students with excellent academic performance.',
                'programs': [prog]
            })
        
        for announcement_data in program_announcements[:8]:  # Limit to 8 announcements
            try:
                announcement = GlobalAnnouncement.objects.create(
                    title=announcement_data['title'],
                    content=announcement_data['content'],
                    target_type='program',
                    created_by=random.choice(instructors + admins),
                    is_active=True,
                    publish_from=timezone.now() - timedelta(days=random.randint(0, 3)),
                    publish_until=timezone.now() + timedelta(days=random.randint(60, 90))
                )
                if announcement_data['programs']:
                    announcement.programs.set(announcement_data['programs'])
                announcement_count += 1
                self.stdout.write(f"  ✓ Created program announcement: {announcement_data['title']}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create program announcement: {e}")
        
        # 6. Create some inactive announcements (expired or draft)
        inactive_announcements = [
            {
                'title': 'Old Announcement - Scholarship Deadline Passed',
                'content': 'This scholarship application deadline has passed. Stay tuned for future opportunities.',
                'target_type': 'all',
                'is_active': False
            },
            {
                'title': 'Expired: Exam Registration',
                'content': 'The exam registration period has ended. This announcement is no longer active.',
                'target_type': 'all',
                'is_active': True,
                'publish_until': timezone.now() - timedelta(days=1)  # Already expired
            }
        ]
        
        for announcement_data in inactive_announcements:
            try:
                GlobalAnnouncement.objects.create(
                    title=announcement_data['title'],
                    content=announcement_data['content'],
                    target_type=announcement_data['target_type'],
                    created_by=random.choice(admins) if admins else None,
                    is_active=announcement_data.get('is_active', False),
                    publish_from=announcement_data.get('publish_from', timezone.now() - timedelta(days=30)),
                    publish_until=announcement_data.get('publish_until', timezone.now() - timedelta(days=1))
                )
                announcement_count += 1
                self.stdout.write(f"  ✓ Created inactive announcement: {announcement_data['title']}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create inactive announcement: {e}")
        
        # 7. Create announcements with PDF attachments (mock)
        pdf_announcements = [
            {
                'title': 'Academic Calendar 2024-2025',
                'content': 'The official academic calendar for the 2024-2025 academic year is now available. Please download and review important dates.',
                'pdf_file': 'announcements/pdfs/academic_calendar_2024_25.pdf',
                'target_type': 'all'
            },
            {
                'title': 'Exam Guidelines and Regulations',
                'content': 'Important exam guidelines and regulations for all students. Please read carefully before your exams.',
                'pdf_file': 'announcements/pdfs/exam_guidelines_2024.pdf',
                'target_type': 'all'
            }
        ]
        
        for announcement_data in pdf_announcements:
            try:
                GlobalAnnouncement.objects.create(
                    title=announcement_data['title'],
                    content=announcement_data['content'],
                    pdf_file=announcement_data['pdf_file'],
                    target_type=announcement_data['target_type'],
                    created_by=random.choice(admins) if admins else None,
                    is_active=True,
                    publish_from=timezone.now() - timedelta(days=2),
                    publish_until=timezone.now() + timedelta(days=180)
                )
                announcement_count += 1
                self.stdout.write(f"  ✓ Created PDF announcement: {announcement_data['title']}")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Could not create PDF announcement: {e}")
        
        self.stdout.write(f"  ✓ Created total {announcement_count} global announcements")
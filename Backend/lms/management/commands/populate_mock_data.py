import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from lms.models import *
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
            
            # 3. Create batches
            self.stdout.write('\n📅 Creating batches...')
            batches = self.create_batches(departments)
            
            # 4. Create users (students, instructors, admins)
            self.stdout.write('\n👥 Creating users...')
            users = self.create_users(departments, batches)
            
            # 5. Create courses and modules
            self.stdout.write('\n📖 Creating courses and modules...')
            courses, modules = self.create_courses_modules(departments, batches, users['instructors'])
            
            # 6. Create enrollments
            self.stdout.write('\n📝 Creating enrollments...')
            self.create_enrollments(users['students'], courses)
            
            # 8. Create appeals
            self.stdout.write('\n✉️ Creating appeals...')
            self.create_appeals(users['students'], departments, faculties, batches, courses, modules)
            
            # 9. Create review queue
            self.stdout.write('\n🗂️ Creating review queue...')
            self.create_review_queue(users['admins'])
            
            self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
            self.stdout.write(self.style.SUCCESS('✅ Mock data population completed successfully!'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error: {str(e)}'))
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
    
    def create_batches(self, departments):
        current_year = date.today().year
        batches = []
        
        # Create batches for ALL departments, not just first 5
        for department in departments:  # Remove [:5] to include ALL departments
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
    
    def create_users(self, departments, batches):
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
            InstructorProfile.objects.get_or_create(
                user=user,
                defaults={
                    'instructor_id': f"INS{user.id:06d}",
                    'department': departments[i % len(departments)],
                }
            )
            users['instructors'].append(user)
            self.stdout.write(f"  ✓ Created instructor: {user.username}")
        
        # Create students
        student_first_names = ['John', 'Jane', 'Mike', 'Sarah', 'Tom', 'Emma', 'Alex', 'Olivia', 'William', 'Sophia']
        student_last_names = ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Lee', 'Kim', 'Chen', 'Patel']
        
        for i in range(20):  # Create 20 students for testing
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
            
            # Create student profile
            department = random.choice(departments)
            batch = random.choice([b for b in batches if b.department == department])
            
            StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'student_id': f"STU{user.id:06d}",
                    'department': department,
                    'batch': batch,
                    'current_semester': random.randint(1, 8),
                    'cgpa': round(random.uniform(2.0, 4.0), 2),
                    'completed_credits': random.randint(30, 120)
                }
            )
            users['students'].append(user)
            
            if i < 10:  # Print first 10 only
                self.stdout.write(f"  ✓ Created student: {user.username}")
        
        self.stdout.write(f"  ✓ Created total {len(users['students'])} students")
        return users
    
    def create_courses_modules(self, departments, batches, instructors):
        courses = []
        modules = []
        
        course_templates = [
            {'code': '101', 'name': 'Programming Fundamentals', 'credits': 3, 'semester': 1},
            {'code': '201', 'name': 'Data Structures', 'credits': 3, 'semester': 2},
            {'code': '301', 'name': 'Database Systems', 'credits': 3, 'semester': 3},
            {'code': '401', 'name': 'Software Engineering', 'credits': 4, 'semester': 4},
        ]
        
        for department in departments[:3]:  # Limit to first 3 departments
            for template in course_templates[:2]:  # 2 courses per department
                course_code = f"{department.code}{template['code']}"
                course, created = Course.objects.get_or_create(
                    code=course_code,
                    defaults={
                        'name': template['name'],
                        'credits': template['credits'],
                        'department': department,
                        'semester': template['semester'],
                        'batch': random.choice([b for b in batches if b.department == department]) if batches else None,
                        'instructor': random.choice(instructors) if instructors else None
                    }
                )
                courses.append(course)
                if created:
                    self.stdout.write(f"  ✓ Created course: {course.code}")
                
                # Create modules for each course
                for j in range(1, 3):  # 2 modules per course
                    module, created = Module.objects.get_or_create(
                        code=f"{course.code}_M{j}",
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
            # Enroll in 2-4 random courses
            enrolled_courses = random.sample(courses, min(random.randint(2, 4), len(courses)))
            for course in enrolled_courses:
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={'status': 'enrolled'}
                )
                if created:
                    enrollment_count += 1
        self.stdout.write(f"  ✓ Created {enrollment_count} enrollments for {len(students)} students")
    
    def create_appeals(self, students, departments, faculties, batches, courses, modules):
        appeal_statuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
        appeal_count = 0
        
        # Create bursary appeals
        for student in random.sample(students, min(5, len(students))):
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
            appeal_count += 1
        self.stdout.write(f"  ✓ Created {appeal_count} bursary appeals")
        
        # Create hostel appeals
        hostel_count = 0
        for student in random.sample(students, min(5, len(students))):
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
        self.stdout.write(f"  ✓ Created {hostel_count} hostel appeals")
        
        # Create exam rewrite appeals
        exam_count = 0
        for student in random.sample(students, min(5, len(students))):
            if courses:
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
        self.stdout.write(f"  ✓ Created {exam_count} exam rewrite appeals")
        
        # Create medical leave appeals
        medical_count = 0
        for student in random.sample(students, min(5, len(students))):
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
        self.stdout.write(f"  ✓ Created {medical_count} medical leave appeals")
        
        # Create result re-evaluation appeals
        reeval_count = 0
        exam_results = ExamResult.objects.all()
        for exam in random.sample(list(exam_results), min(3, len(exam_results))):
            ResultReEvaluationAppeal.objects.create(
                student=exam.student,
                academic_year='2024-2025',
                department=exam.course.department,
                faculty=exam.course.department.faculty,
                title="Result Re-evaluation Request",
                description="Request to re-evaluate the exam paper",
                exam_result=exam,
                reason_type=random.choice(['CALCULATION', 'PAPER_REVIEW', 'GRADE_BOUNDARY']),
                specific_concerns="Marks seem lower than expected",
                status=random.choice(appeal_statuses)
            )
            reeval_count += 1
        self.stdout.write(f"  ✓ Created {reeval_count} result re-evaluation appeals")
    
    def create_review_queue(self, admins):
        # Get all appeals
        all_appeals = []
        for model in [BursaryAppeal, HostelAppeal, ExamRewriteAppeal, MedicalLeaveAppeal, ResultReEvaluationAppeal]:
            all_appeals.extend(model.objects.all())
        
        queue_count = 0
        category_map = {
            'BursaryAppeal': 'financial',
            'HostelAppeal': 'welfare',
            'ExamRewriteAppeal': 'academic',
            'MedicalLeaveAppeal': 'medical',
            'ResultReEvaluationAppeal': 'academic'
        }
        
        for appeal in all_appeals[:20]:  # Limit to first 20
            if appeal.status in ['PENDING', 'UNDER_REVIEW']:
                category = category_map.get(appeal.__class__.__name__, 'other')
                
                queue_item, created = AppealReviewQueue.objects.get_or_create(
                    content_type=ContentType.objects.get_for_model(appeal),
                    object_id=appeal.id,
                    defaults={
                        'category': category,
                        'priority': random.choice(['HIGH', 'MEDIUM', 'LOW']),
                        'assigned_to': random.choice(admins) if admins else None,
                        'department': appeal.department,
                        'faculty': appeal.faculty,
                        'batch': appeal.batch,
                        'academic_year': appeal.academic_year,
                        'is_processed': False
                    }
                )
                if created:
                    queue_count += 1
        self.stdout.write(f"  ✓ Created {queue_count} review queue entries")
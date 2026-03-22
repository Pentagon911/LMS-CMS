import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from users.models import User
from users.profiles import StudentProfile, AdminProfile, InstructorProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with mock user data (students, instructors, admins)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--students',
            type=int,
            default=50,
            help='Number of students to create (default: 50)'
        )
        parser.add_argument(
            '--instructors',
            type=int,
            default=10,
            help='Number of instructors to create (default: 10)'
        )
        parser.add_argument(
            '--admins',
            type=int,
            default=3,
            help='Number of admins to create (default: 3)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing users before creating new ones'
        )

    def handle(self, *args, **options):
        student_count = options['students']
        instructor_count = options['instructors']
        admin_count = options['admins']
        clear_existing = options['clear']
        
        if clear_existing:
            self.stdout.write(self.style.WARNING('Clearing existing non-superuser users...'))
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Existing users cleared.'))
        
        self.stdout.write(self.style.SUCCESS('Starting to populate mock users...'))
        
        # 1. Create admin users
        self.stdout.write('\nCreating admin users...')
        admins = self.create_admins(admin_count)
        
        # 2. Create instructor users
        self.stdout.write('\nCreating instructor users...')
        instructors = self.create_instructors(instructor_count)
        
        # 3. Create student users
        self.stdout.write('\nCreating student users...')
        students = self.create_students(student_count)
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('POPULATION SUMMARY'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(self.style.SUCCESS(f'Admins created: {len(admins)}'))
        self.stdout.write(self.style.SUCCESS(f'Instructors created: {len(instructors)}'))
        self.stdout.write(self.style.SUCCESS(f'Students created: {len(students)}'))
        self.stdout.write(self.style.SUCCESS(f'Total users: {len(admins) + len(instructors) + len(students)}'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(self.style.SUCCESS('\nMock user data population completed!'))

    def create_admins(self, count):
        """Create admin users"""
        admins = []
        
        # Base admin data
        admin_names = [
            ('Super', 'Admin', True),
            ('John', 'Doe', False),
            ('Sarah', 'Johnson', False),
            ('Michael', 'Brown', False),
            ('Emily', 'Davis', False),
            ('David', 'Wilson', False),
            ('Lisa', 'Anderson', False),
        ]
        
        for i in range(min(count, len(admin_names))):
            first, last, is_super = admin_names[i]
            username = f"admin_{first.lower()}_{last.lower()}"
            email = f"{first.lower()}.{last.lower()}@admin.lms.com"
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last,
                    'role': 'admin',
                    'phone_number': f"+1{random.randint(200, 999)}{random.randint(1000000, 9999999)}",
                    'address': f"{random.randint(100, 999)} Admin Street, Management City",
                    'date_of_birth': date(random.randint(1970, 1985), random.randint(1, 12), random.randint(1, 28)),
                    'is_active': True,
                    'is_staff': True,
                    'is_superuser': is_super,
                }
            )
            
            if created:
                user.set_password('admin123')
                user.save()
                
                AdminProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'admin_id': f"ADMIN{user.id:06d}",
                        'joined_date': timezone.now() - timedelta(days=random.randint(30, 730))
                    }
                )
                self.stdout.write(f"  ✓ Created admin: {user.username}")
            else:
                self.stdout.write(f"  ○ Admin already exists: {user.username}")
            
            admins.append(user)
        
        return admins

    def create_instructors(self, count):
        """Create instructor users"""
        departments = [
            'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
            'Civil Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
            'Business Management', 'Finance', 'Marketing', 'Psychology',
            'Economics', 'English Literature', 'History'
        ]
        
        contract_types = ['FULL', 'PART', 'TA']
        
        first_names = [
            'Dr. Robert', 'Prof. Sarah', 'Dr. James', 'Prof. Emily', 'Dr. Michael',
            'Prof. Lisa', 'Dr. David', 'Prof. Maria', 'Dr. William', 'Prof. Jennifer',
            'Dr. Thomas', 'Prof. Patricia', 'Dr. Charles', 'Prof. Barbara', 'Dr. Richard'
        ]
        
        last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
        ]
        
        instructors = []
        
        for i in range(count):
            first = first_names[i % len(first_names)]
            last = last_names[i % len(last_names)]
            username = f"{first.lower().replace(' ', '_')}_{last.lower()}_{i+1}"
            email = f"{first.lower().replace(' ', '.')}.{last.lower()}@instructor.lms.com"
            
            dept = departments[i % len(departments)]
            contract = random.choice(contract_types)
            expertise = [dept, 'Teaching', 'Research']
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last,
                    'role': 'instructor',
                    'phone_number': f"+1{random.randint(200, 999)}{random.randint(1000000, 9999999)}",
                    'address': f"{random.randint(100, 999)} Faculty Lane, University City",
                    'date_of_birth': date(random.randint(1970, 1990), random.randint(1, 12), random.randint(1, 28)),
                    'is_active': True,
                    'is_staff': True,
                }
            )
            
            if created:
                user.set_password('instructor123')
                user.save()
                
                InstructorProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'instructor_id': f"INS{user.id:06d}",
                        'department': dept,
                        'expertise': expertise,
                        'contract_type': contract,
                        'joined_date': timezone.now() - timedelta(days=random.randint(30, 1825))
                    }
                )
                self.stdout.write(f"  ✓ Created instructor: {user.username} ({dept})")
            else:
                self.stdout.write(f"  ○ Instructor already exists: {user.username}")
            
            instructors.append(user)
        
        return instructors

    def create_students(self, count):
        """Create student users"""
        first_names = [
            'John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Emma',
            'Robert', 'Olivia', 'William', 'Sophia', 'Daniel', 'Isabella', 'Matthew',
            'Mia', 'Alexander', 'Charlotte', 'Benjamin', 'Amelia', 'Ethan', 'Harper',
            'Jacob', 'Evelyn', 'Michael', 'Abigail', 'Elijah', 'Emily', 'Lucas', 'Elizabeth'
        ]
        
        last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
            'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
        ]
        
        departments = [
            'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
            'Civil Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
            'Business Management', 'Finance', 'Marketing', 'Psychology', 'Economics'
        ]
        
        students = []
        
        for i in range(count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            username = f"{first_name.lower()}_{last_name.lower()}_{i+1}"
            email = f"{first_name.lower()}.{last_name.lower()}{i+1}@student.lms.com"
            
            dept = random.choice(departments)
            program = f"BSc in {dept}"
            current_semester = random.randint(1, 8)
            cgpa = round(random.uniform(2.0, 4.0), 2)
            completed_credits = current_semester * random.randint(12, 18)
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': 'student',
                    'phone_number': f"+1{random.randint(200, 999)}{random.randint(1000000, 9999999)}",
                    'address': f"{random.randint(100, 999)} Student Dorm, University City",
                    'date_of_birth': date(random.randint(1995, 2005), random.randint(1, 12), random.randint(1, 28)),
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password('student123')
                user.save()
                
                StudentProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'student_id': f"STU{user.id:06d}",
                        'current_semester': current_semester,
                        'department': dept,
                        'program': program,
                        'cgpa': cgpa,
                        'completed_credits': completed_credits,
                        'joined_date': timezone.now() - timedelta(days=random.randint(30, 1095))
                    }
                )
                
                if i < 10:  # Print first 10
                    self.stdout.write(f"  ✓ Created student: {user.username} ({dept}, Sem {current_semester}, CGPA: {cgpa})")
            
            students.append(user)
        
        self.stdout.write(f"  ✓ Created {len(students)} students total")
        return students
# create_test_data.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from lms.models import Course, Enrollment, Faculty, Department, Batch
from CMS.models import Week

User = get_user_model()

print("=" * 50)
print("CREATING TEST DATA")
print("=" * 50)

# ========== CREATE FACULTY ==========
print("\n📚 Creating Faculty...")
faculty, created = Faculty.objects.get_or_create(
    code='ENG',
    defaults={
        'name': 'Faculty of Engineering',
        'description': 'Engineering faculty'
    }
)
print(f"✅ Faculty: {faculty.name}")

# ========== CREATE DEPARTMENT ==========
print("\n📖 Creating Department...")
department, created = Department.objects.get_or_create(
    code='CS',
    defaults={
        'name': 'Computer Science',
        'faculty': faculty,
        'description': 'Computer Science Department'
    }
)
print(f"✅ Department: {department.name}")

# ========== CREATE BATCH ==========
print("\n📅 Creating Batch...")
batch, created = Batch.objects.get_or_create(
    year=2024,
    department=department,
    defaults={
        'name': 'Batch 2024'
    }
)
print(f"✅ Batch: {batch.name}")

# ========== CREATE INSTRUCTORS ==========
print("\n👨‍🏫 Creating instructors...")

instructor1, created = User.objects.get_or_create(
    username='dr_smith',
    defaults={
        'email': 'smith@university.com',
        'first_name': 'John',
        'last_name': 'Smith',
        'role': 'instructor'
    }
)
instructor1.set_password('instructor123')
instructor1.save()
print(f"✅ {instructor1.username} (Dr. John Smith)")

instructor2, created = User.objects.get_or_create(
    username='prof_johnson',
    defaults={
        'email': 'johnson@university.com',
        'first_name': 'Jane',
        'last_name': 'Johnson',
        'role': 'instructor'
    }
)
instructor2.set_password('instructor123')
instructor2.save()
print(f"✅ {instructor2.username} (Prof. Jane Johnson)")

# ========== CREATE STUDENTS ==========
print("\n🎓 Creating students...")

students = [
    ('john_doe', 'John', 'Doe', 'john@student.com'),
    ('jane_smith', 'Jane', 'Smith', 'jane@student.com'),
    ('bob_wilson', 'Bob', 'Wilson', 'bob@student.com'),
]

for username, first, last, email in students:
    student, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'first_name': first,
            'last_name': last,
            'role': 'student'
        }
    )
    student.set_password('student123')
    student.save()
    print(f"✅ {student.username} ({first} {last})")

# ========== CREATE COURSES ==========
print("\n📖 Creating courses...")

course1, created = Course.objects.get_or_create(
    code='CS101',
    defaults={
        'name': 'Data Structures',
        'description': 'Learn arrays, linked lists, stacks, queues, trees, and graphs',
        'credits': 3,
        'instructor': instructor1,
        'department': department,
        'semester': 1,
        'batch': batch,
        'color': '#4CAF50'
    }
)
print(f"✅ {course1.code}: {course1.name}")

course2, created = Course.objects.get_or_create(
    code='CS201',
    defaults={
        'name': 'Algorithms',
        'description': 'Learn sorting, searching, dynamic programming, graph algorithms',
        'credits': 3,
        'instructor': instructor2,
        'department': department,
        'semester': 2,
        'batch': batch,
        'color': '#2196F3'
    }
)
print(f"✅ {course2.code}: {course2.name}")

course3, created = Course.objects.get_or_create(
    code='CS101P',
    defaults={
        'name': 'Python Programming',
        'description': 'Learn Python fundamentals: variables, loops, functions, OOP',
        'credits': 3,
        'instructor': instructor1,
        'department': department,
        'semester': 1,
        'batch': batch,
        'color': '#FF9800'
    }
)
print(f"✅ {course3.code}: {course3.name}")

# ========== ENROLL STUDENTS ==========
print("\n📝 Enrolling students...")

# John Doe enrolls in CS101 and CS101P
Enrollment.objects.get_or_create(student=User.objects.get(username='john_doe'), course=course1, defaults={'status': 'enrolled'})
Enrollment.objects.get_or_create(student=User.objects.get(username='john_doe'), course=course3, defaults={'status': 'enrolled'})
print(f"✅ john_doe enrolled in {course1.code}, {course3.code}")

# Jane Smith enrolls in all courses
Enrollment.objects.get_or_create(student=User.objects.get(username='jane_smith'), course=course1, defaults={'status': 'enrolled'})
Enrollment.objects.get_or_create(student=User.objects.get(username='jane_smith'), course=course2, defaults={'status': 'enrolled'})
Enrollment.objects.get_or_create(student=User.objects.get(username='jane_smith'), course=course3, defaults={'status': 'enrolled'})
print(f"✅ jane_smith enrolled in {course1.code}, {course2.code}, {course3.code}")

# Bob Wilson enrolls in CS201 only
Enrollment.objects.get_or_create(student=User.objects.get(username='bob_wilson'), course=course2, defaults={'status': 'enrolled'})
print(f"✅ bob_wilson enrolled in {course2.code}")

# ========== CREATE WEEKS ==========
print("\n📅 Creating weeks...")

# Weeks for CS101 (Data Structures)
for week_num in range(1, 5):
    Week.objects.get_or_create(
        course=course1,
        order=week_num,
        defaults={
            'topic': f'Week {week_num}: {"Introduction" if week_num == 1 else "Arrays" if week_num == 2 else "Linked Lists" if week_num == 3 else "Stacks & Queues"}',
            'description': f'Week {week_num} content for Data Structures'
        }
    )
print(f"✅ Created 4 weeks for {course1.code}")

# Weeks for CS201 (Algorithms)
for week_num in range(1, 4):
    Week.objects.get_or_create(
        course=course2,
        order=week_num,
        defaults={
            'topic': f'Week {week_num}: {"Introduction to Algorithms" if week_num == 1 else "Sorting" if week_num == 2 else "Searching"}',
            'description': f'Week {week_num} content for Algorithms'
        }
    )
print(f"✅ Created 3 weeks for {course2.code}")

# Weeks for CS101P (Python Programming)
for week_num in range(1, 4):
    Week.objects.get_or_create(
        course=course3,
        order=week_num,
        defaults={
            'topic': f'Week {week_num}: {"Python Basics" if week_num == 1 else "Control Flow" if week_num == 2 else "Functions & OOP"}',
            'description': f'Week {week_num} content for Python Programming'
        }
    )
print(f"✅ Created 3 weeks for {course3.code}")

# ========== SUMMARY ==========
print("\n" + "=" * 50)
print("SUMMARY")
print("=" * 50)

print("\n👨‍🏫 INSTRUCTORS:")
print(f"  • dr_smith / instructor123")
print(f"  • prof_johnson / instructor123")

print("\n👩‍🎓 STUDENTS:")
print(f"  • john_doe / student123")
print(f"  • jane_smith / student123")
print(f"  • bob_wilson / student123")

print("\n📚 COURSES:")
print(f"  • CS101: Data Structures (Dr. Smith)")
print(f"  • CS201: Algorithms (Prof. Johnson)")
print(f"  • CS101P: Python Programming (Dr. Smith)")

print("\n📝 ENROLLMENTS:")
print(f"  • john_doe → CS101, CS101P")
print(f"  • jane_smith → CS101, CS201, CS101P")
print(f"  • bob_wilson → CS201")

print("\n✅ All data created successfully!")
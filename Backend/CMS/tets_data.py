# create_test_data.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from lms.models import Course, Enrollment
from CMS.models import Week, Video, Pdf, Link, Quiz, Question, Option

User = get_user_model()

print("=" * 50)
print("CREATING TEST DATA")
print("=" * 50)

# 1. CREATE USERS
print("\n📝 Creating users...")

instructor, _ = User.objects.get_or_create(
    username='instructor',
    defaults={'email': 'instructor@test.com', 'first_name': 'Dr.', 'last_name': 'Smith'}
)
if instructor.password != 'test123':
    instructor.set_password('test123')
    instructor.role = 'instructor'
    instructor.save()
print(f"✅ Instructor: {instructor.username} (password: test123)")

student, _ = User.objects.get_or_create(
    username='student',
    defaults={'email': 'student@test.com', 'first_name': 'John', 'last_name': 'Doe'}
)
if student.password != 'test123':
    student.set_password('test123')
    student.role = 'student'
    student.save()
print(f"✅ Student: {student.username} (password: test123)")

student2, _ = User.objects.get_or_create(
    username='student2',
    defaults={'email': 'student2@test.com', 'first_name': 'Jane', 'last_name': 'Smith'}
)
if student2.password != 'test123':
    student2.set_password('test123')
    student2.role = 'student'
    student2.save()
print(f"✅ Student2: {student2.username} (password: test123)")

# 2. CREATE COURSES
print("\n📚 Creating courses...")

course1, _ = Course.objects.get_or_create(
    code='CS101',
    defaults={
        'name': 'Data Structures',
        'description': 'Learn about arrays, linked lists, stacks, queues, trees, and graphs',
        'credits': 3,
        'instructor': instructor,
        'color': '#4CAF50'
    }
)
print(f"✅ Course: {course1.code} - {course1.name}")

course2, _ = Course.objects.get_or_create(
    code='CS201',
    defaults={
        'name': 'Algorithms',
        'description': 'Learn about sorting, searching, dynamic programming, and graph algorithms',
        'credits': 3,
        'instructor': instructor,
        'color': '#2196F3'
    }
)
print(f"✅ Course: {course2.code} - {course2.name}")

# 3. ENROLL STUDENTS
print("\n📝 Enrolling students...")

Enrollment.objects.get_or_create(student=student, course=course1, defaults={'status': 'enrolled'})
Enrollment.objects.get_or_create(student=student, course=course2, defaults={'status': 'enrolled'})
Enrollment.objects.get_or_create(student=student2, course=course1, defaults={'status': 'enrolled'})
print(f"✅ {student.username} enrolled in {course1.code}, {course2.code}")
print(f"✅ {student2.username} enrolled in {course1.code}")

# 4. CREATE WEEKS
print("\n📅 Creating weeks...")

weeks = []
for i in range(1, 6):
    week, _ = Week.objects.get_or_create(
        course=course1,
        order=i,
        defaults={'topic': f'Week {i}', 'description': f'Content for week {i}'}
    )
    weeks.append(week)
    print(f"✅ Week {i} created")

# 5. CREATE QUIZZES
print("\n📝 Creating quizzes...")

# Quiz for Week 2 (Arrays)
quiz1, _ = Quiz.objects.get_or_create(
    week=weeks[1],
    title='Arrays Quiz',
    defaults={'timeLimitMinutes': 15, 'order': 1}
)
print(f"✅ Quiz: {quiz1.title}")

# Quiz for Week 3 (Linked Lists)
quiz2, _ = Quiz.objects.get_or_create(
    week=weeks[2],
    title='Linked Lists Quiz',
    defaults={'timeLimitMinutes': 20, 'order': 1}
)
print(f"✅ Quiz: {quiz2.title}")

print("\n" + "=" * 50)
print("✅ TEST DATA CREATED!")
print("=" * 50)
print("\n🔑 Login:")
print("  Instructor: instructor / test123")
print("  Student:    student / test123")
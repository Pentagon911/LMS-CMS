# users/profiles.py
from django.db import models
from django.db.models import JSONField
from users.models import User
from django.utils import timezone

class StudentProfile(models.Model):
    """Student-specific information"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='student_profile',
        limit_choices_to={'role':User.Role.STUDENT}
    )
    
    # Academic Information
    student_id = models.CharField(max_length=20, unique=True)
    enrollment_date = models.DateField(auto_now_add=True)
    current_semester = models.IntegerField(default=1)
    
    faculty = models.ForeignKey(
        'lms.Faculty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
    )
    department = models.ForeignKey(
        'lms.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
    )
    batch = models.ForeignKey(
        'lms.Batch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        help_text="Academic batch/year of the student"
    )
    program = models.ForeignKey('lms.Program',on_delete=models.SET_NULL,null=True,blank=True)
    joined_date = models.DateTimeField(default=timezone.now)
    
    cgpa = models.FloatField(null=True, blank=True)
    completed_credits = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'student_profiles'
        indexes = [
            models.Index(fields=['student_id']),
            models.Index(fields=['faculty', 'department', 'batch']),
        ]

    def __str__(self):
        return f"Student: {self.user.get_full_name()} - {self.student_id}"

class AdminProfile(models.Model):
    """Admin-specific information"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='admin_profile',
        limit_choices_to={'role':User.Role.ADMIN}
    )
    
    # Employment Details
    admin_id = models.CharField(max_length=20, unique=True)
    joined_date = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'admin_profiles'
        indexes = [
            models.Index(fields=['admin_id']),
        ]

    def __str__(self):
        return f"Administrator: {self.user.get_full_name()} - {self.admin_id}"

class InstructorProfile(models.Model):
    """Instructor-specific information (can be TAs or part-time instructors)"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='instructor_profile',
        limit_choices_to={'role':User.Role.INSTRUCTOR}
    )
    
    # Instructor Information
    instructor_id = models.CharField(max_length=20, unique=True)
    faculty = models.ForeignKey(
        'lms.Faculty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instructors',
    )
    department = models.ForeignKey(
        'lms.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instructors',
        help_text="Primary department of the instructor"
    )
    expertise = JSONField(
        models.CharField(max_length=100),
        blank=True,
        default=list
    )
    joined_date = models.DateTimeField(default=timezone.now)
    contract_type = models.CharField(
        max_length=20,
        choices=[
            ('FULL', 'Full-time'),
            ('PART', 'Part-time'),
            ('TA', 'Teaching Assistant')
        ],
        default='PART'
    )
    
    class Meta:
        db_table = 'instructor_profiles'
        indexes = [
            models.Index(fields=['instructor_id']),
            models.Index(fields=['faculty', 'department']),
        ]
    
    def __str__(self):
        return f"Instructor: {self.user.get_full_name()} - {self.instructor_id}"
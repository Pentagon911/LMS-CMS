from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from users.models import User
import uuid

# ---------- TIME STAMP ABSTRACT CLASS ----------

class TimeStampedModel(models.Model):
    """Abstract base model with timestamp fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


# ----------ACADEMIC STRUCTURE----------

class Faculty(models.Model):
    """Faculty within the university"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'faculties'
    
    def __str__(self):
        return self.name


class Department(models.Model):
    """Department within a faculty"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'departments'
    
    def __str__(self):
        return f"{self.name} ({self.faculty.code})"


class Batch(models.Model):
    """Academic batch/year"""
    name = models.CharField(max_length=50)  # e.g., "Batch 24"
    year = models.IntegerField()  # e.g., 2024
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='batches')
    
    class Meta:
        db_table = 'batches'
        unique_together = ['year', 'department']
    
    def __str__(self):
        return f"{self.name} - {self.department.name}"


class Course(models.Model):
    """Course"""
    code = models.CharField(max_length=20, unique=True)
    color = models.CharField(max_length=20, null=True, blank=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    credits = models.PositiveSmallIntegerField()
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role': 'instructor'},  # only instructors
        related_name='courses_taught'
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    semester = models.IntegerField()
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='courses', null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'

    def __str__(self):
        return f"{self.code}: {self.name}"


class Module(models.Model):
    """Module within a course"""
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    credits = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'modules'
        unique_together = ['code', 'course']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Enrollment(models.Model):
    STATUS_CHOICES = (
        ('enrolled', 'Enrolled'),
        ('dropped', 'Dropped'),
        ('completed', 'Completed'),
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='enrollments'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrollment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    grade = models.CharField(max_length=2, blank=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} -> {self.course.code}"


# ---------- EXAM RELATED ----------

class ExamTimetable(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    title = models.CharField(max_length=200)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.course.code} - {self.title}"


class ExamResult(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='exam_results'
    )
    exam = models.ForeignKey(ExamTimetable, on_delete=models.CASCADE, related_name='results')
    score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    grade = models.CharField(max_length=2, blank=True)
    is_reevaluated = models.BooleanField(default=False, null=True)
    class Meta:
        unique_together = ('student', 'exam')

    def __str__(self):
        return f"{self.student} - {self.exam} - {self.score}"


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key


# ---------- APPEALS BASE SYSTEM ----------

class AppealStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Review'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    NEEDS_INFO = 'NEEDS_INFO', 'Needs More Information'
    PROCESSED = 'PROCESSED', 'Processed'


class AppealType(models.TextChoices):
    # Bursary/Hostel
    BURSARY = 'BURSARY', 'Bursary Application'
    HOSTEL = 'HOSTEL', 'Hostel Facility'
    
    # Academic
    EXAM_REWRITE = 'EXAM_REWRITE', 'Exam Rewrite'
    MEDICAL_LEAVE = 'MEDICAL_LEAVE', 'Medical Leave'
    RESULT_RE_EVALUATION = 'RESULT_RE_EVALUATION', 'Result Re-evaluation'
    
    # Welfare
    FINANCIAL_AID = 'FINANCIAL_AID', 'Financial Aid'
    SPECIAL_NEEDS = 'SPECIAL_NEEDS', 'Special Needs'


class BaseAppeal(TimeStampedModel):
    """
    Abstract base class for all appeals using OOP inheritance.
    Defines common fields and methods that all appeals share.
    """
    appeal_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    appeal_type = models.CharField(max_length=30, choices=AppealType.choices)
    status = models.CharField(max_length=20, choices=AppealStatus.choices, default=AppealStatus.PENDING)
    
    # Who submitted
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='%(class)s_appeals', 
        limit_choices_to={'role': User.Role.STUDENT}
    )
    
    # Academic context
    academic_year = models.CharField(max_length=20)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True)
    
    # Appeal details
    title = models.CharField(max_length=200)
    description = models.TextField()
    supporting_documents = models.FileField(upload_to='appeals/documents/', null=True, blank=True)
    
    # Review tracking
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='%(class)s_reviewed'
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_appeal_type_display()} - {self.student.username}"
    
    def submit(self):
        """Submit the appeal for review"""
        self.status = AppealStatus.PENDING
        self.save()
    
    def review(self, reviewer, decision, notes=""):
        """Process review of appeal"""
        self.reviewed_by = reviewer
        self.review_notes = notes
        self.reviewed_at = timezone.now()
        
        if decision == 'approve':
            self.status = AppealStatus.APPROVED
            self.on_approval()
        elif decision == 'reject':
            self.status = AppealStatus.REJECTED
            self.on_rejection()
        elif decision == 'needs_info':
            self.status = AppealStatus.NEEDS_INFO
        
        self.save()
    
    def on_approval(self):
        """Hook for additional actions when appeal is approved"""
        pass
    
    def on_rejection(self):
        """Hook for additional actions when appeal is rejected"""
        pass


# ---------- CONCRETE APPEAL CLASSES -----------

class BursaryAppeal(BaseAppeal):
    """Bursary application"""
    FAMILY_INCOME_BRACKETS = [
        ('LOW', 'Below 500,000 LKR'),
        ('MEDIUM', '500,000 - 1,000,000 LKR'),
        ('HIGH', 'Above 1,000,000 LKR')
    ]
    
    family_income_bracket = models.CharField(max_length=10, choices=FAMILY_INCOME_BRACKETS)
    has_scholarship = models.BooleanField(default=False)
    reason_for_aid = models.TextField()
    
    # Financial documents
    income_certificate = models.FileField(upload_to='appeals/bursary/')
    bank_statements = models.FileField(upload_to='appeals/bursary/', null=True, blank=True)
    
    # Admin review fields
    approved_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'bursary_appeals'


class HostelAppeal(BaseAppeal):
    """Hostel facility application"""    
    preferred_check_in = models.DateField()
    duration_months = models.IntegerField()
    special_requirements = models.TextField(blank=True)
    
    # Medical conditions that require hostel (if any)
    has_medical_condition = models.BooleanField(default=False)
    medical_certificate = models.FileField(upload_to='appeals/hostel/', null=True, blank=True)
    
    # Admin allocation
    allocated_room_number = models.CharField(max_length=20, blank=True)
    allocated_hostel = models.CharField(max_length=100, blank=True)
    check_in_date = models.DateField(null=True, blank=True)
    check_out_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'hostel_appeals'


class ExamRewriteAppeal(BaseAppeal):
    """Appeal to rewrite an exam"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    semester = models.IntegerField()
    original_exam_date = models.DateField()
    
    # Reason for rewrite
    REASON_CHOICES = [
        ('MEDICAL', 'Medical Grounds'),
        ('CONFLICT', 'Exam Conflict'),
        ('PERSONAL', 'Personal Circumstances'),
        ('OTHER', 'Other')
    ]
    reason_type = models.CharField(max_length=10, choices=REASON_CHOICES)
    detailed_reason = models.TextField()
    
    # Supporting documents
    medical_certificate = models.FileField(upload_to='appeals/exam_rewrite/', null=True, blank=True)
    
    # Admin decisions
    new_exam_date = models.DateField(null=True, blank=True)
    exam_venue = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'exam_rewrite_appeals'
        unique_together = ['student', 'module', 'semester', 'academic_year']


class MedicalLeaveAppeal(BaseAppeal):
    """Medical leave application"""
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Medical details
    diagnosis = models.CharField(max_length=200, blank=True)
    hospital_name = models.CharField(max_length=200)
    doctor_name = models.CharField(max_length=200)
    
    # Documents
    medical_report = models.FileField(upload_to='appeals/medical/')
    hospital_letter = models.FileField(upload_to='appeals/medical/')
    
    # Admin actions
    approved_leave_days = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'medical_leave_appeals'


class ResultReEvaluationAppeal(BaseAppeal):
    """Appeal for exam result re-evaluation"""
    exam_result = models.ForeignKey(ExamResult, on_delete=models.CASCADE)
    
    REASON_CHOICES = [
        ('CALCULATION', 'Marks Calculation Error'),
        ('PAPER_REVIEW', 'Paper Review Request'),
        ('GRADE_BOUNDARY', 'Grade Boundary Issue'),
        ('OTHER', 'Other')
    ]
    reason_type = models.CharField(max_length=20, choices=REASON_CHOICES)
    specific_concerns = models.TextField()
    
    # Review results
    reviewed_by_instructor = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reevaluation_reviews',
        limit_choices_to={'role' : User.Role.INSTRUCTOR}
    )
    new_marks = models.FloatField(null=True, blank=True)
    new_grade = models.CharField(max_length=2, null=True, blank=True)
    review_comments = models.TextField(blank=True)
    
    class Meta:
        db_table = 'result_reevaluation_appeals'
        unique_together = ['student', 'exam_result']
    
    def on_approval(self):
        """Update exam result if re-evaluation changes grade"""
        if self.new_grade and self.new_marks:
            self.exam_result.grade = self.new_grade
            self.exam_result.score = self.new_marks
            self.exam_result.is_reevaluated = True
            self.exam_result.save()


# ---------- ADMIN REVIEW SYSTEM ----------

class AppealReviewQueue(models.Model):
    """Queue for admin review of appeals"""
    PRIORITY_CHOICES = [
        ('HIGH', 'High Priority'),
        ('MEDIUM', 'Medium Priority'),
        ('LOW', 'Low Priority')
    ]
    
    # Generic relation to any appeal type
    content_type = models.ForeignKey(
            ContentType, 
            on_delete=models.CASCADE,
            limit_choices_to={
            'model__in': [
                'bursaryappeal',
                'hostelappeal', 
                'examrewriteappeal',
                'medicalleaveappeal',
                'resultreevaluationappeal'
            ]
        },
    )
    object_id = models.PositiveIntegerField()
    appeal = GenericForeignKey('content_type', 'object_id')
    
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        limit_choices_to={'role__in': [User.Role.INSTRUCTOR, User.Role.ADMIN]}    
    )
    
    # Categorization
    category = models.CharField(max_length=50)  # 'exam', 'result', 'welfare', 'financial'
    
    # Metadata for filtering
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True)
    academic_year = models.CharField(max_length=20)
    
    # Status
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'appeal_review_queue'
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['category']),
            models.Index(fields=['department', 'faculty', 'academic_year']),
        ]
    
    def __str__(self):
        return f"{self.category} - {self.content_type}"


class AppealAttachment(models.Model):
    """Additional attachments for appeals"""
    appeal_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE,
        limit_choices_to={
            'model__in': [
                'bursaryappeal',
                'hostelappeal',
                'examrewriteappeal',
                'medicalleaveappeal',
                'resultreevaluationappeal'
            ]
        }
    )
    appeal_id = models.PositiveIntegerField()
    appeal = GenericForeignKey('appeal_type', 'appeal_id')
    
    file = models.FileField(upload_to='appeals/attachments/')
    description = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': User.Role.STUDENT})
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'appeal_attachments'
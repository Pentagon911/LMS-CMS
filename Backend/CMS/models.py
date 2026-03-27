#CMS/ models.py
from django.db import IntegrityError, models
import re
from django.db.models import Sum
from django.contrib.auth import get_user_model
from django.utils import timezone
from lms.models import *
from django.conf import settings

User = get_user_model()

class Week(models.Model):
    """Course Weeks"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='weeks', null=True)
    order = models.PositiveIntegerField(default=1)
    topic = models.CharField(max_length=200)
    description = models.TextField(blank= True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        unique_together = ['course','order']

    def __str__(self):
        return f"Week {self.order}: {self.topic}"
    
    def save(self, *args, **kwargs):
        # 1. Only calculate order if it's a NEW record and order isn't manually set
        if not self.pk and not self.order:
            # Look at the database for the current highest week number for this course
            max_order = Week.objects.filter(course=self.course).aggregate(
                max_val=models.Max('order')
            )['max_val'] or 0
            
            self.order = max_order + 1

        # 2. Try to save. If another request beat us to it, catch the error and increment
        try:
            super().save(*args, **kwargs)
        except IntegrityError:
            # Refetch the max order (it likely changed in the last millisecond)
            max_order = Week.objects.filter(course=self.course).aggregate(
                max_val=models.Max('order')
            )['max_val'] or 0
            self.order = max_order + 1
            super().save(*args, **kwargs)

#Abstract parent class
class Content(models.Model):
    week = models.ForeignKey(Week,on_delete=models.CASCADE)
    title = models.TextField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.title
    
class Video(Content):
    """Model to upload video files
     Files will be stored in: media/content/video/"""
    
    file = models.FileField(upload_to='content/video/')
    @property
    def item_type(self):
        return "Video"
    
    @property
    def fileSize(self):
        """Get file size in MB"""
        if self.file:
            return self.file.size / (1024 * 1024)  # Convert bytes to MB
        return 0

class Pdf(Content):
    """Model to upload pdf files
     Files will be stored in: media/content/pdf/"""
    
    file = models.FileField(upload_to ='content/pdfs/')
    @property
    def item_type(self):
        return "Pdf"
    @property
    def fileSizemb(self):
        if self.file:
            return self.file.size / (1024 * 1024)  # Convert bytes to MB
        return 0

class Link(Content):
    """Model to links"""

    link_url = models.URLField()
    @property
    def item_type(self):
        return "Link"

class Quiz(models.Model):
    """Quiz model - represents a quiz in a specific week"""

    # Prefix for generating custom quiz IDs
    QUIZ_ID_PREFIX  = 'quiz'

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
    ]

    # Custom quiz ID (e.g., 'quiz001', 'quiz002')
    quizId = models.CharField(max_length=20,unique=True,blank=True)
    courseCode = models.ForeignKey(Course,on_delete=models.CASCADE,related_name='course', default='') # added default value for avoiding integrity error when creating quiz without course code 

    #Which week this quiz belongs to
    week = models.ForeignKey(Week,on_delete = models.CASCADE,related_name='quizzes',null = True,blank = True)
    title = models.TextField()
    timeLimitMinutes = models.PositiveIntegerField(default=15)
    description = models.TextField(blank=True,null=True)

    # Order of the quiz within the week
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add = True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    start_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering  = ['order'] # Order quizzes by their order number

    def save(self,*args,**kwargs):
        """Override save to auto-generate quizId"""
        if not self.quizId:  # Only generate if it doesn't have an ID yet
            lastQuiz = Quiz.objects.all().order_by('id').last()
            
            if lastQuiz and lastQuiz.quizId:
                # Find all the numbers in the string (ignores words/dashes)
                numbers = re.findall(r'\d+', lastQuiz.quizId)
                if numbers:
                    lastNum = int(numbers[-1])
                else:
                    lastNum = 0
            else:
                lastNum = 0
                
            self.quizId = f"quiz{lastNum + 1}"
            
        super().save(*args, **kwargs)

            
    def schedule(self, start_datetime, week_id=None):
        """Schedule quiz with start time and optionally add to week"""
        from django.utils import timezone
        
        # Add to week if provided
        if week_id:
            self.add_to_week(week_id)
        
        self.status = 'scheduled'
        self.start_time = start_datetime
        self.save()

    def start_quiz(self):
        """Start quiz automatically when time comes"""
        from django.utils import timezone
        
        if self.status == 'scheduled' and self.start_time and self.start_time <= timezone.now():
            self.status = 'active'
            self.save()
            return True
        
        if not self.start_time:
            self.start_time = timezone.now()
            self.status = 'active'
            self.save()
            return True
        
        return False
    
    def is_available(self):
        """Check if quiz is available to students"""
        from django.utils import timezone
        now = timezone.now()
        
        # Auto-start if scheduled and time has come
        if self.status == 'scheduled' and self.start_time and now >= self.start_time:
            self.start_quiz()
        
        return self.status == 'active'

    def __str__(self):
        return self.title

class Question(models.Model):
    """Question model - represents a question in a quiz"""

    QUESTION_TYPES = [
        ('single',"Single Answer"),
        ('multiple',"Multiple Answer"),
        ('true_false',"True or False"),
        ('short',"Short Answer"),
    ]

    #
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name='questions')

    # Custom question ID (e.g., 'q1', 'q2')
    questionId = models.CharField(max_length=10,blank=True)

    order = models.PositiveIntegerField(default=1)
    questionTypes = models.CharField(max_length =20,choices = QUESTION_TYPES,default='single')
    text = models.TextField()
    image = models.ImageField(
        upload_to='quiz/questions/',
        null = True,
        blank=True
    ) 
    
    class Meta:
        ordering = ['order']

    def save(self,*args,**kwargs):
        if not self.questionId:
             # Generate question_id like 'q1', 'q2', etc.
            lastQuestion = Question.objects.filter(quiz=self.quiz).order_by('-order').first()
            if lastQuestion and lastQuestion.questionId:
                lastNum = int(lastQuestion.questionId.replace('q', ''))
                newNum = lastNum + 1
            else:
                newNum = 1
            self.questionId = f"q{newNum}"
        super().save(*args, **kwargs)
    
class Option(models.Model):
    """Option model - represents an answer option for a question"""

    # Which option this option belongs to
    question = models.ForeignKey(Question,on_delete=models.CASCADE,related_name="options")

    # Custom option ID (e.g., 'A', 'B', 'C')
    optionId = models.CharField(max_length=3,blank = True)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default = 1)
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['order']

    def save(self,*args,**kwargs):
        """Override save to auto-generate optionId"""
        self.points = 1 if self.is_correct else 0
        if not self.optionId:
             # Generate option_id like 'A', 'B', 'C', etc.
            lastOption = Option.objects.filter(question=self.question).order_by('-order').first()

            if lastOption and lastOption.optionId:
                lastChar = lastOption.optionId
                newChar = chr(ord(lastChar)+1)
            else:
                newChar = 'A'

            self.optionId = newChar
        super().save(*args,**kwargs)
    def __str__(self):
        return self.text

class QuizAttempt(models.Model):
    """Tracks a student's attempt at a quiz"""

    # Which student made this attempt
    student = models.ForeignKey(User,on_delete=models.CASCADE,related_name='quiz_attempts')

    # Which quiz was attempted
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name='attempts')
    startedAt = models.DateTimeField(auto_now_add=True)
    endAt = models.DateTimeField(blank=True,null = True)
    score = models.FloatField(null=True,blank=True)

    class Meta:
        ordering = ['-startedAt']
        unique_together = ['student', 'quiz', 'endAt']

    def __str__(self):
        status = "Completed" if self.endAt else "In Progress"
        displayScore = f"{self.score}%" if self.score else "Not graded"

        return f"{self.student.username} - {self.quiz.title} - {status} - {displayScore}"

class StudentAnswer(models.Model):
    """Records a student's answer to a specific question"""

    # Which attempt this answer belongs to
    attempt = models.ForeignKey(QuizAttempt,on_delete=models.CASCADE,related_name='answers')

    question = models.ForeignKey(Question,on_delete=models.CASCADE)
    selectedOptions = models.ManyToManyField(Option,blank = True)
    textAnswer = models.TextField(blank = True,null=True)
    isCorrect  = models.BooleanField(default = False)
    pointsEarned = models.FloatField(default=0)
    answeredAt  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together  = ['attempt','question']  # One answer per question per attempt
        ordering = ['answeredAt'] # Order by when they answered

    def __str__(self):
        return f"Answer for {self.question.questionId}"

class Announcement(models.Model):
    """Announcements at different levels"""
    
    ANNOUNCEMENT_TYPES = [
        ('batch', 'Batch Announcement'),    
        ('course', 'Course Announcement'),        
        ('faculty', 'Faculty Announcement'),     
    ]
    week = models.ForeignKey(
        'Week', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='announcements'
    )
    title = models.CharField(max_length=200)
    content = models.TextField()

    faculty = models.ForeignKey('lms.Faculty', on_delete=models.CASCADE, null=True, blank=True)
    batch = models.ForeignKey('lms.Batch', on_delete=models.CASCADE, null=True, blank=True)
    course = models.ForeignKey('lms.Course', on_delete=models.CASCADE, null=True, blank=True)

    image = models.ImageField(upload_to='announcements/images/', null=True, blank=True)
    pdf = models.FileField(upload_to='announcements/pdfs/', null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class AcademicCalendar(models.Model):
    SEMESTER_CHOICES = [(i, f'Semester {i}') for i in range(1, 9)]  # 1-8

    year = models.PositiveIntegerField(help_text="Academic year (e.g., 2024)")
    semester = models.IntegerField(choices=SEMESTER_CHOICES, help_text="Semester number (1-8)")
    faculty = models.CharField(max_length=200, help_text="Faculty/Department name")
    pdf = models.FileField(upload_to='academic_calendars/', help_text="Timetable PDF file")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-year', '-semester']
        unique_together = ['year', 'semester', 'faculty']

    def __str__(self):
        return f"{self.year} Semester {self.semester} - {self.faculty}"
    
class PracticalTimetable(models.Model):
    """Simplified practical timetable: year, semester, faculty, title, PDF."""
    SEMESTER_CHOICES = [(i, f'Semester {i}') for i in range(1, 9)]

    year = models.PositiveIntegerField(help_text="Academic year (e.g., 2024)")
    semester = models.IntegerField(choices=SEMESTER_CHOICES, help_text="Semester number (1-8)")
    faculty = models.CharField(max_length=200, help_text="Faculty/Department name")
    title = models.CharField(max_length=200, help_text="Title of the practical schedule")
    pdf = models.FileField(upload_to='practical_timetables/', help_text="Timetable PDF file")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-year', '-semester', 'faculty']
        # Optional: enforce uniqueness to avoid duplicates
        unique_together = ['year', 'semester', 'faculty', 'title']

    def __str__(self):
        return f"{self.year} S{self.semester} {self.faculty} - {self.title}"

class GlobalAnnouncement(models.Model):
    """Global announcements that can be targeted to specific faculties, departments, or batches"""
    
    TARGET_TYPE_CHOICES = (
        ('all', 'All Students'),
        ('faculty', 'Specific Faculty'),
        ('department', 'Specific Department'),
        ('batch', 'Specific Batch'),
        ('program', 'Specific Program'),
    )
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    pdf_file = models.FileField(
        upload_to='announcements/pdfs/',
        blank=True,
        null=True,
        help_text="PDF file attachment (optional)"
    )
    
    # Target selection
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE_CHOICES, default='all')
    
    # These fields are used based on target_type
    faculties = models.ManyToManyField(
        'lms.Faculty',  
        blank=True,
        related_name='announcements',
        help_text="Target specific faculties"
    )
    departments = models.ManyToManyField(
        'lms.Department',  
        blank=True,
        related_name='announcements',
        help_text="Target specific departments"
    )
    batches = models.ManyToManyField(
        'lms.Batch',  
        blank=True,
        related_name='announcements',
        help_text="Target specific batches"
    )
    programs = models.ManyToManyField(
        'lms.Program',  
        blank=True,
        related_name='announcements',
        help_text="Target specific programs"
    )
    
    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_announcements'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    publish_from = models.DateTimeField(default=timezone.now)
    publish_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'global_announcements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_type', 'is_active']),
            models.Index(fields=['publish_from', 'publish_until']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.target_type}"
    
    def is_visible_to_student(self, student_profile):
        """
        Check if this announcement should be visible to a specific student
        """
        if not self.is_active:
            return False
        
        # Check publish date range
        now = timezone.now()
        if now < self.publish_from:
            return False
        if self.publish_until and now > self.publish_until:
            return False
        
        # Check targeting
        if self.target_type == 'all':
            return True
        
        elif self.target_type == 'faculty':
            return student_profile.faculty and self.faculties.filter(id=student_profile.faculty.id).exists()
        
        elif self.target_type == 'department':
            return student_profile.department and self.departments.filter(id=student_profile.department.id).exists()
        
        elif self.target_type == 'batch':
            return student_profile.batch and self.batches.filter(id=student_profile.batch.id).exists()
        
        elif self.target_type == 'program':
            return student_profile.program and self.programs.filter(id=student_profile.program.id).exists()
        
        return False
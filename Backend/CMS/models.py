#CMS/ models.py
from django.db import models
from django.db.models import Sum
from django.contrib.auth import get_user_model
from django.utils import timezone
from lms.models import *
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
    file = models.FileField(upload_to='video/')
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
    file = models.FileField(upload_to ='pdfs/')
    @property
    def item_type(self):
        return "Pdf"
    @property
    def fileSizemb(self):
        if self.file:
            return self.file.size / (1024 * 1024)  # Convert bytes to MB
        return 0

class Link(Content):
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
    description = models.TextField(blank=True)

    # Order of the quiz within the week
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add = True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    start_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering  = ['order'] # Order quizzes by their order number

    def save(self,*args,**kwargs):
        """Override save to auto-generate quizId"""
        if not self.quizId:
            # Generate quizId like 'quiz001', 'quiz002', etc
            lastQuiz = Quiz.objects.order_by('-id').first()
            if lastQuiz and lastQuiz.quizId:
                lastNum = int(lastQuiz.quizId.replace('quiz', ''))
                newNum = lastNum + 1
            else:
                newNum = 1
            self.quizId = f"{self.QUIZ_ID_PREFIX}{newNum:03d}"
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

    #Which quiz this question belongs to
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name='questions')

    # Custom question ID (e.g., 'q1', 'q2')
    questionId = models.CharField(max_length=10,blank=True)

    order = models.PositiveIntegerField(default=1)
    questionTypes = models.CharField(max_length =20,choices = QUESTION_TYPES,default='single')
    text = models.TextField()
    image = models.ImageField(
        upload_to='question_images/',
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
        ('week', 'Week Announcement'),     
    ]
    
    announcement_type = models.CharField(max_length=10, choices=ANNOUNCEMENT_TYPES, default='course')
    
    # For batch announcements (all students in this batch)
    batch = models.ForeignKey(Batch,on_delete=models.CASCADE,related_name='announcements',null=True,blank=True)
    
    # For course announcements
    course = models.ForeignKey(Course,on_delete=models.CASCADE,related_name='announcements',null=True,blank=True)
    
    # For week announcements
    week = models.ForeignKey(Week,on_delete=models.CASCADE,related_name='announcements',null=True,blank=True)
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    # Attachments
    image = models.ImageField(upload_to='announcements/images/', null=True, blank=True)
    pdf = models.FileField(upload_to='announcements/pdfs/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.announcement_type == 'batch':
            return f"Semester {self.batch}: {self.title}"
        elif self.announcement_type == 'course':
            return f"Course {self.course.code}: {self.title}"
        else:
            return f"Week {self.week.order}: {self.title}"
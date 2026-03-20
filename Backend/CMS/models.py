#CMS/ models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from lms.models import *
User = get_user_model()


# yet to connect LMS sem module as foriegn key to week
    
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

    # Custom quiz ID (e.g., 'quiz001', 'quiz002')
    quizId = models.CharField(max_length=20,unique=True,blank=True)

    #Which week this quiz belongs to
    week = models.ForeignKey(Week,on_delete = models.CASCADE,related_name='quizzes')
    title = models.TextField()
    timeLimitMinutes = models.PositiveIntegerField(default=15)

    # Order of the quiz within the week
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add = True)

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


    def __str__(self):
        return f"{self.questionId}: {self.text[:50]}"
    
class Option(models.Model):
    """Option model - represents an answer option for a question"""

    # Which option this option belongs to
    question = models.ForeignKey(Question,on_delete=models.CASCADE,related_name="options")

    # Custom option ID (e.g., 'A', 'B', 'C')
    optionId = models.CharField(max_length=3,blank = True)

    order = models.PositiveIntegerField(default = 1)
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['order']

    def save(self,*args,**kwargs):
        """Override save to auto-generate optionId"""
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
    answeredAt  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together  = ['attempt','question']  # One answer per question per attempt
        ordering = ['answeredAt'] # Order by when they answered

    def __str__(self):
        return f"Answer for {self.question.questionId}"

class Announcement(models.Model):
    """Course announcements"""

    # Which week this announcement is for
    week = models.ForeignKey(Week,on_delete=models.CASCADE,related_name='announcements')
    description = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering =['-createdAt']

    def __str__(self):
        return self.description[:50]
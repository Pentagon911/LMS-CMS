from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

# Create your models here.
# yet to connect LMS sem module as foriegn key to week
    
class Week(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='weeks', null=True)
    order = models.PositiveIntegerField(default=1)
    topic = models.CharField(max_length=200)
    description = models.TextField(blank= True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

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

class Pdf(Content):
    file = models.FileField(upload_to ='pdfs/')
    @property
    def item_type(self):
        return "Pdf"

class Link(Content):
    link_url = models.URLField()
    @property
    def item_type(self):
        return "Link"

class Quiz(models.Model):
    QUIZ_ID_PREFIX = 'quiz'
    quizId = models.CharField(max_length=20,unique=True,blank=True)
    week = models.ForeignKey(Week,on_delete = models.CASCADE,related_name='quizzes')
    title = models.TextField()
    timeLimitMinutes = models.PositiveIntegerField(default=15)
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add = True)

    class Meta:
        ordering  = ['order']

    def save(self,*args,**kwargs):
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
    QUESTION_TYPES = [
        ('single',"Single Answer"),
        ('multiple',"Multiple Answer"),
        ('true_false',"True or False"),
        ('short',"Short Answer"),
    ]
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name='questions')
    questionId = models.CharField(max_length=10,blank=True)
    image = models.ImageField(
        upload_to='question_images/',
        null = True,
        blank=True
    )
    text = models.TextField()
    questionTypes = models.CharField(max_length =20,choices = QUESTION_TYPES,default='single')
    order = models.PositiveIntegerField(default=1)

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
    question = models.ForeignKey(Question,on_delete=models.CASCADE,related_name="options")
    optionId = models.CharField(max_length=3,blank = True)
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default = 1)

    class Meta:
        ordering = ['order']

    def save(self,*args,**kwargs):
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
    student = models.ForeignKey(User,on_delete=models.CASCADE,related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE,related_name='attempts')
    startedAt = models.DateTimeField(auto_now_add=True)
    endAt = models.DateTimeField(blank=True,null = True)
    score = models.FloatField(null=True,blank=True)

    class Meta:
        ordering = ['-startedAt']

    def __str__(self):
        status = "Completed" if self.endAt else "In Progress"
        displayScore = f"{self.score}%" if self.score else "Not graded"

        return f"{self.student.username} - {self.quiz.title} - {status} - {displayScore}"

class StudentAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt,on_delete=models.CASCADE,related_name='answers')
    question = models.ForeignKey(Question,on_delete=models.CASCADE)
    selectedOptions = models.ManyToManyField(Option,blank = True)
    textAnswer = models.TextField(blank = True)
    isCorrect  = models.BooleanField(default = False)
    answeredAt  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together  = ['attempt','question']
        ordering = ['answeredAt']

    def __str__(self):
        return f"Answer for {self.question.questionId}"

class Announcement(models.Model):
    week = models.ForeignKey(Week,on_delete=models.CASCADE,related_name='announcements')
    description = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering =['-createdAt']

    def __str__(self):
        return self.description[:50]
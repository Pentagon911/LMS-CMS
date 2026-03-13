from django.db import models

# Create your models here.
# yet to connect LMS sem module as foriegn key to week
class Week(models.Model):
    topic = models.CharField(max_length=200)
    description = models.TextField(blank= True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

#Abstract parent class
class Content(models.Model):
    week = models.ForeignKey(Week,on_delete=models.CASCADE,related_name='contents')
    title = models.TextField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
    
    def summary(self):
        return self.title
    
class Video(Content):
    file = models.FileField(upload_to='video/')

class Pdf(Content):
    file = models.FileField(uploads_to ='pdfs/')

class Link(Content):
    file = models.URLField()

class Quiz(models.Model):
    week = models.ForeignKey(Week,on_delete = models.CASCADE,related_name='quizzes')
    title = models.TextField()
    question = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add = True)

    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz,on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return self.text
    
class Answer(models.Model):
    question = models.ForeignKey(Question,on_delete=models.CASCADE,related_name="options")
    text = models.TextField()
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text
    
class Announcement(models.Model):
    week = models.ForeignKey(Week,on_delete=models.CASCADE,related_name='announcements')
    description = models.TextField()

    def __str__(self):
        return self.description


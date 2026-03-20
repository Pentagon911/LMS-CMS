from rest_framework import serializers
from .models import*
from lms.models import Course

# ========== Serilizers for Content Operations ==========

class contentSerializer(serializers.ModelSerializer):
    """
    Base serializer for all content types (Video, PDF, Link) Provides common fields and item_type for frontend
    """

    item_type = serializers.ReadOnlyField()
    class Meta:
        fields = ['id','week', 'title', 'description', 'item_type', 'created_at']
        read_only_fields = ['id', 'created_at', 'item_type']

class pdfSerializer(contentSerializer):
    """Serializer for PDF content - adds file field and validation"""

    fileSize = serializers.SerializerMethodField()

    class Meta:
        model = Pdf
        fields = contentSerializer.Meta.fields + ['file','fileSize']

    def validate_file (self,value):
        #Check extension
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        
        #Check file size
        if value.size > 10*1024*1024:
            raise serializers.ValidationError("PDF size must be under 10 MB")
        return value
    
    def get_fileSize(self, obj):
        return obj.fileSize
    
class videoSerializer(contentSerializer):
    """Serializer for Video content - adds file field and validation"""
    fileSize = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = contentSerializer.Meta.fields + ['file','fileSize']

    def validate_file(self,value):
        #Check extension
        if not value.name.endswith('.mp4'):
            raise serializers.ValidationError("Only .mp4 videos are allowed.")
        
        #Check file size
        if value.size > 200*1024*1024:
            raise serializers.ValidationError("Video size must be under 200 MB")
        return value
    
    def get_fileSize(self, obj):
        return obj.fileSize

class LinkSerializer(contentSerializer):
    """Serializer for Link content - adds URL field and validation"""

    class Meta(contentSerializer.Meta):
        model = Link
        fields = contentSerializer.Meta.fields + ['link_url']
    
    def validate_link_url(self, value):
        # Additional URL validation if needed
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://")
        return value
    
class announcementSerializer(serializers.ModelSerializer):
    """Serializer for course announcements"""

    class Meta:
        model = Announcement
        fields = ['id','description','createdAt']


# ========== BASE Serilizers for Quiz Operations ==========

class BaseOptionSerializer(serializers.ModelSerializer):
    """
    Base serializer for Option model. Provides common fields and formatting for all option serializers
    """

    id = serializers.CharField(source = 'optionId',read_only = True)
    class Meta:
        model = Option
        fields = ['id','text']

class BaseQuestionSerializer(serializers.ModelSerializer):
    """
    Base serializer for Question model. Provides common fields for all question serializers
    """
    questionId = serializers.CharField()
    question = serializers.CharField(source = 'text')
    multipleAnswers = serializers.SerializerMethodField()
    image = serializers.ImageField(allow_null = True,required = False)

    class Meta:
        model = Question
        fields = ['questionId','question','image','multipleAnswers']

    def get_multipleAnswers(self,obj):
        return "true" if obj.questionTypes == 'multiple' else "false"

class BaseQuizSerializer(serializers.ModelSerializer):
    """
    Base serializer for Quiz model. Provides common fields for all quiz serializers
    """
    quizId = serializers.CharField(read_only = True)
    course = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['quizId', 'title', 'course', 'time', ]
    
    def get_course(self, obj):
        if obj.week and obj.week.course:
            return obj.week.course.code
    
    def get_time(self, obj):
        return f"{obj.timeLimitMinutes}m"  
     
# ========== Student Quiz Serilizers without Correct Answers ==========

class StudentOptionSerializer(BaseOptionSerializer):
    """Student view of options - NO is_correct field"""
    class Meta(BaseOptionSerializer.Meta):
        fields = ['id','text']
    
class StudentQuestionSerializer(BaseQuestionSerializer):
    """Student view of questions - includes options without correct answers"""
    options = serializers.SerializerMethodField()

    class Meta(BaseQuestionSerializer.Meta):
        fields = BaseOptionSerializer.Meta.fields + ['options']

    def get_options(self,obj):
        """Get options for this question without correct answers"""
        options = obj.options.all().order_by('order')
        return StudentOptionSerializer(options,many = True).data

class StudentQuizSerializer(BaseQuizSerializer):
    """Student view of quizzes - includes questions without correct answers"""

    questions = serializers.SerializerMethodField()
    
    class Meta(BaseQuizSerializer.Meta):
        fields = BaseQuizSerializer.Meta.fields + ['questions']
    
    def get_questions(self, obj):
        """Get questions for this quiz in order"""
        questions = obj.questions.all().order_by('order')
        return StudentQuestionSerializer(questions, many=True).data
    
# ========== Instructor Quiz Serilizers with Correct Answers ==========

class InstructorOptionSerializer(BaseOptionSerializer):
    """Instructor view of options - INCLUDES is_correct field"""
    
    is_correct = serializers.BooleanField()
    class Meta(BaseOptionSerializer.Meta):
        fields = ['id','text','is_correct']

class InstructorQuestionSerializer(BaseQuestionSerializer):
    """Instructor view of questions - includes options with correct answers"""
   
    options = serializers.SerializerMethodField()

    class Meta(BaseQuestionSerializer.Meta):
        fields = BaseOptionSerializer.Meta.fields + ['options']

    def get_options(self,obj):
        options = obj.options.all().order_by('order')
        return InstructorOptionSerializer(options,many = True).data

class InstructorQuizSerializer(BaseQuizSerializer):
    """Instructor view of quizzes - includes questions with correct answers"""

    questions = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta(BaseQuizSerializer.Meta):
        fields = BaseQuizSerializer.Meta.fields + ['questions','stats']
    
    def get_questions(self, obj):
        """Get questions for this quiz with correct answers"""
        questions = obj.questions.all().order_by('order')
        return InstructorQuestionSerializer(questions, many=True).data

    def get_stats(self, obj):
        """Get statistics about this quiz (attempts, average score, etc.)"""
        from django.db.models import Avg, Count
        attempts = QuizAttempt.objects.filter(quiz=obj)
        completed = attempts.filter(endAt__isnull=False)
        
        return {
            'total_attempts': attempts.count(),
            'completed_attempts': completed.count(),
            'average_score': completed.aggregate(avg=Avg('score'))['avg'],
        }
    
# ==========  Serilizers for Quiz Creation ==========

class OptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating options within a question"""
    
    class Meta:
        model = Option
        fields = ['text','is_correct','order']

    def validate(self, data):
        # Validate that option has text
        if not data.get('text'):
            raise serializers.ValidationError("Option Text is required")
        return data

class QuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating questions within a quiz"""
    options = OptionCreateSerializer(many = True)

    class Meta:
        model = Question
        fields = ['text','questionTypes', 'order', 'options', 'image']

    def validate(self,data):
        questionType = data.get('questionTypes')
        options  = data.get('options',[])

        #Check on question Text
        if not data.get('text'):
            raise serializers.ValidationError("Question Text is required")
        
        # Validate base on type
        if questionType in ['single', 'multiple']:
            if not options:
                raise serializers.ValidationError("Multiple choice question must have options")
            
            if len(options)<2:
                raise serializers.ValidationError("Multiple choice must have at least 2 options")
        
        #Check correct options
        correctCount = sum(1 for opt in options if opt.get('is_correct'))
        if correctCount == 0:
            raise serializers.ValidationError("At least one option must be correct")
            
        if questionType == 'single' and correctCount > 1:
            raise serializers.ValidationError("Single answer questions can only have one correct option")
        
        return data

class QuizCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a complete quiz with questions and options
    """

    questions = QuestionCreateSerializer(many = True)
    
    class Meta:
        model = Quiz
        fields = ['title', 'timeLimitMinutes', 'order','week','questions']

    def create(self,validated_data):
        """
        Create a quiz with all its questions and options
        Week is taken from serializer context (set in view)
        """

        questionsData = validated_data.pop('questions')

        week = validated_data.pop('week')
               
        quiz = Quiz.objects.create(week = week,**validated_data)

        # Create each question with its options
        for questionData in questionsData:
            # Extract options data
            options_data = questionData.pop('options')
            
            # Create question
            question = Question.objects.create(quiz=quiz, **questionData)
            
            # Create options
            for option_data in options_data:
                Option.objects.create(question=question, **option_data)
    
        return quiz

    def update(self,instance,validated_data):
        """
        Update quiz - DELETE ALL existing questions and REPLACE with new ones
        """
        questionsData = validated_data.pop('questions', None)

        # Update quiz fields (title, description, timeLimitMinutes, order)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If new questions are provided
        if questionsData is not None:
            # DELETE all existing questions (cascade deletes options)
            instance.questions.all().delete()
             # CREATE new questions with options
            for qData in questionsData:
                options_data = qData.pop('options', [])
                points = qData.pop('points', 1)
                
                # Create new question
                question = Question.objects.create(quiz=instance, points=points, **qData)
                
                # Create options for this question
                for option_data in options_data:
                    Option.objects.create(question=question, **option_data)

        return instance
    
# ========== BASE Serilizers for attempt Operations ==========

class quizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for quiz attempts"""
    studentName = serializers.CharField(source ='student.username',read_only = True)
    quizid = serializers.CharField(source ='quiz.quizId')

    class Meta:
        model = QuizAttempt
        fields = ['id','studentName','quiz','quizid','startedAt','endAt','score']
        read_only_fields = ['id', 'startedAt']

class studentAnswerSerializer(serializers.ModelSerializer):

    """
    Serializer for student answers
    Includes detailed information about selected options
    """

    questionText = serializers.CharField(source='question.text', read_only=True)
    questionType = serializers.CharField(source='question.questionTypes', read_only=True)
    selectedOptionsDetails = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = StudentAnswer
        fields = [
            'id', 
            'question', 
            'questionText',      # Shows the actual question
            'questionType',      # Shows type (single, multiple, etc.)
            'attempt',            # Fixed: was 'attemp'
            'selectedOptions',     # IMPORTANT: You forgot this field!
            'selectedOptionsDetails',  # Human-readable options
            'textAnswer', 
            'isCorrect',
            'answeredAt'
        ]
        read_only_fields = ['id','answeredAt']
    
    def getSelectedOptionsDetails(self, obj):
        """Return list of selected option texts"""
        return [{
            'id': opt.id,
            'optionId': opt.optionId,
            'text': opt.text,
            'is_correct': opt.is_correct  # This will be filtered in views for students
        } for opt in obj.selectedOptions.all()]
    
class courseListSerializer(serializers.ModelSerializer):
    """Serializer for course list view"""

    code = serializers.CharField(source = Course.code)
    title = serializers.CharField(source = Course.name)
    color = serializers.CharField(source = Course.color)

    class Meta:
        model = Course
        fields = ['id','code', 'title','color']

class courseDashboardSerializer(serializers.ModelSerializer):
    """Serializer for complete course dashboard"""
    courseTitle = serializers.CharField(source = 'name')
    weeks = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['courseTitle','weeks']

    def get_weeks(self,obj):
        weeks = obj.weeks.all().order_by('order')

        result = []

        for week in weeks:
            result.append({
                'week':week.topic,
                'items':self.get_week_items(week)
            })

        return result
    
    def get_week_items(self,week):
        items = []

        for video in week.video_set.all():
            items.append({
                "type": "content",
                "title": video.title,
                "format": "Video",
                "fileUrl": video.file.url,
                "fileSize": video.fileSize,
                "description": video.description
            })

        for pdf in week.pdf_set.all():
            items.append({
                "type": "content",
                "title": pdf.title,
                "format": "PDF",
                "fileUrl": pdf.file.url,
                "fileSize": pdf.fileSize,
                "description": pdf.description
            })

        for link in week.link_set.all():
            items.append({
                "type": "content",
                "title": link.title,
                "format": "Link",
                "fileUrl": link.link_url,
                "description": link.description
            })

        request = self.context.get('request')
        quizzes = week.quizzes.all()

        if request and request.user.role == 'student':
            quizzes = quizzes.filter(status='published')
        
        for quiz in quizzes:
            items.append({
                'type': 'quiz',
                'title': quiz.title,
                'quizId': quiz.quizId,
                'duration': f"{quiz.timeLimitMinutes} min",
                'questionsCount': quiz.questions.count(),
                'description': getattr(quiz, 'description', '')
            })

        for announcement in week.announcements.all():
            items.append({
                'type': 'announcement',
                'title': announcement.description[:50],
                'message': announcement.description,
                'date': announcement.createdAt.strftime('%Y-%m-%d')
            })
        
        return items

class WeekSerializer(serializers.ModelSerializer):
    """
    Serializer for Week model - includes all related content. Dynamically loads videos, PDFs, links, announcements, and quizzes
    """

    videos = serializers.SerializerMethodField()
    pdfs = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()
    announcements = announcementSerializer(many = True)
    quizzes = serializers.SerializerMethodField()
    class Meta:
        model = Week
        fields = ['id', 'topic', 'description', 'created_at', 'videos', 'pdfs', 'links','quizzes']
        read_only_fields = ['id', 'created_at']

    def get_videos(self, obj):
        """Get all videos for this week"""
        return videoSerializer(obj.video_set.all(), many=True).data

    def get_pdfs(self, obj):
        """Get all pdfs for this week"""
        return pdfSerializer(obj.pdf_set.all(), many=True).data

    def get_links(self, obj):
        """Get all links for this week"""
        return LinkSerializer(obj.link_set.all(), many=True).data
    
    def get_quizzes(self, obj):
        """
        Get all quizzes for this week - role-based filtering
        Students see only published quizzes, instructors see all
        """
        request = self.context.get('request')
        quizzes = obj.quizzes.all().order_by('order')
        
        if request and request.user.role == 'student':
            return StudentQuizSerializer(quizzes, many=True, context=self.context).data
        elif request and request.user.role == 'instructor':
            return InstructorQuizSerializer(quizzes, many=True, context=self.context).data
        return StudentQuizSerializer(quizzes, many=True, context=self.context).data
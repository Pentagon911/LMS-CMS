from rest_framework import serializers
from .models import*

# ========== Serilizers for Content Operations ==========

class contentSerializer(serializers.ModelSerializer):
    item_type = serializers.ReadOnlyField()
    class Meta:
        fields = ['id','week', 'title', 'description', 'item_type', 'created_at']
        read_only_fields = ['id', 'created_at', 'item_type']

class pdfSerializer(contentSerializer):
    class Meta:
        model = Pdf
        fields = contentSerializer.Meta.fields + ['file']

    def validate_file (self,value):
        #Check extension
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        
        #Check file size
        if value.size > 10*1024*1024:
            raise serializers.ValidationError("PDF size must be under 10 MB")
        return value
    
class videoSerializer(contentSerializer):
    class Meta:
        model = Video
        fields = contentSerializer.Meta.fields + ['file']

    def validate_file(self,value):
        #Check extension
        if not value.name.endswith('.mp4'):
            raise serializers.ValidationError("Only .mp4 videos are allowed.")
        
        #Check file size
        if value.size > 200*1024*1024:
            raise serializers.ValidationError("Video size must be under 200 MB")
        return value

class LinkSerializer(contentSerializer):
    class Meta(contentSerializer.Meta):
        model = Link
        fields = contentSerializer.Meta.fields + ['link_url']
    
    def validate_link_url(self, value):
        # Additional URL validation if needed
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://")
        return value
    
class announcementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id','description','createdAt']

class WeekSerializer(serializers.ModelSerializer):
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
        return videoSerializer(obj.video_set.all(), many=True).data

    def get_pdfs(self, obj):
        return pdfSerializer(obj.pdf_set.all(), many=True).data

    def get_links(self, obj):
        return LinkSerializer(obj.link_set.all(), many=True).data

# ========== BASE Serilizers for Quiz Operations ==========

class BaseOptionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source = 'optionId',read_only = True)
    # display = serializers.SerializerMethodField()
    class Meta:
        model = Option
        fields = ['id','text']

    # def get_display(self,obj):
    #     return f"{obj.optionId}.{obj.text}"

class BaseQuestionSerializer(serializers.ModelSerializer):
    questionId = serializers.CharField()
    question = serializers.CharField(source = 'text')
    multipleAnswers = serializers.SerializerMethodField()
    image = serializers.ImageField(allow_null = True,required = False)

    class Meta:
        model = Question
        fields = ['questionId','question','image','multipleAnswers']

    def get_multipleAnswers(self,obj):
        return "true" if obj.questionTypes == 'Multiple' else "false"

class BaseQuizSerializer(serializers.ModelSerializer):
    quizId = serializers.CharField()
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
    class Meta(BaseOptionSerializer.Meta):
        fields = ['id','text']
    
class StudentQuestionSerializer(BaseQuestionSerializer):
    options = serializers.SerializerMethodField()

    class Meta(BaseQuestionSerializer.Meta):
        fields = BaseOptionSerializer.Meta.fields + ['options']

    def get_options(self,obj):
        options = obj.options.all().order_by('order')
        return StudentOptionSerializer(options,many = True).data

class StudentQuizSerializer(BaseQuizSerializer):
    questions = serializers.SerializerMethodField()
    
    class Meta(BaseQuizSerializer.Meta):
        fields = BaseQuizSerializer.Meta.fields + ['questions']
    
    def get_questions(self, obj):
        questions = obj.questions.all().order_by('order')
        return StudentQuestionSerializer(questions, many=True).data
    
# ========== Instructor Quiz Serilizers with Correct Answers ==========

class InstructorOptionSerializer(BaseOptionSerializer):
    is_correct = serializers.BooleanField()
    class Meta(BaseOptionSerializer.Meta):
        fields = ['id','text','is_correct']

class InstructorQuestionSerializer(BaseQuestionSerializer):
    options = serializers.SerializerMethodField()

    class Meta(BaseQuestionSerializer.Meta):
        fields = BaseOptionSerializer.Meta.fields + ['options']

    def get_options(self,obj):
        options = obj.options.all().order_by('order')
        return InstructorOptionSerializer(options,many = True).data

class InstructorQuizSerializer(BaseQuizSerializer):
    questions = serializers.SerializerMethodField()
    
    class Meta(BaseQuizSerializer.Meta):
        fields = BaseQuizSerializer.Meta.fields + ['questions']
    
    def get_questions(self, obj):
        questions = obj.questions.all().order_by('order')
        return InstructorQuestionSerializer(questions, many=True).data

# ==========  Serilizers for Quiz Creation ==========

class OptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['text','is_correct','order']

    def validate(self, data):
        if not data.get('text'):
            raise serializers.ValidationError("Option Text is required")
        return data

class QuestionCreateSerializer(serializers.ModelSerializer):
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
    questions = QuestionCreateSerializer(many = True,read_only = True)

    class Meta:
        model = Quiz
        fields = ['title', 'timeLimitMinutes', 'order', 'week', 'questions']

        def create(self,validated_data):
            questionsData = validated_data.pop('questions')

            quiz = Quiz.objects.create(**validated_data)
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
        questionsData = validated_data.pop('questions',None)

        for attr, value in validated_data.items():
            setattr(instance,attr,value)

        instance.save()

        if questionsData is not None:
            for qData in questionsData:
                if qData.get('id'):
                    question = Question.objects.get(id =qData['id'])
                    for attr,value in qData.items():
                        setattr(question,attr,value)
                    instance.save()
                else:
                    options = questionsData.pop('options')
                    question = Question.objects.create(quiz =instance,**questionsData)

                    for option in options:
                        Option.objects.create(question = question,**option)

        return instance

# ========== BASE Serilizers for attempt Operations ==========

class quizAttemptSerializer(serializers.ModelSerializer):
    studentName = serializers.CharField(source ='student.username',read_only = True)
    quizid = serializers.CharField(source ='quiz.quizId')

    class Meta:
        model = QuizAttempt
        fields = ['id','studentName','quiz','quizid','startedAt','endAt','score']

class studentAnswerSerializer(serializers.ModelSerializer):
    # Add helpful read-only fields for API responses
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
            'selectedOption',     # IMPORTANT: You forgot this field!
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
        } for opt in obj.selectedOption.all()]
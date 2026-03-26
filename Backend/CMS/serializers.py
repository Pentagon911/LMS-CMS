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
        fields = ['id', 'title', 'description', 'item_type', 'created_at']
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
        return obj.fileSizemb2
    
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
    
class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    week_number = serializers.IntegerField(source='week.order', read_only=True)
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'attachments', 'week_number', 
            'created_at', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'created_by_name']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Merge pdf, image, and url into one "attachment" field for the frontend
        if instance.pdf:
            representation['attachment'] = representation.pop('pdf')
        elif instance.image:
            representation['attachment'] = representation.pop('image')
        elif instance.attachment_url:
            representation['attachment'] = representation.pop('attachment_url')
        
            
        return representation
    
    def get_attachments(self, obj):
        """
        Returns exactly one list of attachments.
        If both exist, both are returned. If one exists, only one is returned.
        If none exist, it returns a list with null values to maintain the 'one attachment' contract.
        """
        attachments = []
        
        # Check PDF
        if hasattr(obj, 'pdf') and obj.pdf:
            attachments.append(self.get_file_attachment(obj.pdf, 'application/pdf'))
            
        # Check Image
        if hasattr(obj, 'image') and obj.image:
            # Determine image MIME type
            file_ext = obj.image.name.split('.')[-1].lower() if '.' in obj.image.name else 'jpg'
            mime_types = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
                'gif': 'image/gif', 'webp': 'image/webp'
            }
            mime_type = mime_types.get(file_ext, 'image/jpeg')
            attachments.append(self.get_file_attachment(obj.image, mime_type))

        
        if not attachments:
            attachments.append({
                "fileName": None,
                "fileUrl": None,
                "fileSize": None,
                "fileType": None
            })

        return attachments
    
    def get_file_attachment(self, file_field, default_mime_type):
        """
        Get attachment data for a file field.
        """
        try:
            if file_field and file_field.name:
                # Get clean file name
                file_name = file_field.name.split('/')[-1]
                
                # Get URL (Handles S3 or Local Media)
                file_url = file_field.url if hasattr(file_field, 'url') else f"/media/{file_field.name}"
                
                # Get file size safely
                try:
                    file_size = file_field.size
                except (OSError, ValueError):
                    file_size = 0
                
                return {
                    "fileName": file_name,
                    "fileUrl": file_url,
                    "fileSize": file_size,
                    "fileType": default_mime_type
                }
        except Exception:
            pass
            
        return {
            "fileName": None,
            "fileUrl": None,
            "fileSize": None,
            "fileType": default_mime_type
        }


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
    multipleAnswers = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    totalPoints = serializers.SerializerMethodField()
    class Meta:
        model = Question
        fields = ['questionId','text','image','multipleAnswers']

    def get_multipleAnswers(self,obj):
        return "true" if obj.questionTypes == 'multiple' else "false"

    def get_totalPoints(self, obj):
        """Count number of correct options (each = 1 point)"""
        return obj.options.filter(is_correct=True).count()
    
    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

class BaseQuizSerializer(serializers.ModelSerializer):
    """
    Base serializer for Quiz model. Provides common fields for all quiz serializers
    """
    quizId = serializers.CharField(read_only = True)
    course = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'course', 'time', ]
    
    def get_course(self, obj):
            return obj.courseCode.code
    
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
        fields = BaseQuestionSerializer.Meta.fields + ['options']

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
        fields = BaseQuestionSerializer.Meta.fields + ['options']

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
    id = serializers.CharField(source='optionId', required=False)

    is_correct = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct']

    def validate(self, data):
        if not data.get('text'):
            raise serializers.ValidationError("Option Text is required")
        return data

class QuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating questions within a quiz"""
    multipleAnswers = serializers.CharField(write_only=True, required=False)
    options = OptionCreateSerializer(many=True)

    class Meta:
        model = Question
        fields = ['questionId', 'text', 'multipleAnswers', 'image', 'options']

    def validate(self, data):
        is_multiple = str(data.pop('multipleAnswers', 'false')).lower()
        question_type = 'multiple' if is_multiple == 'true' else 'single'
        data['questionTypes'] = question_type

        options = data.get('options', [])

        if not data.get('text'):
            raise serializers.ValidationError("Question Text is required")
        
        if question_type in ['single', 'multiple']:
            if not options:
                raise serializers.ValidationError("Multiple choice question must have options")
            if len(options) < 2:
                raise serializers.ValidationError("Multiple choice must have at least 2 options")
        
        # Check correct options (Now relying purely on the boolean flag)
        correctCount = sum(1 for opt in options if opt.get('is_correct'))
        
        if correctCount == 0:
            snippet = str(data.get('text'))[:30]
            raise serializers.ValidationError(f"At least one option must be marked as correct. (Failed on: '{snippet}...')")
            
        if question_type == 'single' and correctCount > 1:
            raise serializers.ValidationError("Single answer questions can only have one correct option")
        
        return data

class QuizCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a complete quiz with questions and options"""
    quizId = serializers.CharField(read_only=True)
    questions = QuestionCreateSerializer(many=True)
    
    course = serializers.SlugRelatedField(
        source='courseCode',
        slug_field='code',
        queryset=Course.objects.all(),
        write_only=True
    ) 
    
    time = serializers.CharField(write_only=True, required=False)
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=Quiz.STATUS_CHOICES, default='draft', required=False)

    class Meta:
        model = Quiz
        fields = ['quizId', 'title', 'course', 'time', 'questions', 'start_time', 'description', 'status']

    def create(self, validated_data):
        questionsData = validated_data.pop('questions', [])
        
        time_str = validated_data.pop('time', '15')
        try:
            validated_data['timeLimitMinutes'] = int(str(time_str).replace('m', '').strip())
        except ValueError:
            validated_data['timeLimitMinutes'] = 15

        courseCode = validated_data.pop('courseCode', None)
        start_time = validated_data.pop('start_time', None) 
        status = validated_data.pop('status', 'draft') 
        
        quiz = Quiz.objects.create(
            courseCode=courseCode,
            status='draft',
            start_time=start_time,
            **validated_data
        )
        
        for q_index, qData in enumerate(questionsData, start=1):
            options_data = qData.pop('options', [])
            qData['order'] = q_index 
            
            question = Question.objects.create(quiz=quiz, **qData)
            
            for opt_index, option_data in enumerate(options_data, start=1):
                option_data['order'] = opt_index 
                Option.objects.create(question=question, **option_data)
    
        return quiz

    def update(self, instance, validated_data):
        """Update quiz by replacing all questions and options"""
        questions_data = validated_data.pop('questions', [])
        
        # Update Quiz fields
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        
        # Handle time field
        if 'time' in validated_data:
            time_str = validated_data['time']
            try:
                instance.timeLimitMinutes = int(str(time_str).replace('m', '').strip())
            except ValueError:
                instance.timeLimitMinutes = 15
        
        # Handle status and start_time
        if 'status' in validated_data:
            instance.status = validated_data['status']
        if 'start_time' in validated_data:
            instance.start_time = validated_data['start_time']
        
        instance.save()
        
        # Delete all existing questions (cascades to options)
        instance.questions.all().delete()
        
        # Create new questions with options
        for q_index, q_data in enumerate(questions_data, start=1):
            options_data = q_data.pop('options', [])
            q_data['order'] = q_index
            
            # Remove id if present (since we're creating new)
            q_data.pop('id', None)
            
            question = Question.objects.create(quiz=instance, **q_data)
            
            for opt_index, opt_data in enumerate(options_data, start=1):
                opt_data['order'] = opt_index
                opt_data.pop('id', None)  # Remove id for new options
                Option.objects.create(question=question, **opt_data)
        
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

    title = serializers.CharField(source = 'name')
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
    
    def get_week_items(self, week):
        items = []

        # Helper function to safely check file size without crashing
        def get_safe_file_size(file_obj):
            try:
                if file_obj and file_obj.storage.exists(file_obj.name):
                    return round(file_obj.size / (1024 * 1024), 2)
            except Exception:
                pass
            return 0

        # 1. Videos
        videos = week.video_set.all()
        if videos:
            for video in videos:
                items.append({
                    "type": "content",
                    "title": video.title,
                    "format": "Video",
                    "fileUrl": video.file.url if video.file else None,
                    "fileSize": get_safe_file_size(video.file),
                    "description": video.description
                })
        else:
            items.append({
                "type": None, "title": None, "format": None,
                "fileUrl": None, "fileSize": None, "description": None
            })

        # 2. PDFs
        pdfs = week.pdf_set.all()
        if pdfs:
            for pdf in pdfs:
                items.append({
                    "type": "content",
                    "title": pdf.title,
                    "format": "PDF",
                    "fileUrl": pdf.file.url if pdf.file else None,
                    "fileSize": get_safe_file_size(pdf.file),
                    "description": pdf.description
                })
        else:
            items.append({
                "type": None, "title": None, "format": None,
                "fileUrl": None, "fileSize": None, "description": None
            })

        # 3. Links
        links = week.link_set.all()
        if links:
            for link in links:
                items.append({
                    "type": "content",
                    "title": link.title,
                    "format": "Link",
                    "fileUrl": link.link_url,
                    "fileSize": None, 
                    "description": link.description
                })
        else:
            items.append({
                "type": None, "title": None, "format": None,
                "fileUrl": None, "fileSize": None, "description": None
            })

        # 4. Quizzes
        request = self.context.get('request')
        quizzes = week.quizzes.all()

        if request and getattr(request.user, 'role', None) == 'student':
            quizzes = quizzes.filter(status__in=['scheduled', 'active'])
        
        if quizzes:
            for quiz in quizzes:
                items.append({
                    'type': 'quiz',
                    'title': quiz.title,
                    'quizId': quiz.id,
                    'duration': f"{quiz.timeLimitMinutes} min",
                    'questionsCount': quiz.questions.count(),
                    'description': getattr(quiz, 'description', '')
                })
        else:
            items.append({
                'type': None, 'title': None, 'quizId': None,
                'duration': None, 'questionsCount': None, 'description': None
            })

        # 5. Announcements
        announcements = week.announcements.all()
        if announcements:
            for announcement in announcements:
                items.append({
                    'type': 'announcement',
                    'title': announcement.content[:50],
                    'message': announcement.content,
                    'date': announcement.created_at.strftime('%Y-%m-%d')
                })
        else:
            items.append({
                'type': None, 'title': None, 'quizId': None, 
                'duration': None, 'questionsCount': None, 'description': None
            })

        return items
    
class WeekSerializer(serializers.ModelSerializer):
    """
    Serializer for Week model - includes all related content. Dynamically loads videos, PDFs, links, announcements, and quizzes
    """

    videos = serializers.SerializerMethodField()
    pdfs = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()
    announcements = AnnouncementSerializer(many = True)
    quizzes = serializers.SerializerMethodField()
    class Meta:
        model = Week
        fields = ['id', 'topic', 'description', 'created_at', 'videos', 'pdfs', 'links','quizzes','announcements']
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
    
class AcademicCalendarSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = AcademicCalendar
        fields = [
            'id', 'year', 'semester', 'faculty', 'pdf', 'pdf_url',
            'uploaded_at', 'uploaded_by_name'
        ]
        read_only_fields = ['uploaded_at', 'uploaded_by']

    def get_pdf_url(self, obj):
        return obj.pdf.url if obj.pdf else None

    def validate_pdf(self, value):
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must be under 10 MB.")
        return value
    
class PracticalTimetableSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = PracticalTimetable
        fields = [
            'id', 'year', 'semester', 'faculty', 'title',
            'pdf', 'pdf_url', 'uploaded_at', 'uploaded_by_name'
        ]
        read_only_fields = ['uploaded_at', 'uploaded_by']

    def get_pdf_url(self, obj):
        return obj.pdf.url if obj.pdf else None

    def validate_pdf(self, value):
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must be under 10 MB.")
        return value

class ContentUploadSerializer(serializers.Serializer):
    """Handles initial validation of incoming multipart/form-data"""
    week_order = serializers.IntegerField(required=True)
    title = serializers.CharField(required=True)
    content = serializers.CharField(required=True) # Maps to model's description
    attachment = serializers.FileField(required=False, allow_null=True)
    link = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        attachment = data.get('attachment')
        link = data.get('link')
        
        # Ensure at least one is provided
        if not attachment and not link:
            raise serializers.ValidationError("You must provide either an attachment or a link.")
        
        # Optional: Prevent providing both at the same time
        if attachment and link:
            raise serializers.ValidationError("Please provide either an attachment or a link, not both.")
            
        return data
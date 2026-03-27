from django.shortcuts import render,get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser
from users.permissions import *
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response 
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
from lms.models import *
from .models import *
from .serializers import *
import json
from django.db import transaction
from users.profiles import StudentProfile
from rest_framework.views import APIView

# Create your views here.
class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for courses
    GET  /cms/courses/               → List all courses I'm assigned to
    GET  /cms/courses/1/dashboard/   → Complete dashboard for course ID 1 (with all weeks)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'course_announcements':
            return AnnouncementSerializer
        elif self.action == 'dashboard':
            return courseDashboardSerializer
        return courseListSerializer

    def get_queryset(self):
        """
        Filter courses based on user role
        - Instructors see courses they teach
        - Students see courses they're enrolled in
        """
        user = self.request.user

        if user.role == 'instructor':
            return Course.objects.filter(instructor = user)
        elif user.role == 'student':
            return Course.objects.filter(
                enrollments__student=user,  # Note: enrollments__student (singular)
                enrollments__status='enrolled'
            ).distinct()
        elif user.role == 'admin':
            return Course.objects.all()
            
        return Course.objects.none()
    
    def list(self,request,*args,**kwargs):
        """
        Custom list method to format response exactly as frontend expects
        """
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)
        courses = []
        
        for course in queryset:
            courses.append({
                'id': course.id,
                'code':course.code,
                'title':course.name,
                'color':course.color,
            })

        return Response(courses)
    
    def get_announcements(self,course,user):
        """Get batch and course announcements for this course"""
        announcements = []
        batch_announcements = []
        if course.batch:
            batch_announcements = Announcement.objects.filter(batch=course.batch,announcement_type='batch'
            ).order_by('-created_at')[:3]

        for ann in batch_announcements:
            announcements.append({
                'id' : ann.id,
                'title': ann.title,
                'content': ann.content[:100] if len(ann.content) > 100 else ann.content,
                'type':'batch',
                'created_at':ann.created_at,
                'created_by':ann.created_by.username if ann.created_by else None
            })

        course_announcements = Announcement.objects.filter(course = course,announcement_type = 'course').order_by('-created_at')[:3]

        for ann in course_announcements:
            announcements.append({
                'id' : ann.id,
                'title': ann.title,
                'content': ann.content[:100] if len(ann.content) > 100 else ann.content,
                'type':'course',
                'created_at':ann.created_at,
                'created_by':ann.created_by.username if ann.created_by else None
            })

            announcements.sort(key=lambda x: x['created_at'], reverse=True)
        return announcements[:3]
    
    @action(detail = True, methods =['get'],url_path='dashboard')
    def dashboard(self,request,pk = None):
        """
        Returns complete course dashboard with weeks, content, quizzes, and announcements
        """

        course= self.get_object()

        if request.user.role == 'student':
            if not course.enrollments.filter(
                student=request.user,
                status='enrolled'
            ).exists():
                return Response({'error': 'Not enrolled in this course'}, status=403)
        elif request.user.role == 'instructor':
            if request.user != course.instructor:
                return Response({'error': 'Not your Course'},status=403)

        serializer = self.get_serializer(course,context = {'request':request})
        return Response(serializer.data)  

    @action(detail=True, methods=['post'], url_path='dashboard/add_week')
    def add_week(self, request, pk=None):
        course = self.get_object()
        
        # 1. Standard permissions
        if request.user.role != 'instructor' or request.user != course.instructor:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Just create the object. The Model handles the 'order' field automatically!
        week = Week.objects.create(
            course=course,
            topic=request.data.get('topic'),
            description=request.data.get('description', '')
        )

        return Response({
            'Message': 'Week Added Successfully',
            'week': week.order,
            'Topic': week.topic # This will be 1, 2, 3... automatically
        }, status=status.HTTP_201_CREATED)  

    # Inside CourseViewSet
    @action(detail=True, methods=['get', 'post'], url_path='announcements')
    def course_announcements(self, request, pk=None):
        course = self.get_object()
        
        if request.method == 'GET':
            # Shows both general course announcements AND week-specific ones for this course
            queryset = Announcement.objects.filter(course=course,week__isnull = False).order_by('-created_at')
            serializer = AnnouncementSerializer(queryset, many=True, context={'request': request, 'view': self})
            return Response(serializer.data)

        if request.method == 'POST':
            serializer = AnnouncementSerializer(data=request.data, context={'request': request, 'view': self})
            if serializer.is_valid():
                # FIXED: Navigate the chain here just like in perform_create
                target_faculty = None
                if course.department:
                    target_faculty = course.department.faculty

                serializer.save(
                    created_by=request.user,
                    course=course,
                    faculty=target_faculty,
                    batch=course.batch  # Auto-fill from Course 10
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Quiz operations
    Supports nested URLs: /courses/{course_id}/weeks/{week_number}/quizzes/
    """
    queryset = Quiz.objects.all()
    
    #accept both normal JSON and FormData
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuizCreateSerializer
        elif self.action in ['update','partial_update']:
            return QuizCreateSerializer
        elif self.action in ['retrieve']:
            user = self.request.user
            if hasattr(user, 'role'):
                if user.role == 'student':
                    return StudentQuizSerializer
                elif user.role in ['instructor', 'admin']:
                    return InstructorQuizSerializer
            return StudentQuizSerializer
        return StudentQuizSerializer
    
    def get_permissions(self):
        # Write operations (create, update, delete)
        if self.action in ['create', 'update', 'partial_update', 'destroy',]:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['submit']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def retrieve(self,request,*args,**kwargs):
        quiz = self.get_object()
        serializer = self.get_serializer(quiz)
        return Response(serializer.data)
    
    # Handle the FormData mapping for Creation
    def create(self, request, *args, **kwargs):
        """Create quiz - handles stringified JSON + Images from FormData"""
        
        # Check if the data is coming in as FormData ('quiz_data' string)
        if 'quiz_data' in request.data:
            try:
                quiz_data = json.loads(request.data.get('quiz_data'))
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON format in quiz_data"}, status=status.HTTP_400_BAD_REQUEST)

            # Map the files to the correct questions
            questions = quiz_data.get('questions', [])
            for index, question in enumerate(questions):
                image_key = f'image_{index}'
                if image_key in request.FILES:
                    question['image'] = request.FILES[image_key]
        else:
            quiz_data = request.data

        # Pass context so absolute Image URLs are generated
        serializer = self.get_serializer(data=quiz_data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        
        return Response({
            'id': quiz.id,
            'quizId': quiz.quizId,
            'message': 'Quiz created successfully'
        }, status=status.HTTP_201_CREATED)
    
    # Handle the FormData mapping for Updates
    def update(self, request, pk=None, *args, **kwargs):
        """Update quiz - handles stringified JSON + Images from FormData"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if 'quiz_data' in request.data:
            try:
                quiz_data = json.loads(request.data.get('quiz_data'))
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON format in quiz_data"}, status=status.HTTP_400_BAD_REQUEST)

            questions = quiz_data.get('questions', [])
            for index, question in enumerate(questions):
                image_key = f'image_{index}'
                if image_key in request.FILES:
                    question['image'] = request.FILES[image_key]
        else:
            quiz_data = request.data

        serializer = self.get_serializer(instance, data=quiz_data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'id': instance.id,
            'quizId': instance.quizId,
            'message': 'Quiz updated successfully'
        }, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        quiz = self.get_object()

        # Check if already attempted
        alreadyAttempt = QuizAttempt.objects.filter(
            student=request.user,
            quiz=quiz,
            endAt__isnull=False
        ).first()

        if alreadyAttempt:
            return Response({'error': 'You have already attempted this quiz.'},
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Create attempt
        attempt = QuizAttempt.objects.create(
            student=request.user,
            quiz=quiz,
            startedAt=timezone.now()
        )

        answerData = request.data.get('answers', [])
        
        # Calculate total possible points (sum of all correct options)
        total_points = 0
        for question in quiz.questions.all():
            total_points += question.options.filter(is_correct=True).count()
        
        earned_points = 0

        for ans in answerData:
            try:
                question = Question.objects.get(id=ans['questionId'])
            except Question.DoesNotExist:
                continue

            studentAnswer = StudentAnswer.objects.create(
                attempt=attempt,
                question=question,
                textAnswer=ans.get('textAnswer', '')
            )
            
            points_earned = 0

            if 'selectedOptions' in ans and ans['selectedOptions']:
                selected_options = Option.objects.filter(optionId__in=ans['selectedOptions'])
                studentAnswer.selectedOptions.set(selected_options)

                # Count how many selected options are correct
                correct_selected = selected_options.filter(is_correct=True)
                points_earned = correct_selected.count()
                earned_points += points_earned
                
                # Check if all correct options were selected
                total_correct = question.options.filter(is_correct=True).count()
                if points_earned == total_correct and selected_options.count() == total_correct:
                    studentAnswer.isCorrect = True
                
                studentAnswer.points_earned = points_earned
                studentAnswer.save()

        # Calculate final score
        if total_points > 0:
            final_score = (earned_points / total_points) * 100
        else:
            final_score = 0
        
        attempt.endAt = timezone.now()
        attempt.score = final_score
        attempt.save()
        
        return Response({
            'message': 'Quiz submitted successfully',
            'score': round(final_score, 2),
            'points_earned': earned_points,
            'total_points': total_points,
            'percentage': f"{round(final_score, 1)}%"
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def draft_quizzes(self, request):
        """Get all draft quizzes (not assigned to any week)"""
        if request.user.role != 'instructor':
            return Response(
            {'error': 'Only instructors can access quizzes'}, 
            status=status.HTTP_403_FORBIDDEN
        )
        drafts = Quiz.objects.filter(
            courseCode__instructor = request.user,
            status='draft',
            week__isnull=True  # Not assigned to any week
        )
        quizzes = []
        for q in drafts:
            quizzes.append({
                'quizId': q.id,
                'title': q.title,
                'course': q.courseCode.code,
                'time': q.timeLimitMinutes,
                'createdAt': q.created_at,
            })
        return Response(quizzes)
    
    @action(detail=True, methods=['post'])
    def add_to_week(self, request, pk=None):
        """Add existing quiz to a week (update only provided fields)"""
        quiz = self.get_object()
        
        # Get week ID
        week_order = request.data.get('week_id')
        if not week_order:
            return Response({'error': 'week_id required'}, status=400)
        
        # Validate week
        try:
            week = Week.objects.get(course = quiz.courseCode,order=week_order)
        except Week.DoesNotExist:
            return Response({'error': f'Week {week_order} not found'}, status=404)
        
        quiz.week = week
        
        # Update ONLY if field is provided (not None)
        if 'title' in request.data:
            quiz.title = request.data['title']
        
        if 'timeLimit' in request.data:
            quiz.timeLimitMinutes = request.data['timeLimit']
        
        if 'start_time' in request.data and request.data['start_time']:
            try:
                start_datetime = datetime.fromisoformat(request.data['start_time'].replace('Z', '+00:00'))
                quiz.start_time = start_datetime
                quiz.status = 'scheduled'
            except ValueError:
                return Response({'error': 'Invalid start_time format'}, status=400)
        
        quiz.save()
        
        return Response({
            'quizId': quiz.id,
            'title': quiz.title,
            'time': quiz.timeLimitMinutes,
            'start_time': quiz.start_time,
            'status': quiz.status,
            'week': {
                'id':week.id,
                'order': week.order,
                'topic': week.topic
            },
            'message': f'Quiz added to Week {week.order}'
        })
    
class QuestionViewSet(viewsets.ModelViewSet):
    """
    - Manage Questions
    """

    queryset = Question.objects.all()
    
    def get_permissions(self):
        """Simple permission control"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsInstructorUser]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Different serializers for different roles"""
        if self.request.user.role == 'student':
            return StudentQuestionSerializer
        elif self.request.user.role in ['instructor', 'admin']:
            return InstructorQuestionSerializer
        return StudentQuestionSerializer
    
    def get_queryset(self):
        queryset = Question.objects.all()
        quiz_id = self.request.query_params.get('quiz', None)
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset.order_by('order')

class OptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing options"""
    queryset = Option.objects.all()

   
    def get_serializer_class(self):
        """Different serializers for different roles"""
        if self.request.user.role == 'student':
            return StudentOptionSerializer
        elif self.request.user.role in ['instructor', 'admin']:
            return InstructorOptionSerializer
        return StudentOptionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # permission_classes = [IsAuthenticated, IsInstructorUser]
            permission_classes = [permissions.AllowAny]
        else:
            # permission_classes = [IsAuthenticated]
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Option.objects.all()
        question_id = self.request.query_params.get('question',None)

        if question_id:
            queryset = queryset.filter(question_id = question_id)
        return queryset.order_by('order')
    
class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = quizAttemptSerializer

    def get_queryset(self):
        if self.request.user.role == 'student':
            return QuizAttempt.objects.filter(student = self.request.user)
        
        return QuizAttempt.objects.all()

class StudentAnswerViewSet(viewsets.ModelViewSet):
    queryset = StudentAnswer.objects.all()
    serializer_class = studentAnswerSerializer

    def get_queryset(self):
        if self.request.user.role == 'student':
            return StudentAnswer.objects.filter(attempt__student = self.request.user)
        
        return StudentAnswer.objects.all()

class WeekViewSet(viewsets.ModelViewSet):
    """ViewSet for managing weeks and their content"""
    queryset = Week.objects.all()
    serializer_class = WeekSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        return super().get_serializer_class()
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['upload_video', 'upload_pdf', 'add_link', 'delete_content']:
            # Only instructors can upload content
            permission_classes = [IsAuthenticated, IsInstructorUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter weeks by course if course_id provided"""
        queryset = Week.objects.all()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset.order_by('order')
        
    @action(detail=True, methods=['get'])
    def content(self, request, pk=None):
        """Get all content for a week"""
        week = self.get_object()
        
        return Response({
            'week': {
                'id': week.id,
                'order': week.order,
                'topic': week.topic,
                'description': week.description
            },
            'videos': videoSerializer(week.video_set.all(), many=True).data,
            'pdfs': pdfSerializer(week.pdf_set.all(), many=True).data,
            'links': LinkSerializer(week.link_set.all(), many=True).data
        }) 

class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    Manage announcements for batch, course, or week
    Manage announcements targeted at faculty, batches, and modules.
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsInstructorUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
    # 1. Try to get course_id from URL (e.g., /cms/courses/10/announcements/)
        course_id = self.kwargs.get('pk')
        
        if course_id:
            try:
                # We import here to avoid circular imports
                course = Course.objects.select_related('department__faculty', 'batch').get(id=course_id)
                
                # 2. Correct Chain: Course -> Department -> Faculty
                # Your model says: Course has a 'department', Department has a 'faculty'
                target_faculty = None
                if course.department:
                    target_faculty = course.department.faculty
                
                # 3. Save with all auto-detected data
                serializer.save(
                    created_by=self.request.user,
                    course=course,
                    faculty=target_faculty,
                    batch=course.batch  # Auto-assign batch since Course has a batch field
                )
            except Course.DoesNotExist:
                serializer.save(created_by=self.request.user)
        else:
            # Standard logic for general announcements (Endpoint A)
            serializer.save(created_by=self.request.user)

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'student':
            # Get student's attributes (Adjust field names to match your actual Student/User model)
            student_faculty = getattr(user, 'faculty', None) 
            student_batch = getattr(user, 'batch', None)
            
            # Get enrolled courses/modules
            enrolled_courses = Course.objects.filter(
                enrollments__student=user, 
                enrollments__status='enrolled'
            )
            
            # Intersection Logic: 
            # If an announcement specifies a target, the student MUST match that target.
            # If a target is NULL, it doesn't restrict the announcement.
            faculty_q = Q(faculty__isnull=True) | Q(faculty=student_faculty)
            batch_q = Q(batch__isnull=True) | Q(batch=student_batch)
            course_q = Q(module__isnull=True) | Q(module__in=enrolled_courses)
            
            # Combine queries with AND to create the intersection behavior
            return Announcement.objects.filter(faculty_q & batch_q & course_q).distinct()
        
        elif user.role == 'instructor':
            # Instructors see announcements they created OR announcements for their assigned modules
            taught_courses = user.courses_taught.all()
            
            return Announcement.objects.filter(
                Q(created_by=user) | Q(course__in=taught_courses)
            ).distinct()
            
        return Announcement.objects.none()
    
class AcademicCalendarViewSet(viewsets.ModelViewSet):
    """
    ViewSet for academic calendar PDFs.
    - Admin: full CRUD.
    - Students & Instructors: read‑only (list, retrieve).
    """
    queryset = AcademicCalendar.objects.all()
    serializer_class = AcademicCalendarSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class PracticalTimetableViewSet(viewsets.ModelViewSet):
    queryset = PracticalTimetable.objects.all()
    serializer_class = PracticalTimetableSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class CourseContentViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = ContentUploadSerializer
    
    def get_queryset(self):
        # Satisfies ModelViewSet internals, though unused for create()
        return Week.objects.none() 

    def create(self, request, *args, **kwargs):
        # 1. Course Handling: Extract course_id from URL kwargs
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, id=course_id)

        # Validate incoming frontend data
        init_serializer = self.get_serializer(data=request.data)
        init_serializer.is_valid(raise_exception=True)
        valid_data = init_serializer.validated_data
        
        # Get the related Week
        week_order = valid_data['week_order']
        week = get_object_or_404(Week, course=course, order=week_order)

        # Prepare base fields to pass to your specific model serializers
        model_data = {
            'title': valid_data['title'],
            'description': valid_data['content'], # Mapping frontend 'content' to model 'description'
        }

        attachment = valid_data.get('attachment')
        link = valid_data.get('link')

        # 2. Attachment Handling & Dispatching
        if attachment:
            file_name = attachment.name.lower()
            model_data['file'] = attachment
            
            if file_name.endswith('.pdf'):
                target_serializer_class = pdfSerializer
            elif file_name.endswith('.mp4'):
                target_serializer_class = videoSerializer
            else:
                return Response(
                    {"attachment": ["Unsupported file type. Only .pdf and .mp4 are allowed."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        elif link:
            model_data['link_url'] = link
            target_serializer_class = LinkSerializer

        # 3 & 4. Validation & Saving
        # Initialize your existing specific serializer (which inherently handles format/size validation)
        target_serializer = target_serializer_class(data=model_data)
        target_serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            # Save the target serializer, passing the fetched Week instance
            # Since Content is abstract, creating the child creates the full database record.
            target_serializer.save(week=week)

        return Response(target_serializer.data, status=status.HTTP_201_CREATED)

class FacultyBatchYearsView(APIView):
    """
    Get all faculties with their available batch years
    This endpoint is used to populate the announcement creation form
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        faculties = Faculty.objects.all()
        result = []
        
        for faculty in faculties:
            # Get all batches from departments in this faculty
            batches = Batch.objects.filter(
                department__faculty=faculty
            ).values('year').distinct().order_by('-year')
            
            batch_years = [batch['year'] for batch in batches]
            
            result.append({
                'faculty_id': faculty.id,
                'faculty_name': faculty.name,
                'faculty_code': faculty.code,
                'batch_years': batch_years
            })
        
        return Response(result)

class GlobalAnnouncementListView(generics.ListCreateAPIView):
    """
    List and create global announcements
    """
    serializer_class = GlobalAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = GlobalAnnouncement.objects.all()
        
        # Filter by active status if specified
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by target type
        target_type = self.request.query_params.get('target_type')
        if target_type:
            queryset = queryset.filter(target_type=target_type)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save()

class GlobalAnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a global announcement
    """
    queryset = GlobalAnnouncement.objects.all()
    serializer_class = GlobalAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

class StudentAnnouncementListView(generics.ListAPIView):
    """
    Get all announcements visible to the current student user
    This endpoint is used by students to view their announcements
    """
    serializer_class = StudentAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Check if user has a student profile
        if not hasattr(user, 'student_profile'):
            return GlobalAnnouncement.objects.none()
        
        student_profile = user.student_profile
        queryset = GlobalAnnouncement.objects.filter(
            is_active=True,
            publish_from__lte=timezone.now()
        )
        
        # Filter by publish_until if set
        queryset = queryset.filter(
            Q(publish_until__isnull=True) | Q(publish_until__gte=timezone.now())
        )
        
        # Filter announcements that are visible to this student
        visible_announcements = []
        for announcement in queryset:
            if announcement.is_visible_to_student(student_profile):
                visible_announcements.append(announcement.id)
        
        return GlobalAnnouncement.objects.filter(id__in=visible_announcements)

class BulkAnnouncementCreateView(APIView):
    """
    Create announcements for multiple targets at once
    This endpoint allows sending the same announcement to multiple faculties/batches/departments
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        data = request.data
        targets = data.get('targets', [])
        announcement_data = {
            'title': data.get('title'),
            'content': data.get('content'),
            'pdf_file': request.FILES.get('pdf_file'),
            'created_by': request.user,
            'is_active': data.get('is_active', True),
            'publish_from': data.get('publish_from', timezone.now()),
            'publish_until': data.get('publish_until'),
        }
        
        created_announcements = []
        errors = []
        
        for target in targets:
            try:
                # Validate target data
                target_serializer = AnnouncementTargetSerializer(data=target)
                if not target_serializer.is_valid():
                    errors.append({
                        'target': target,
                        'errors': target_serializer.errors
                    })
                    continue
                
                # Create announcement for this target
                announcement = GlobalAnnouncement.objects.create(
                    **announcement_data,
                    target_type=target['target_type']
                )
                
                # Add relationships based on target type
                if target['target_type'] == 'faculty':
                    announcement.faculties.set(target.get('faculty_ids', []))
                elif target['target_type'] == 'department':
                    announcement.departments.set(target.get('department_ids', []))
                elif target['target_type'] == 'batch':
                    announcement.batches.set(target.get('batch_ids', []))
                elif target['target_type'] == 'program':
                    announcement.programs.set(target.get('program_ids', []))
                
                created_announcements.append(GlobalAnnouncementSerializer(announcement).data)
                
            except Exception as e:
                errors.append({
                    'target': target,
                    'error': str(e)
                })
        
        return Response({
            'created_announcements': created_announcements,
            'errors': errors,
            'total_created': len(created_announcements),
            'total_errors': len(errors)
        }, status=status.HTTP_201_CREATED if created_announcements else status.HTTP_400_BAD_REQUEST)
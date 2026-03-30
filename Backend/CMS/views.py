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
from rest_framework.views import APIView, PermissionDenied
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
            return Course.objects.filter(instructors = user)
        elif user.role == 'student':
            return Course.objects.filter(
                enrollments__student=user,  
                enrollments__status='enrolled'
            ).distinct()
        elif user.role == 'admin':
            return Course.objects.all()
            
        return Course.objects.none()
    
    def list(self,request,*args,**kwargs):
        """
        List of courses that user is assigned
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
    
    @action(detail=True, methods=['get'], url_path='course_quizzes')
    def course_quizzes(self, request, pk=None):
        """Get quizzes for courses"""

        course = self.get_object()

        if request.user.role == 'student':
        # Check if student is enrolled
            if not course.enrollments.filter(student=request.user, status='enrolled').exists():
                return Response(
                    {'error': 'Not enrolled in this course'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
                
        elif request.user.role == 'instructor':
        # ✅ THE FIX: Check if the user exists in the instructors list
            if not course.instructors.filter(id=request.user.id).exists():
                return Response(
                    {'error': 'Not your course'}, 
                    status=status.HTTP_403_FORBIDDEN
                    )
        else:
            return Response(
                {'error': 'Unauthorized'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        
        all_quizzes = Quiz.objects.filter(
        courseCode=course
    ).select_related('week', 'courseCode').prefetch_related('questions').order_by('-created_at')
        
        quizzes = []
        for q in all_quizzes:
            quizzes.append({
                'quizId': q.id,
                'title': q.title,
                'course': q.courseCode.code,
                'time': q.timeLimitMinutes,
                'createdAt': q.created_at,
            })
        return Response(quizzes)
    
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
            if not course.instructors.filter(id=request.user.id).exists():  
                return Response({'error': 'Not your Course'},status=403)

        serializer = self.get_serializer(course,context = {'request':request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='dashboard/add_week')
    def add_week(self, request, pk=None):
        course = self.get_object()
        
        if request.user.role != 'instructor' or not course.instructors.filter(id=request.user.id).exists():
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        week = Week.objects.create(
            course=course,
            topic=request.data.get('topic'),
            description=request.data.get('description', '')
        )

        return Response({
            'Message': 'Week Added Successfully',
            'week': week.order,
            'Topic': week.topic 
        }, status=status.HTTP_201_CREATED)  

    @action(detail=True, methods=['get', 'post'], url_path='announcements')
    def course_announcements(self, request, pk=None):
        course = self.get_object()
        
        if request.method == 'GET':
            # Shows week-specific ones for this course
            queryset = Announcement.objects.filter(course=course,week__isnull = False).order_by('-created_at')
            serializer = AnnouncementSerializer(queryset, many=True, context={'request': request, 'view': self})
            return Response(serializer.data)

        if request.method == 'POST':
            serializer = AnnouncementSerializer(data=request.data, context={'request': request, 'view': self})
            if serializer.is_valid():
                target_faculty = None
                if course.department:
                    target_faculty = course.department.faculty

                serializer.save(
                    created_by=request.user,
                    course=course,
                    faculty=target_faculty,
                    batch=course.batch 
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Quiz operations
    Supports nested URLs: /courses/{course_id}/weeks/{week_number}/quizzes/
    """
    queryset = Quiz.objects.all()
    
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
    
    
    def update(self, request, *args, **kwargs):
        """
        Intercepts the PUT/PATCH request, unpacks the FormData, 
        maps the images, and passes it to the Serializer.
        """
        partial = kwargs.pop('partial', False) 
        instance = self.get_object()

        if 'quiz_data' in request.data:
            try:
                quiz_data = json.loads(request.data.get('quiz_data'))
            except json.JSONDecodeError:
                return Response(
                    {"error": "Invalid JSON format in quiz_data"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            #  Map the uploaded images to their corresponding questions
            questions = quiz_data.get('questions', [])
            for index, question in enumerate(questions):
                image_key = f'image_{index}'
                
                # If the user uploaded a NEW image for this question, attach it
                if image_key in request.FILES:
                    question['image'] = request.FILES[image_key]
                else:
                    # If they didn't upload a new image, remove the 'image' key 
                    # so the serializer doesn't accidentally wipe out the old image.
                    question.pop('image', None)
        else:
            # Fallback just in case you send standard JSON from Postman
            quiz_data = request.data.copy() if hasattr(request.data, 'copy') else request.data

        # 3. Hand the clean data over to your QuizCreateSerializer
        serializer = self.get_serializer(
            instance, 
            data=quiz_data, 
            partial=partial, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # 4. Return success to the frontend
        return Response({
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
        
        # Calculate total possible points (each question = 1 point)
        total_points = quiz.questions.count()
        earned_points = 0

        for ans in answerData:
            try:
                question = quiz.questions.filter(order=ans['questionId']).first()
            except Question.DoesNotExist:
                continue

            studentAnswer = StudentAnswer.objects.create(
                attempt=attempt,
                question=question,
                textAnswer=ans.get('textAnswer', '')
            )
            
            points_earned = 0

            if 'selectedOptions' in ans and ans['selectedOptions']:
                # Filter options that belong to this question
                selected_options = Option.objects.filter(
                    question=question,
                    optionId__in=ans['selectedOptions']
                )
                studentAnswer.selectedOptions.set(selected_options)

                # Get correct options for this question
                correct_options = question.options.filter(is_correct=True)
                total_correct = correct_options.count()

                correct_mark = 1/total_correct
                incorrect_mark = 1/(question.options.count() - total_correct)
                
                # Calculate points for this question
                if total_correct > 0:
                    # Count correct selections
                    correct_selected = selected_options.filter(is_correct=True).count()
                
                    # Count incorrect selections (penalty)
                    incorrect_selected = selected_options.filter(is_correct=False).count()
                    
                    # Calculate score: correct selections minus incorrect selections
                    # Minimum score is 0
                    points_earned = max(0, correct_selected*correct_mark - incorrect_selected*incorrect_mark)
                    
                    earned_points += points_earned
                    
                    # Mark as fully correct if all correct options selected and no incorrect
                    if correct_selected == total_correct and incorrect_selected == 0:
                        studentAnswer.isCorrect = True
                
                studentAnswer.pointsEarned = points_earned
                studentAnswer.save()

        # Calculate final score (percentage)
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
            'points_earned': round(earned_points, 2),
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
        all_quizzes = Quiz.objects.filter(courseCode__instructors=request.user).order_by('-created_at')
        quizzes = []
        for q in all_quizzes:
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
        if request.user.role != 'instructor' or not quiz.courseCode.instructors.filter(id=request.user.id).exists():
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        week_order = request.data.get('week_id')
        if not week_order:
            return Response({'error': 'week_id required'}, status=400)
        
        try:
            week = Week.objects.get(course = quiz.courseCode,order=week_order)
        except Week.DoesNotExist:
            return Response({'error': f'Week {week_order} not found'}, status=404)
        
        quiz.week = week
        
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
            permission_classes = [IsInstructorUser]
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
            permission_classes = [ IsInstructorUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Option.objects.all()
        question_id = self.request.query_params.get('question',None)

        if question_id:
            queryset = queryset.filter(question_id = question_id)

        if self.request.user.role == 'instructor':
            queryset = queryset.filter(question__quiz__courseCode__instructors=self.request.user)
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
            permission_classes = [IsInstructorUser]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorUser]
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

    def get_course(self):
        # Combined: Gets course AND checks if request.user is an instructor for it
        try:
            return self.request.user.courses_taught.get(id=self.kwargs['pk'])
        except Course.DoesNotExist:
            raise PermissionDenied("Not authorized for this course.")

    def get_queryset(self):
        return Announcement.objects.filter(course_id=self.kwargs['pk']).order_by('-created_at')

    def perform_create(self, serializer):
        # We pass the course instance and user directly to save()
        serializer.save(
            created_by=self.request.user, 
            course=self.get_course()
        )
    
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
        return Week.objects.none() 

    def create(self, request, *args, **kwargs):
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, id=course_id)

        if request.user.role != 'instructor' or not course.instructors.filter(id=request.user.id).exists():
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        init_serializer = self.get_serializer(data=request.data)
        init_serializer.is_valid(raise_exception=True)
        valid_data = init_serializer.validated_data
        
        week_order = valid_data['week_order']
        week = get_object_or_404(Week, course=course, order=week_order)

        model_data = {
            'title': valid_data['title'],
            'description': valid_data['content'], 
        }

        attachment = valid_data.get('attachment')
        link = valid_data.get('link')

        #Attachment Handling & Dispatching
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

        target_serializer = target_serializer_class(data=model_data)
        target_serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            target_serializer.save(week=week)

        return Response(target_serializer.data, status=status.HTTP_201_CREATED)

class FacultyBatchYearsView(APIView):
    """
    Get all faculties with their available batch years
    This endpoint is used to populate the announcement creation form
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        faculties = Faculty.objects.all()
        result = []
        
        for faculty in faculties:
            # Get all departments with their batches
            departments_data = []
            departments = faculty.departments.all()
            
            for department in departments:
                batches = Batch.objects.filter(
                    department=department
                ).values('year').distinct().order_by('-year')
                
                batch_years = [str(batch['year']) for batch in batches]  # Convert to string
                
                departments_data.append({
                    'department_id': department.id,
                    'department_name': department.name,
                    'department_code': department.code,
                    'batch_years': batch_years
                })
            
            result.append({
                'faculty_id': faculty.id,
                'faculty_name': faculty.name,
                'faculty_code': faculty.code,
                'departments': departments_data
            })
        
        return Response(result)
    
class GlobalAnnouncementListView(generics.ListCreateAPIView):
    """
    List and create global announcements
    """
    serializer_class = GlobalAnnouncementSerializer
    permission_classes = [IsAdminUser]
    
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
    permission_classes = [IsAuthenticated]

class StudentAnnouncementListView(generics.ListAPIView):
    """
    Get all announcements visible to the current student user
    This endpoint is used by students to view their announcements
    """
    serializer_class = StudentAnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
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
    Supports batch years (string) and department IDs
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def _get_batches_from_faculties(self, faculty_ids):
        """Get all batches from faculties"""
        if not faculty_ids:
            return Batch.objects.none()
        
        return Batch.objects.filter(department__faculty_id__in=faculty_ids)
    
    def _get_batches_from_departments(self, department_ids):
        """Get all batches from departments"""
        if not department_ids:
            return Batch.objects.none()
        
        return Batch.objects.filter(department_id__in=department_ids)
    
    def _get_batches_from_years(self, batch_years):
        """Get all batches matching given years"""
        if not batch_years:
            return Batch.objects.none()
        
        try:
            years = [int(year) for year in batch_years]
        except ValueError:
            return Batch.objects.none()
        
        return Batch.objects.filter(year__in=years)
    
    def _get_batches_from_years_and_departments(self, batch_years, department_ids):
        """Get batches matching both year and department"""
        if not batch_years or not department_ids:
            return Batch.objects.none()
        
        try:
            years = [int(year) for year in batch_years]
        except ValueError:
            return Batch.objects.none()
        
        return Batch.objects.filter(
            year__in=years,
            department_id__in=department_ids
        )
    
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
                    faculty_ids = target.get('faculty_ids', [])
                    announcement.faculties.set(faculty_ids)
                    
                elif target['target_type'] == 'department':
                    department_ids = target.get('department_ids', [])
                    announcement.departments.set(department_ids)
                    
                elif target['target_type'] == 'batch':
                    batch_years = target.get('batch_years', [])
                    department_ids = target.get('department_ids', [])
                    faculty_ids = target.get('faculty_ids', [])
                    
                    if batch_years and department_ids:
                        # Years + Departments
                        batches = self._get_batches_from_years_and_departments(batch_years, department_ids)
                        announcement.batches.set(batches)
                    elif batch_years and faculty_ids:
                        # Years + Faculties
                        departments_from_faculties = Department.objects.filter(
                            faculty_id__in=faculty_ids
                        ).values_list('id', flat=True)
                        batches = self._get_batches_from_years_and_departments(batch_years, departments_from_faculties)
                        announcement.batches.set(batches)
                    elif batch_years:
                        # Only Years
                        batches = self._get_batches_from_years(batch_years)
                        announcement.batches.set(batches)
                    elif department_ids:
                        # Only Departments
                        batches = self._get_batches_from_departments(department_ids)
                        announcement.batches.set(batches)
                    elif faculty_ids:
                        # Only Faculties
                        batches = self._get_batches_from_faculties(faculty_ids)
                        announcement.batches.set(batches)
                        
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

from django.shortcuts import render,get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser
from users.permissions import *
from rest_framework import viewsets, status
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
# Create your views here.
class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for courses
    GET  /cms/courses/               → List all courses I'm assigned to
    GET  /cms/courses/1/dashboard/   → Complete dashboard for course ID 1 (with all weeks)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'dashboard':
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
    
    @action(detail = True, methods = ['get'],url_path='dashboard')
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

class QuizViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Quiz operations
    Supports nested URLs: /courses/{course_id}/weeks/{week_number}/quizzes/
    """
    queryset = Quiz.objects.all()
    
    # 1. ADD THIS: Tell the ViewSet it can accept both normal JSON and FormData
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuizCreateSerializer
        elif self.action in ['update','partial_update']:
            return QuizCreateSerializer
        elif self.action in ['retrieve']:
            user = self.request.user
            # Note: Ensure you handle cases where request.user is AnonymousUser if using AllowAny
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
    
    # 2. UPDATE THIS: Handle the FormData mapping for Creation
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
            # Fallback just in case standard JSON is sent without images
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
    
    # 3. UPDATE THIS: Handle the FormData mapping for Updates
    def update(self, request, pk=None, *args, **kwargs):
        """Update quiz - handles stringified JSON + Images from FormData"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Same logic as create: unpack FormData if it exists
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

        drafts = Quiz.objects.filter(
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
        week_id = request.data.get('week_id')
        if not week_id:
            return Response({'error': 'week_id required'}, status=400)
        
        # Validate week
        try:
            week = Week.objects.get(id=week_id)
        except Week.DoesNotExist:
            return Response({'error': f'Week {week_id} not found'}, status=404)
        
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
                'id': week.id,
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
            # Only instructors can modify questions
            permission_classes = [IsAuthenticated, IsInstructorUser]
            # permission_classes = [permissions.AllowAny]
        else:
            # Anyone authenticated can view
            permission_classes = [IsAuthenticated]
            # permission_classes = [permissions.AllowAny]
        
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
    
    # @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    # def upload_video(self, request, pk=None):
    #     """Upload video to week"""
    #     week = self.get_object()
        
    #     serializer = videoSerializer(data=request.data)
    #     if serializer.is_valid():
    #         video = serializer.save(week=week)
    #         return Response({
    #             'id': video.id,
    #             'title': video.title,
    #             'description': video.description,
    #             'fileUrl': video.file.url,
    #             'fileSize': video.fileSize,
    #             'createdAt': video.created_at,
    #             'message': 'Video uploaded successfully'
    #         }, status=status.HTTP_201_CREATED)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    # def upload_pdf(self, request, pk=None):
    #     """Upload PDF to week"""
    #     week = self.get_object()
        
    #     serializer = pdfSerializer(data=request.data)
    #     if serializer.is_valid():
    #         pdf = serializer.save(week=week)
    #         return Response({
    #             'id': pdf.id,
    #             'title': pdf.title,
    #             'description': pdf.description,
    #             'fileUrl': pdf.file.url,
    #             'fileSize': pdf.fileSize,
    #             'createdAt': pdf.created_at,
    #             'message': 'PDF uploaded successfully'
    #         }, status=status.HTTP_201_CREATED)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # @action(detail=True, methods=['post'])
    # def add_link(self, request, pk=None):
    #     """Add external link to week"""
    #     week = self.get_object()
        
    #     serializer = LinkSerializer(data=request.data)
    #     if serializer.is_valid():
    #         link = serializer.save(week=week)
    #         return Response({
    #             'id': link.id,
    #             'title': link.title,
    #             'description': link.description,
    #             'url': link.link_url,
    #             'createdAt': link.created_at,
    #             'message': 'Link added successfully'
    #         }, status=status.HTTP_201_CREATED)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='dashboard/add_content', parser_classes=[MultiPartParser, FormParser])
    def add_content(self, request, pk=None):
        """
        POST /cms/courses/{course_id}/dashboard/add_content/
        Add content to an existing week - auto-detects content type
        Frontend sends week_number (must be existing week)
        """
        course = self.get_object()
        
        # 1. Check if user is instructor
        if getattr(request.user, 'role', None) != 'instructor' or request.user != course.instructor:
            return Response(
                {'error': 'Only the course instructor can add content'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 2. Get fields from frontend
        week_number = request.data.get('week_number')
        title = request.data.get('title')
        description = request.data.get('description', '')
        
        # 3. Separate physical files from text links
        file_obj = request.FILES.get('attachment')
        link_str = request.data.get('attachment')
        
        # 4. Validate required fields
        if not week_number:
            return Response(
                {'error': 'week_number is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not title:
            return Response(
                {'error': 'title is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not file_obj and not link_str:
            return Response(
                {'error': 'attachment is required (file or URL)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 5. VERIFY WEEK EXISTS - DO NOT CREATE
        try:
            week = Week.objects.get(course=course, order=week_number)
        except Week.DoesNotExist:
            # Return error if week doesn't exist
            return Response(
                {
                    'error': f'Week {week_number} does not exist in this course. Please create the week first.',
                    'available_weeks': list(Week.objects.filter(course=course).values_list('order', flat=True))
                }, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 6. Auto-detect content type and create content
        if file_obj:
            filename = file_obj.name.lower()
            
            # Video content
            if filename.endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm')):
                serializer = videoSerializer(data={
                    'title': title,
                    'description': description,
                    'file': file_obj
                })
                
                if serializer.is_valid():
                    video = serializer.save(week=week)
                    return Response({
                        'id': video.id,
                        'type': 'video',
                        'title': video.title,
                        'description': video.description,
                        'url': video.file.url,
                        'fileSize': video.fileSize,
                        'course': course.code,
                        'week': week_number,
                        'week_topic': week.topic,
                        'created_at': video.created_at,
                        'message': f'Video added successfully to Week {week_number}: {week.topic}'
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # PDF content
            elif filename.endswith('.pdf'):
                serializer = pdfSerializer(data={
                    'title': title,
                    'description': description,
                    'file': file_obj
                })
                
                if serializer.is_valid():
                    pdf = serializer.save(week=week)
                    return Response({
                        'id': pdf.id,
                        'type': 'pdf',
                        'title': pdf.title,
                        'description': pdf.description,
                        'url': pdf.file.url,
                        'fileSize': pdf.fileSize,
                        'course': course.code,
                        'week': week_number,
                        'week_topic': week.topic,
                        'created_at': pdf.created_at,
                        'message': f'PDF added successfully to Week {week_number}: {week.topic}'
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            else:
                return Response(
                    {'error': 'Unsupported file type. Please upload a PDF or video file (MP4, MOV, AVI, MKV, WEBM).'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Link content
        elif isinstance(link_str, str):
            # Validate URL format
            if not link_str.startswith(('http://', 'https://')):
                return Response(
                    {'error': 'URL must start with http:// or https://'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = LinkSerializer(data={
                'title': title,
                'description': description,
                'link_url': link_str
            })
            
            if serializer.is_valid():
                link = serializer.save(week=week)
                return Response({
                    'id': link.id,
                    'type': 'link',
                    'title': link.title,
                    'description': link.description,
                    'url': link.link_url,
                    'course': course.code,
                    'week': week_number,
                    'week_topic': week.topic,
                    'created_at': link.created_at,
                    'message': f'Link added successfully to Week {week_number}: {week.topic}'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response(
                {'error': 'Invalid attachment format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @action(detail=True, methods=['delete'])
    def delete_content(self, request, pk=None):
        """Delete content from week"""
        week = self.get_object()
        content_type = request.data.get('content_type')
        content_id = request.data.get('content_id')
        
        if content_type == 'video':
            try:
                video = Video.objects.get(id=content_id, week=week)
                video.delete()
                return Response({'message': 'Video deleted successfully'}, status=status.HTTP_200_OK)
            except Video.DoesNotExist:
                return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif content_type == 'pdf':
            try:
                pdf = Pdf.objects.get(id=content_id, week=week)
                pdf.delete()
                return Response({'message': 'PDF deleted successfully'}, status=status.HTTP_200_OK)
            except Pdf.DoesNotExist:
                return Response({'error': 'PDF not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif content_type == 'link':
            try:
                link = Link.objects.get(id=content_id, week=week)
                link.delete()
                return Response({'message': 'Link deleted successfully'}, status=status.HTTP_200_OK)
            except Link.DoesNotExist:
                return Response({'error': 'Link not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Invalid content_type. Use video, pdf, or link'}, status=status.HTTP_400_BAD_REQUEST)
        
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
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            permission_classes = [IsAuthenticated, IsInstructorUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'student':
            # Get student's batch from their enrolled courses
            enrolled_courses = Course.objects.filter(enrollments__student=user,enrollments__status='enrolled')
            batches = enrolled_courses.values_list('batch', flat=True).distinct()
            
            # Students see:
            # 1. Batch announcements for their batch
            # 2. Course announcements for courses they're enrolled in
            batch_q = Q(batch__in=batches, announcement_type='batch')
            course_q = Q(course__in=enrolled_courses, announcement_type='course')
            
            return Announcement.objects.filter(batch_q | course_q).distinct()
        
        # Instructors see announcements from their courses and batches
        taught_courses = user.courses_taught.all()
        batches = taught_courses.values_list('batch', flat=True).distinct()
        
        batch_q = Q(batch__in=batches, announcement_type='batch')
        course_q = Q(course__in=taught_courses, announcement_type='course')
        
        return Announcement.objects.filter(batch_q | course_q).distinct()
    
    def perform_create(self, serializer):
        """Create announcement based on type"""
        announcement_type = self.request.data.get('announcement_type', 'course')
        
        if announcement_type == 'batch':
            # Try batch_id first, then batch_name
            batch_id = self.request.data.get('batch')
            
            if  batch_id:
                batch = get_object_or_404(Batch, id = batch_id)
            else:
                raise serializers.ValidationError({"batch": "Batch ID or name required"})
            
            serializer.save(batch=batch, created_by=self.request.user)
        
        elif announcement_type == 'course':
            course_id = self.request.data.get('course')
            if not course_id:
                raise serializers.ValidationError({"course": "Course ID required"})
            course = get_object_or_404(Course, id=course_id)
            serializer.save(course=course, created_by=self.request.user)
        
        elif announcement_type == 'week':
            week_id = self.request.data.get('week')
            if not week_id:
                raise serializers.ValidationError({"week": "Week ID required"})
            week = get_object_or_404(Week, id=week_id)
            serializer.save(week=week, created_by=self.request.user)
        
        else:
            serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_course(self, request):
        """Get announcements for a specific course"""
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id required'}, status=400)
        
        course = get_object_or_404(Course, id=course_id)
        
        # Check access
        if request.user.role == 'student' and request.user not in course.students.all():
            return Response({'error': 'Not enrolled'}, status=403)
        
        # Get batch announcements for this course's batch
        batch_announcements = Announcement.objects.filter(
            batch=course.batch,
            announcement_type='batch'
        )
        
        # Get course announcements
        course_announcements = Announcement.objects.filter(
            course=course,
            announcement_type='course'
        )
        
        all_announcements = (batch_announcements | course_announcements).order_by('-created_at')
        serializer = self.get_serializer(all_announcements, many=True)
        
        return Response({
            'course': {
                'id': course.id,
                'code': course.code,
                'name': course.name,
                'batch': course.batch.name if course.batch else None
            },
            'announcements': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='week/(?P<week_id>[^/.]+)')
    def by_week(self, request, week_id=None):
        """Get announcements for a specific week"""
        week = get_object_or_404(Week, id=week_id)
        
        if request.user.role == 'student' and request.user not in week.course.students.all():
            return Response({'error': 'Not enrolled'}, status=403)
        
        announcements = Announcement.objects.filter(week=week)
        serializer = self.get_serializer(announcements, many=True)
        
        return Response({
            'week': {
                'id': week.id,
                'order': week.order,
                'topic': week.topic
            },
            'announcements': serializer.data
        })
    @action(detail=False, methods=['post'], url_path='courses/(?P<course_id>[^/.]+)/week/(?P<week_number>[^/.]+)/create')
    def create_for_week(self, request, week_number=None,course_id = None):
        """Create announcement for a specific week"""
        course = get_object_or_404(Course, id=course_id)
        week = get_object_or_404(Week, course=course, order=week_number)
        
        if request.user.role != 'instructor':
            return Response({'error': 'Only instructors can create announcements'}, status=403)
        
        if request.user != week.course.instructor:
            return Response({'error': 'Not your course'}, status=403)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            announcement = serializer.save(
                week=week,
                created_by=request.user,
                announcement_type='week'
            )
            return Response(serializer.data, status=201)
        
        return Response(serializer.errors, status=400)
    
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
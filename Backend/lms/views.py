#lms/views.py
from django.shortcuts import get_object_or_404
from django.db import connection
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from users.permissions import (
    IsAdminOrInstructor,
    IsAdminOrSelf,
    IsRoleAllowed,
    IsAdminUser,
    IsStudentUser,
    IsInstructorUser,
    IsStaffOrReadOnly
)
from .models import *
from .serializers import *
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

# all viewsets inherit from this base class to apply common permissions and behaviors
class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset that implements common permissions and behaviors.
    """
    staff_actions = ['create', 'update', 'partial_update', 'destroy']

    def get_permissions(self):
        if self.action in self.staff_actions:
            return [IsStaffOrReadOnly()]
        return [IsAuthenticated()]

class ProgramViewSet(BaseModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminUser]  # Only admin can manage programs
class CourseViewSet(BaseModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdminUser()]          # only admin can delete
        return super().get_permissions()    

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrInstructor])
    def enrollments(self, request, pk=None):
        course = self.get_object()
        if request.user.role == 'instructor' and course.instructor != request.user:
            raise PermissionDenied("You can only view enrollments for your own courses.")
        enrollments = course.enrollments.all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Course.objects.all()
        if user.role == 'instructor':
            return Course.objects.filter(instructor=user)
        return Course.objects.filter(enrollments__student=user).distinct()
    
    def perform_update(self, serializer):
        instance = self.get_object()
        if self.request.user.role == 'instructor' and instance.instructor != self.request.user:
            raise PermissionDenied("Instructors can only update their own courses")
        serializer.save()
    

class EnrollmentViewSet(BaseModelViewSet):
    queryset = Enrollment.objects.all() 
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Enrollment.objects.all()
        if user.role == 'instructor':
            return Enrollment.objects.filter(course__instructor=user)
        return Enrollment.objects.filter(student=user)

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['post'], permission_classes=[IsStudentUser])
    def enroll_me(self, request):
        course_id = request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
    
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            raise ValidationError("Already enrolled in this course")

        enrollment = Enrollment.objects.create(
            student=request.user,
            course=course
        )
        return Response(
            self.get_serializer(enrollment).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'], permission_classes=[IsStudentUser])
    def unenroll_me(self, request):
        """
        Allow a student to drop/unenroll from a course.
        """
        course_id = request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
        
        try:
            enrollment = Enrollment.objects.get(
                student=request.user,
                course=course,
                status='enrolled'  # Only allow dropping from active enrollments
            )
        except Enrollment.DoesNotExist:
            raise ValidationError("You are not enrolled in this course")
        
        # Delete the enrollment record
        enrollment.delete()
        
        #Just mark as dropped (if want to keep history)
        # enrollment.status = 'dropped'
        # enrollment.save()
        
        return Response(
            {"message": f"Successfully unenrolled from {course.code}: {course.name}"},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], permission_classes=[IsStudentUser])
    def my_courses(self, request):
        enrollments = self.get_queryset().filter(student=request.user)
        courses = Course.objects.filter(enrollments__student=request.user)
        return Response(CourseSerializer(courses, many=True).data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsStudentUser])
    def current_semester_modules(self, request):
        student = request.user
        profile = student.student_profile
        if not profile.program:
            return Response({"error": "Student not assigned to a program."}, status=400)

        courses = Course.objects.filter(
            program=profile.program,
            semester=profile.current_semester
        )

        enrolled = courses.filter(enrollments__student=student, enrollments__status='enrolled')
        available = courses.exclude(enrollments__student=student)

        return Response({
            'enrolled': CourseSerializer(enrolled, many=True).data,
            'available': CourseSerializer(available, many=True).data,
        })

    @action(detail=False, methods=['get'], permission_classes=[IsStudentUser])
    def enrollment_history(self, request):
        student = request.user
        profile = student.student_profile
        enrollments = Enrollment.objects.filter(student=student, status='enrolled').select_related('course')

        groups = {}
        for enrollment in enrollments:
            course = enrollment.course
            sem = course.semester
            if sem not in groups:
                groups[sem] = {'courses': [], 'total_credits': 0, 'gpa_credits': 0}
            groups[sem]['courses'].append(course)
            groups[sem]['total_credits'] += course.credits
            if course.gpa_applicable:
                groups[sem]['gpa_credits'] += course.credits

        history = []
        for sem in sorted(groups.keys()):
            data = groups[sem]
            history.append({
                'semester': sem,
                'courses': CourseSerializer(data['courses'], many=True).data,
                'total_credits': data['total_credits'],
                'gpa_credits': data['gpa_credits'],
            })

        total_credits = sum(g['total_credits'] for g in groups.values())
        total_gpa_credits = sum(g['gpa_credits'] for g in groups.values())

        return Response({
            'student': {
                'name': student.get_full_name(),
                'index_number': student.username,
                'program': profile.program.name if profile.program else None,
            },
            'history': history,
            'total_credits': total_credits,
            'total_gpa_credits': total_gpa_credits,
        })    

class ExamTimetableViewSet(BaseModelViewSet):
    queryset = ExamTimetable.objects.all()
    serializer_class = ExamTimetableSerializer
        
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ExamTimetable.objects.all()
        if user.role == 'instructor':
            return ExamTimetable.objects.filter(course__instructor=user)
        return ExamTimetable.objects.filter(course__enrollments__student=user).distinct()
    
    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

class ExamResultViewSet(BaseModelViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Role-based filtering
        if user.role == 'admin':
            queryset = ExamResult.objects.all()
        elif user.role == 'instructor':
            queryset = ExamResult.objects.filter(exam__course__instructor=user)
        else:
            queryset = ExamResult.objects.filter(student=user)
        
        # Optional query parameter filters
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(exam__course_id=course_id)
        
        student_id = self.request.query_params.get('student')
        if student_id and user.role == 'admin':  # Only admin can filter by student
            queryset = queryset.filter(student_id=student_id)
        
        return queryset

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj
    
    def perform_create(self, serializer):
        exam = serializer.validated_data['exam']
        student = serializer.validated_data['student']

        # instructor ownership
        if self.request.user.role == 'instructor' and exam.course.instructor != self.request.user:
            raise ValidationError("Instructors can only create results for their own courses")

        # student must be enrolled
        if not Enrollment.objects.filter(student=student, course=exam.course).exists():
            raise ValidationError("Student is not enrolled in this course")

        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsStudentUser])
    def my_results(self, request):
        """
        Student view: Get results grouped by semester with SGPA and CGPA
        """
        student = request.user
        
        # Double-check user is student
        if student.role != 'student':
            return Response(
                {'error': 'This endpoint is only for students'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if student has profile
        if not hasattr(student, 'student_profile'):
            return Response(
                {'error': 'Student profile not found. Please contact admin.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        profile = student.student_profile
        results = ExamResult.objects.filter(student=student).select_related('exam__course')

        groups = {}
        for result in results:
            course = result.exam.course
            sem = course.semester
            if sem not in groups:
                groups[sem] = {'results': [], 'total_credits': 0, 'total_grade_points': 0}
            groups[sem]['results'].append(result)
            if course.gpa_applicable:
                groups[sem]['total_credits'] += course.credits
                grade_point = self._grade_to_point(result.grade)
                groups[sem]['total_grade_points'] += grade_point * course.credits

        semester_results = []
        cumulative_credits = 0
        cumulative_points = 0
        for sem in sorted(groups.keys()):
            data = groups[sem]
            sgpa = data['total_grade_points'] / data['total_credits'] if data['total_credits'] else 0
            cumulative_credits += data['total_credits']
            cumulative_points += data['total_grade_points']
            cgpa = cumulative_points / cumulative_credits if cumulative_credits else 0

            semester_results.append({
                'semester': sem,
                'results': ExamResultSerializer(data['results'], many=True).data,
                'sgpa': round(sgpa, 2),
                'cgpa': round(cgpa, 2),
            })

        return Response({
            'student': {
                'name': student.get_full_name(),
                'index_number': student.username,
                'intake_batch': profile.batch.name if profile.batch else None,
                'program': profile.program.name if profile.program else None,
            },
            'semester_results': semester_results,
            'final_cgpa': round(cumulative_points / cumulative_credits, 2) if cumulative_credits else 0,
        })

    @action(detail=False, methods=['get'], permission_classes=[IsInstructorUser])
    def instructor_results(self, request):
        """
        Instructor view: Get results for courses taught by the instructor
        """
        instructor = request.user
        results = ExamResult.objects.filter(
            exam__course__instructor=instructor
        ).select_related('exam__course', 'student')
        
        serializer = ExamResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def admin_results(self, request):
        """
        Admin view: Get all exam results with optional filters
        """
        queryset = ExamResult.objects.all().select_related('exam__course', 'student')
        
        # Optional filters
        course_id = request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(exam__course_id=course_id)
        
        student_id = request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        semester = request.query_params.get('semester')
        if semester:
            queryset = queryset.filter(exam__course__semester=semester)
        
        serializer = ExamResultSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def admin_results_grouped(self, request):
        """
        Admin view: Get results grouped by semester with statistics
        """
        queryset = ExamResult.objects.all().select_related('exam__course', 'student')
        
        # Apply filters if provided
        course_id = request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(exam__course_id=course_id)
        
        student_id = request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Group by student and semester
        grouped_results = {}
        
        for result in queryset:
            student = result.student
            course = result.exam.course
            semester = course.semester
            
            if student.id not in grouped_results:
                grouped_results[student.id] = {
                    'student_id': student.id,
                    'student_name': student.get_full_name(),
                    'student_username': student.username,
                    'semesters': {}
                }
            
            if semester not in grouped_results[student.id]['semesters']:
                grouped_results[student.id]['semesters'][semester] = {
                    'semester': semester,
                    'results': [],
                    'total_credits': 0,
                    'total_grade_points': 0
                }
            
            sem_data = grouped_results[student.id]['semesters'][semester]
            sem_data['results'].append(result)
            if course.gpa_applicable:
                sem_data['total_credits'] += course.credits
                grade_point = self._grade_to_point(result.grade)
                sem_data['total_grade_points'] += grade_point * course.credits
        
        # Calculate SGPA and CGPA for each student
        student_results = []
        for student_id, student_data in grouped_results.items():
            student_semesters = []
            cumulative_credits = 0
            cumulative_points = 0
            
            for sem in sorted(student_data['semesters'].keys()):
                sem_data = student_data['semesters'][sem]
                sgpa = sem_data['total_grade_points'] / sem_data['total_credits'] if sem_data['total_credits'] else 0
                cumulative_credits += sem_data['total_credits']
                cumulative_points += sem_data['total_grade_points']
                cgpa = cumulative_points / cumulative_credits if cumulative_credits else 0
                
                student_semesters.append({
                    'semester': sem,
                    'results': ExamResultSerializer(sem_data['results'], many=True).data,
                    'sgpa': round(sgpa, 2),
                    'cgpa': round(cgpa, 2),
                })
            
            final_cgpa = cumulative_points / cumulative_credits if cumulative_credits else 0
            
            student_results.append({
                'student': {
                    'id': student_data['student_id'],
                    'name': student_data['student_name'],
                    'username': student_data['student_username']
                },
                'semester_results': student_semesters,
                'final_cgpa': round(final_cgpa, 2)
            })
        
        return Response(student_results)

    def _grade_to_point(self, grade):
        mapping = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0,
        }
        return mapping.get(grade, 0.0)
    


class SystemSettingViewSet(BaseModelViewSet):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='by-key/(?P<key>[^/.]+)')
    def by_key(self, request, key=None):
        setting = get_object_or_404(SystemSetting, key=key)
        serializer = self.get_serializer(setting)
        return Response(serializer.data)

# Internal Settings: User Management
class UserManageViewSet(BaseModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserManageSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'post', 'put', 'delete']

# Optional: Database info endpoint (admin only)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def db_info(request):
    with connection.cursor() as cursor:
        if connection.vendor == 'sqlite':
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        else:
            cursor.execute("SELECT table_name FROM information_schema.tables;")
        tables = [row[0] for row in cursor.fetchall()]
    return Response({'tables': tables})


@api_view(['GET'])
@permission_classes([IsStudentUser])
def student_dashboard(request):
    user = request.user
    enrollments = Enrollment.objects.filter(student=user)
    results = ExamResult.objects.filter(student=user)
    course_ids = enrollments.values_list('course_id', flat=True)
    exams = ExamTimetable.objects.filter(course__in=course_ids)

    return Response({
        "enrollments": EnrollmentSerializer(enrollments, many=True).data,
        "results": ExamResultSerializer(results, many=True).data,
        "upcoming_exams": ExamTimetableSerializer(exams, many=True).data,
    })

@api_view(['GET'])
@permission_classes([IsInstructorUser | IsAdminUser])
def instructor_dashboard(request):
    user = request.user
    courses = Course.objects.filter(instructor=user)
    enrollments = Enrollment.objects.filter(course__in=courses)
    exams = ExamTimetable.objects.filter(course__in=courses)

    return Response({
        "courses": CourseSerializer(courses, many=True).data,
        "enrollments": EnrollmentSerializer(enrollments, many=True).data,
        "exams": ExamTimetableSerializer(exams, many=True).data,
    })





#----------------------------------------------------------------------------------------------------#

# ---------- HELPER FUNCTIONS ---------- #
def calculate_priority(appeal):
    """Calculate priority based on appeal type and criteria"""
    # Bursary appeals with low income
    if hasattr(appeal, 'family_income_bracket') and appeal.family_income_bracket == 'LOW':
        return 'HIGH'
    # Appeals with medical conditions
    if hasattr(appeal, 'has_medical_condition') and appeal.has_medical_condition:
        return 'HIGH'
    # Medical-related appeals
    if hasattr(appeal, 'reason_type') and appeal.reason_type == 'MEDICAL':
        return 'HIGH'
    return 'MEDIUM'

def create_review_queue_entry(appeal, appeal_model, category, is_processed=False):
    """Helper to create review queue entry"""
    content_type = ContentType.objects.get_for_model(appeal_model)
    return AppealReviewQueue.objects.create(
        content_type=content_type,
        object_id=appeal.id,
        category=category,
        priority=calculate_priority(appeal),
        department=appeal.department,
        faculty=appeal.faculty,
        batch=appeal.batch,
        academic_year=appeal.academic_year,
        is_processed=is_processed
    )

def mark_queue_as_processed(appeal, appeal_model):
    """Mark queue entry as processed"""
    content_type = ContentType.objects.get_for_model(appeal_model)
    queue_entry = AppealReviewQueue.objects.get(
        content_type=content_type,
        object_id=appeal.id,
        is_processed=False
    )
    queue_entry.is_processed = True
    queue_entry.processed_at = timezone.now()
    queue_entry.save()
    return queue_entry

def check_duplicate_appeal(student, appeal_model, statuses=None):
    """Check if student has duplicate pending appeal"""
    if statuses is None:
        statuses = [AppealStatus.PENDING, AppealStatus.UNDER_REVIEW]
    return appeal_model.objects.filter(
        student=student,
        status__in=statuses
    ).exists()

# -------------------------------------- #

# ---------- ACADEMIC STRUCTURE VIEWS ----------

class FacultyListCreateView(generics.ListCreateAPIView):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAdminUser]


class FacultyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAdminUser]


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        faculty_id = self.request.query_params.get('faculty')
        if faculty_id:
            queryset = queryset.filter(faculty_id=faculty_id)
        return queryset


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminUser]


class BatchListCreateView(generics.ListCreateAPIView):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        return queryset


class BatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAdminUser]


# class CourseListCreateView(generics.ListCreateAPIView):
#     queryset = Course.objects.all()
#     serializer_class = CourseSerializer
#     permission_classes = [IsAdminUser]
    
#     def get_queryset(self):
#         queryset = super().get_queryset()
#         department_id = self.request.query_params.get('department')
#         if department_id:
#             queryset = queryset.filter(department_id=department_id)
#         semester = self.request.query_params.get('semester')
#         if semester:
#             queryset = queryset.filter(semester=semester)
#         return queryset


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminUser]


class ModuleListCreateView(generics.ListCreateAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrInstructor]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrInstructor]


# ---------- BASE APPEAL VIEW WITH COMMON FUNCTIONALITY ----------

class BaseAppealCreateView(generics.ListCreateAPIView):
    """Base view for appeal creation with common functionality"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_student:
            return self.model.objects.filter(student=user)
        return self.model.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Handle file uploads with PDF validation"""
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            logger.warning(f"PDF validation failed: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_create(self, serializer):
        # Check for duplicate pending appeal
        if check_duplicate_appeal(self.request.user, self.model):
            raise serializers.ValidationError(
                {'error': f'You already have a pending {self.model.__name__.lower().replace("appeal", "")} appeal'}
            )
        
        # Save appeal
        appeal = serializer.save(student=self.request.user)
        
        # Create review queue entry
        create_review_queue_entry(appeal, self.model, self.category)


class BaseAppealDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Base view for appeal detail with common functionality"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Students can only access their own appeals
        if user.is_student and obj.student != user:
            self.permission_denied(self.request)
        return obj
    
    def update(self, request, *args, **kwargs):
        """Handle file updates with PDF validation"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except serializers.ValidationError as e:
            logger.warning(f"PDF validation failed on update: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        

# ---------- CONCRETE APPEAL VIEWS ----------

class BursaryAppealListCreateView(BaseAppealCreateView):
    """Create or list bursary appeals"""
    model = BursaryAppeal
    serializer_class = BursaryAppealSerializer
    category = 'financial'


class BursaryAppealDetailView(BaseAppealDetailView):
    """Retrieve, update or delete a specific bursary appeal"""
    queryset = BursaryAppeal.objects.all()
    serializer_class = BursaryAppealSerializer


class HostelAppealListCreateView(BaseAppealCreateView):
    """Create or list hostel appeals"""
    model = HostelAppeal
    serializer_class = HostelAppealSerializer
    category = 'welfare'


class HostelAppealDetailView(BaseAppealDetailView):
    """Retrieve, update or delete a specific hostel appeal"""
    queryset = HostelAppeal.objects.all()
    serializer_class = HostelAppealSerializer


class ExamRewriteAppealListCreateView(BaseAppealCreateView):
    """Create or list exam rewrite appeals"""
    model = ExamRewriteAppeal
    serializer_class = ExamRewriteAppealSerializer
    category = 'academic'


class ExamRewriteAppealDetailView(BaseAppealDetailView):
    """Retrieve, update or delete a specific exam rewrite appeal"""
    queryset = ExamRewriteAppeal.objects.all()
    serializer_class = ExamRewriteAppealSerializer


class MedicalLeaveAppealListCreateView(BaseAppealCreateView):
    """Create or list medical leave appeals"""
    model = MedicalLeaveAppeal
    serializer_class = MedicalLeaveAppealSerializer
    category = 'medical'


class MedicalLeaveAppealDetailView(BaseAppealDetailView):
    """Retrieve, update or delete a specific medical leave appeal"""
    queryset = MedicalLeaveAppeal.objects.all()
    serializer_class = MedicalLeaveAppealSerializer


class ResultReEvaluationAppealListCreateView(BaseAppealCreateView):
    """Create or list result re-evaluation appeals"""
    model = ResultReEvaluationAppeal
    serializer_class = ResultReEvaluationAppealSerializer
    category = 'academic'


class ResultReEvaluationAppealDetailView(BaseAppealDetailView):
    """Retrieve, update or delete a specific re-evaluation appeal"""
    queryset = ResultReEvaluationAppeal.objects.all()
    serializer_class = ResultReEvaluationAppealSerializer


# ---------- STUDENT APPEAL AGGREGATION ----------

class StudentMyAppealsView(APIView):
    """Get all appeals for the current student"""
    permission_classes = [permissions.IsAuthenticated, IsStudentUser]
    
    def get(self, request):
        student = request.user

        bursary = BursaryAppeal.objects.filter(student=student).select_related('department', 'faculty', 'batch')
        hostel = HostelAppeal.objects.filter(student=student).select_related('department', 'faculty', 'batch')
        exam = ExamRewriteAppeal.objects.filter(student=student).select_related('department', 'faculty', 'batch', 'course')
        medical = MedicalLeaveAppeal.objects.filter(student=student).select_related('department', 'faculty', 'batch')
        reeval = ResultReEvaluationAppeal.objects.filter(student=student).select_related('department', 'faculty', 'batch', 'exam_result')

        return Response({
            'bursary': BursaryAppealSerializer(bursary, many=True).data,
            'hostel': HostelAppealSerializer(hostel, many=True).data,
            'exam_rewrite': ExamRewriteAppealSerializer(exam, many=True).data,
            'medical_leave': MedicalLeaveAppealSerializer(medical, many=True).data,
            'result_reevaluation': ResultReEvaluationAppealSerializer(reeval, many=True).data,
        })


# ---------- ADMIN APPEAL REVIEW VIEWS ----------

class AdminPendingAppealsView(generics.ListAPIView):
    """Base view for pending appeals by category"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return self.model.objects.filter(status=AppealStatus.PENDING).select_related(
            'student', 'department', 'faculty', 'batch'
        )


class AdminPendingBursaryView(AdminPendingAppealsView):
    """View all pending bursary appeals"""
    model = BursaryAppeal
    serializer_class = BursaryAppealSerializer


class AdminPendingHostelView(AdminPendingAppealsView):
    """View all pending hostel appeals"""
    model = HostelAppeal
    serializer_class = HostelAppealSerializer


class AdminPendingExamRewriteView(AdminPendingAppealsView):
    """View all pending exam rewrite appeals"""
    model = ExamRewriteAppeal
    serializer_class = ExamRewriteAppealSerializer


class AdminPendingMedicalLeaveView(AdminPendingAppealsView):
    """View all pending medical leave appeals"""
    model = MedicalLeaveAppeal
    serializer_class = MedicalLeaveAppealSerializer


class AdminPendingReevalView(AdminPendingAppealsView):
    """View all pending re-evaluation appeals"""
    model = ResultReEvaluationAppeal
    serializer_class = ResultReEvaluationAppealSerializer


# ---------- BASE ADMIN ACTION VIEW ----------

class BaseAdminActionView(APIView):
    """Base view for admin actions - supports approve, reject"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def post(self, request, pk):
        appeal = get_object_or_404(self.model, pk=pk)
        
        # Get decision from request
        decision = request.data.get('decision')
        notes = request.data.get('notes', '')
        
        # Validate decision
        if decision not in ['approve', 'reject']:
            return Response(
                {'error': 'Decision must be "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process type-specific fields based on decision
        if decision == 'approve':
            self._process_approval(appeal, request.data)
        elif decision == 'reject':
            self._process_rejection(appeal, request.data)
        
        # Call the review method with the decision
        appeal.review(request.user, decision, notes)
        
        # If decision is approve, reject mark queue as processed
        mark_queue_as_processed(appeal, self.model)
        
        return Response(self.serializer_class(appeal).data)
    
    def _process_approval(self, appeal, data):
        """Override for approval-specific processing"""
        pass
    
    def _process_rejection(self, appeal, data):
        """Override for rejection-specific processing"""
        pass
    
    def _process_needs_info(self, appeal, data):
        """Override for needs_info-specific processing"""
        pass


# ---------- CONCRETE VIEWS WITH ALL DECISIONS ----------

class AdminProcessBursaryView(BaseAdminActionView):
    """Process bursary appeal - approve/reject"""
    model = BursaryAppeal
    serializer_class = BursaryAppealSerializer
    
    def _process_approval(self, appeal, data):
        """Handle bursary approval - set approved amount"""
        approved_amount = data.get('approved_amount')
        if approved_amount:
            appeal.approved_amount = approved_amount
    
    def _process_rejection(self, appeal, data):
        """Handle bursary rejection - nothing specific needed"""
        pass


class AdminProcessHostelView(BaseAdminActionView):
    """Process hostel appeal - approve/reject"""
    model = HostelAppeal
    serializer_class = HostelAppealSerializer
    
    def _process_approval(self, appeal, data):
        """Handle hostel approval - allocate room"""
        appeal.allocated_room_number = data.get('room_number')
        appeal.allocated_hostel = data.get('hostel_name')
        appeal.check_in_date = data.get('check_in_date')
        appeal.check_out_date = data.get('check_out_date')
        appeal.save()
    
    def _process_rejection(self, appeal, data):
        """Handle hostel rejection - nothing specific needed"""
        pass


class AdminProcessExamRewriteView(BaseAdminActionView):
    """Process exam rewrite appeal - approve/reject"""
    model = ExamRewriteAppeal
    serializer_class = ExamRewriteAppealSerializer
    
    def _process_approval(self, appeal, data):
        """Handle exam rewrite approval - schedule new exam"""
        appeal.new_exam_date = data.get('new_exam_date')
        appeal.exam_venue = data.get('exam_venue')
        appeal.save()
    
    def _process_rejection(self, appeal, data):
        """Handle exam rewrite rejection - nothing specific needed"""
        pass


class AdminProcessMedicalLeaveView(BaseAdminActionView):
    """Process medical leave appeal - approve/reject"""
    model = MedicalLeaveAppeal
    serializer_class = MedicalLeaveAppealSerializer
    
    def _process_approval(self, appeal, data):
        """Handle medical leave approval - set approved days"""
        appeal.approved_leave_days = data.get('approved_leave_days')
        appeal.save()
    
    def _process_rejection(self, appeal, data):
        """Handle medical leave rejection - nothing specific needed"""
        pass


class AdminProcessReevalView(BaseAdminActionView):
    """Process result re-evaluation appeal - approve/reject"""
    model = ResultReEvaluationAppeal
    serializer_class = ResultReEvaluationAppealSerializer
    
    def _process_approval(self, appeal, data):
        """Handle re-evaluation approval - update grade"""
        appeal.new_marks = data.get('new_marks')
        appeal.new_grade = data.get('new_grade')
        appeal.review_comments = data.get('review_comments', '')
        appeal.save()
    
    def _process_rejection(self, appeal, data):
        """Handle re-evaluation rejection - nothing specific needed"""
        pass


# ---------- REVIEW QUEUE VIEWS ----------

class AppealReviewQueueListView(generics.ListAPIView):
    serializer_class = AppealReviewQueueSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = AppealReviewQueue.objects.filter(is_processed=False)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
        
        return queryset.order_by('-created_at')


class AppealReviewQueueAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def post(self, request, pk):
        queue_item = get_object_or_404(AppealReviewQueue, pk=pk)
        queue_item.assigned_to = request.user
        queue_item.save()
        
        # Update the actual appeal status
        if queue_item.appeal:
            queue_item.appeal.status = AppealStatus.UNDER_REVIEW
            queue_item.appeal.save()
        
        return Response({'status': 'assigned'})


class AppealReviewQueueProcessView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def post(self, request, pk):
        queue_item = get_object_or_404(AppealReviewQueue, pk=pk)
        queue_item.is_processed = True
        queue_item.processed_at = timezone.now()
        queue_item.save()
        
        return Response({'status': 'processed'})


# ---------- ATTACHMENT VIEWS WITH VALIDATION ----------

class AppealAttachmentCreateView(generics.CreateAPIView):
    """Create attachment for an appeal with PDF validation"""
    serializer_class = AppealAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            logger.warning(f"Attachment PDF validation failed: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class AppealAttachmentListView(generics.ListAPIView):
    """List attachments for a specific appeal"""
    serializer_class = AppealAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        appeal_id = self.kwargs['appeal_id']
        # Find which appeal type
        for model in [BursaryAppeal, HostelAppeal, ExamRewriteAppeal, MedicalLeaveAppeal, ResultReEvaluationAppeal]:
            try:
                appeal = model.objects.get(pk=appeal_id)
                content_type = ContentType.objects.get_for_model(model)
                return AppealAttachment.objects.filter(
                    appeal_type=content_type, 
                    appeal_id=appeal_id
                )
            except model.DoesNotExist:
                continue
        return AppealAttachment.objects.none()


class AppealAttachmentDeleteView(generics.DestroyAPIView):
    """Delete an attachment"""
    queryset = AppealAttachment.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def delete(self, request, *args, **kwargs):
        attachment = self.get_object()
        
        # Check permission
        if attachment.uploaded_by != request.user and not request.user.is_admin:
            return Response(
                {'error': 'You do not have permission to delete this attachment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete the file from storage
        if attachment.file:
            attachment.file.delete(save=False)
        
        attachment.delete()
        
        return Response(
            {'message': 'Attachment deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


# ---------- APPEAL DASHBOARD VIEWS ----------

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get all pending counts using aggregation
        pending = {
            'bursary': BursaryAppeal.objects.filter(status=AppealStatus.PENDING).count(),
            'hostel': HostelAppeal.objects.filter(status=AppealStatus.PENDING).count(),
            'exam_rewrite': ExamRewriteAppeal.objects.filter(status=AppealStatus.PENDING).count(),
            'medical_leave': MedicalLeaveAppeal.objects.filter(status=AppealStatus.PENDING).count(),
            'result_reeval': ResultReEvaluationAppeal.objects.filter(status=AppealStatus.PENDING).count(),
        }
        
        # Get queue statistics in one query
        queue_stats = AppealReviewQueue.objects.aggregate(
            total=Count('id'),
            unprocessed=Count('id', filter=Q(is_processed=False))
        )
        
        return Response({
            'pending_appeals': pending,
            'total_appeals': queue_stats['total'],
            'unprocessed_queue': queue_stats['unprocessed'],
        })


class StudentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudentUser]
    
    def get(self, request):
        student = request.user
        
        # Query each model once and aggregate in Python
        bursary_qs = BursaryAppeal.objects.filter(student=student)
        hostel_qs = HostelAppeal.objects.filter(student=student)
        exam_qs = ExamRewriteAppeal.objects.filter(student=student)
        medical_qs = MedicalLeaveAppeal.objects.filter(student=student)
        reeval_qs = ResultReEvaluationAppeal.objects.filter(student=student)
        
        # Get all counts in one go per model using aggregation
        bursary_counts = bursary_qs.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=AppealStatus.PENDING)),
            approved=Count('id', filter=Q(status=AppealStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=AppealStatus.REJECTED)),
            under_review=Count('id', filter=Q(status=AppealStatus.UNDER_REVIEW))
        )
        
        hostel_counts = hostel_qs.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=AppealStatus.PENDING)),
            approved=Count('id', filter=Q(status=AppealStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=AppealStatus.REJECTED)),
            under_review=Count('id', filter=Q(status=AppealStatus.UNDER_REVIEW))
        )
        
        exam_counts = exam_qs.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=AppealStatus.PENDING)),
            approved=Count('id', filter=Q(status=AppealStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=AppealStatus.REJECTED)),
            under_review=Count('id', filter=Q(status=AppealStatus.UNDER_REVIEW))
        )
        
        medical_counts = medical_qs.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=AppealStatus.PENDING)),
            approved=Count('id', filter=Q(status=AppealStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=AppealStatus.REJECTED)),
            under_review=Count('id', filter=Q(status=AppealStatus.UNDER_REVIEW))
        )
        
        reeval_counts = reeval_qs.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=AppealStatus.PENDING)),
            approved=Count('id', filter=Q(status=AppealStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=AppealStatus.REJECTED)),
            under_review=Count('id', filter=Q(status=AppealStatus.UNDER_REVIEW))
        )
        
        return Response({
            'my_appeals': {
                'total': bursary_counts['total'] + hostel_counts['total'] + 
                         exam_counts['total'] + medical_counts['total'] + 
                         reeval_counts['total'],
                'pending': bursary_counts['pending'] + hostel_counts['pending'] + 
                          exam_counts['pending'] + medical_counts['pending'] + 
                          reeval_counts['pending'],
                'approved': bursary_counts['approved'] + hostel_counts['approved'] + 
                           exam_counts['approved'] + medical_counts['approved'] + 
                           reeval_counts['approved'],
                'rejected': bursary_counts['rejected'] + hostel_counts['rejected'] + 
                           exam_counts['rejected'] + medical_counts['rejected'] + 
                           reeval_counts['rejected'],
                'under_review': bursary_counts['under_review'] + hostel_counts['under_review'] + 
                           exam_counts['under_review'] + medical_counts['under_review'] + 
                           reeval_counts['under_review'],
            }
        })

#lms/views.py
from django.shortcuts import get_object_or_404
from django.db import connection
from django.contrib.auth import get_user_model

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import (
    Course, Enrollment, ExamTimetable, ExamResult, SystemSetting
)
from .serializers import (
    CourseSerializer,
    EnrollmentSerializer,
    ExamTimetableSerializer,
    ExamResultSerializer,
    SystemSettingSerializer,
    UserManageSerializer
)
from users.permissions import (
    IsAdminOrInstructor,
    IsAdminOrSelf,
    IsRoleAllowed,
    IsAdminUser,
    IsStudentUser,
    IsInstructorUser,
    IsStaffOrReadOnly
)


User = get_user_model()

class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset that implements common permissions and behaviors.
    """
    staff_actions = ['create', 'update', 'partial_update', 'destroy']

    def get_permissions(self):
        if self.action in self.staff_actions:
            return [IsStaffOrReadOnly()]
        return [IsAuthenticated()]

# ViewSets for Course, Enrollment, ExamTimetable, ExamResult, SystemSetting
class CourseViewSet(BaseModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrInstructor])
    def enrollments(self, request, pk=None):
        course = self.get_object()
        # Ensure instructors can only view enrollments for their own courses
        if request.user.role == 'instructor' and course.instructor != request.user:
            raise PermissionDenied("You can only view enrollments for your own courses.")
        enrollments = course.enrollments.all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
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

    @action(detail=False, methods=['get'], permission_classes=[IsStudentUser])
    def my_courses(self, request):
        enrollments = self.get_queryset().filter(student=request.user)
        courses = Course.objects.filter(enrollments__student=request.user)
        return Response(CourseSerializer(courses, many=True).data)
    

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
    

class ExamResultViewSet(BaseModelViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ExamResult.objects.all()
        if user.role == 'instructor':
            return ExamResult.objects.filter(exam__course__instructor=user)
        return ExamResult.objects.filter(student=user)

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
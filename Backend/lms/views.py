#lms/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import connection
from .models import Course, Enrollment, ExamTimetable, ExamResult, SystemSetting
from .serializers import (
    CourseSerializer, EnrollmentSerializer, ExamTimetableSerializer,
    ExamResultSerializer, SystemSettingSerializer, UserManageSerializer
)
from .permissions import IsAdmin, IsAdminOrInstructor, IsEnrolledStudentOrStaff
from django.contrib.auth import get_user_model

User = get_user_model()

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAdminOrInstructor]  # list/retrieve
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrInstructor])
    def enrollments(self, request, pk=None):
        course = self.get_object()
        enrollments = course.enrollments.all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all() 
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrInstructor()]
        return [permissions.IsAuthenticated()]

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
    
    

class ExamTimetableViewSet(viewsets.ModelViewSet):
    queryset = ExamTimetable.objects.all()
    serializer_class = ExamTimetableSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrInstructor()]
        return [permissions.IsAuthenticated()]

class ExamResultViewSet(viewsets.ModelViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrInstructor()]
        return [permissions.IsAuthenticated()]

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

class SystemSettingViewSet(viewsets.ModelViewSet):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['get'], url_path='by-key/(?P<key>[^/.]+)')
    def by_key(self, request, key=None):
        setting = get_object_or_404(SystemSetting, key=key)
        serializer = self.get_serializer(setting)
        return Response(serializer.data)

# Internal Settings: User Management
class UserManageViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserManageSerializer
    permission_classes = [IsAdmin]
    http_method_names = ['get', 'post', 'put', 'delete']

# Optional: Database info endpoint (admin only)
@api_view(['GET'])
@permission_classes([IsAdmin])
def db_info(request):
    from django.db import connection
    with connection.cursor() as cursor:
        if connection.vendor == 'sqlite':
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        else:
            cursor.execute("SELECT table_name FROM information_schema.tables;")
        tables = [row[0] for row in cursor.fetchall()]
    return Response({'tables': tables})
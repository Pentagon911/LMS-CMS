from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'courses', views.CourseViewSet)
router.register(r'enrollments', views.EnrollmentViewSet)
router.register(r'exam-timetables', views.ExamTimetableViewSet)
router.register(r'exam-results', views.ExamResultViewSet)
router.register(r'system-settings', views.SystemSettingViewSet)
router.register(r'users', views.UserManageViewSet)  # admin user management

urlpatterns = [
    path('', include(router.urls)),
    path('db-info/', views.db_info, name='db-info'),
    path('student/dashboard/', views.student_dashboard),
    path('instructor/dashboard/', views.instructor_dashboard),
]
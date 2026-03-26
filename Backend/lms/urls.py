from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'courses', views.CourseViewSet)
router.register(r'enrollments', views.EnrollmentViewSet)
router.register(r'exam_timetables', views.ExamTimetableViewSet)
router.register(r'exam_results', views.ExamResultViewSet)
router.register(r'system_settings', views.SystemSettingViewSet)
router.register(r'programs', views.ProgramViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('db-info/', views.db_info, name='db-info'),
    path('student/dashboard/', views.student_dashboard),
    path('instructor/dashboard/', views.instructor_dashboard),

    # ---------- ACADEMIC STRUCTURE ----------
    path('faculties/', views.FacultyListCreateView.as_view(), name='faculty-list'),                # List/Create faculties (admin only)
    path('faculties/<int:pk>/', views.FacultyDetailView.as_view(), name='faculty-detail'),         # Retrieve/Update/Delete faculty (admin only)
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list'),        # List/Create departments with faculty filter (admin only)
    path('departments/<int:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'), # Retrieve/Update/Delete department (admin only)
    path('batches/', views.BatchListCreateView.as_view(), name='batch-list'),                      # List/Create batches with department filter (admin only)
    path('batches/<int:pk>/', views.BatchDetailView.as_view(), name='batch-detail'),               # Retrieve/Update/Delete batch (admin only)
    # path('courses/', views.CourseListCreateView.as_view(), name='course-list'),                    # List/Create courses with department/semester filters (admin only)
    path('courses/<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),             # Retrieve/Update/Delete course (admin only)
    path('modules/', views.ModuleListCreateView.as_view(), name='module-list'),                    # List/Create modules with course filter (admin/instructor only)
    path('modules/<int:pk>/', views.ModuleDetailView.as_view(), name='module-detail'),             # Retrieve/Update/Delete module (admin/instructor only)
    
]
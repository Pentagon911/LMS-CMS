# CMS/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'quizzes', views.QuizViewSet, basename='quiz')

# GET cms/quizzes/draft_quizzes/ -> Get all quizzes created by instructor
# GET cms/quizzes/{quiz_id}/ -> Get specific quiz
# POST cms/quizzes/{quiz_id}/add_to_week/ -> Add quiz to week
# POST cms/quizzes/{quiz_id}/submit/ -> Submit quiz

router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'options', views.OptionViewSet, basename='option')
router.register(r'attempts', views.QuizAttemptViewSet, basename='attempt')
router.register(r'answers', views.StudentAnswerViewSet, basename='answer')
router.register(r'weeks', views.WeekViewSet, basename='week')
router.register(r'courses', views.CourseViewSet, basename='course')

# GET cms/courses/ -> Get courses for relevent user
# GET cms/course/{course_id}/dashboard/ -> Get all content related to week
# POST cms/courses/{course_id}/announcements/ -> Add specific week announcement

router.register(r'academic-calendars', views.AcademicCalendarViewSet, basename='academic-calendar')
router.register(r'practical-timetables', views.PracticalTimetableViewSet, basename='practical-timetable')

urlpatterns = [
    path('', include(router.urls)),
        
    path('courses/<int:course_id>/dashboard/add_content/',views.CourseContentViewSet.as_view({'post': 'create'}), 
        name='special-add-week-content'
    ),
    
    # Announcement endpoints
    path('global-announcements/faculty-batch-years/', views.FacultyBatchYearsView.as_view(), name='faculty-batch-years'),
    path('global-announcements/', views.GlobalAnnouncementListView.as_view(), name='announcement-list'),
    path('global-announcements/<int:pk>/', views.GlobalAnnouncementDetailView.as_view(), name='announcement-detail'),
    path('global-announcements/student/', views.StudentAnnouncementListView.as_view(), name='student-announcements'),
    path('global-announcements/bulk-create/', views.BulkAnnouncementCreateView.as_view(), name='bulk-announcement-create'),
]
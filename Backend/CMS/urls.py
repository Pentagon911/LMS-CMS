# CMS/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'options', views.OptionViewSet, basename='option')
router.register(r'attempts', views.QuizAttemptViewSet, basename='attempt')
router.register(r'answers', views.StudentAnswerViewSet, basename='answer')
router.register(r'weeks', views.WeekViewSet, basename='week')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')

router.register(r'academic-calendars', views.AcademicCalendarViewSet, basename='academic-calendar')
router.register(r'practical-timetables', views.PracticalTimetableViewSet, basename='practical-timetable')

urlpatterns = [
    path('', include(router.urls)),
        
    # Announcement preview
    path('announcements/preview/', views.AnnouncementViewSet.as_view({'post': 'preview'}), name='announcement-preview'),
    
    # Course announcements
    path('courses/<int:course_id>/announcements/', views.AnnouncementViewSet.as_view({'get': 'by_course'}), name='course-announcements'),
    
    # Week announcements (using AnnouncementViewSet)
    path('courses/<int:course_id>/weeks/<int:week_id>/announcements/', views.AnnouncementViewSet.as_view({'get': 'by_week'}), name='week-announcements'),

    path('courses/<int:course_id>/weeks/<int:week_number>/announcements/create/', 
         views.AnnouncementViewSet.as_view({'post': 'create_for_week'}), 
         name='week-announcements-create'),]
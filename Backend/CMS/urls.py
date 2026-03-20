from django.urls import path,include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

# Register ViewSets
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'options', views.OptionViewSet, basename='option')
# router.register(r'weeks', views.WeekViewSet, basename='week')
# router.register(r'videos', views.VideoViewSet, basename='video')
# router.register(r'pdfs', views.PdfViewSet, basename='pdf')
# router.register(r'links', views.LinkViewSet, basename='link')
router.register(r'attempts', views.QuizAttemptViewSet, basename='attempt')
router.register(r'answers', views.StudentAnswerViewSet, basename='answer')

urlpatterns = [
    # All API endpoints under /cms/
    path('', include(router.urls)),
]

from django.urls import path,include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

# Register all your ViewSets from CMS app
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'options', views.OptionViewSet, basename='option')
router.register(r'attempts', views.QuizAttemptViewSet, basename='attempt')
router.register(r'answers', views.StudentAnswerViewSet, basename='answer')

urlpatterns = [
    path('', include(router.urls)),
]

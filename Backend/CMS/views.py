from django.shortcuts import render
from users.permissions import *
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import *
from .serializers import *

# Create your views here.

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuizCreateSerializer
        
        elif self.action in ['update','partial_update']:
            return QuizCreateSerializer

        elif self.action in ['retrieve']:
            user = self.request.user
            if user.role == 'student':
                return StudentQuizSerializer
            elif user.role == 'instructor':
                return InstructorQuizSerializer
            
        return StudentQuizSerializer
    
    def get_permissions(self):
        """
        Assign different permissions based on the action.
        This is where we use the permissions from Users app.
        """

        # Write operations (create, update, delete) - Only instructors/admins
        if self.action in ['create', 'update', 'partial_update', 'destroy',]:
            # permission_classes = [IsAuthenticated,IsInstructorUser]
            permission_classes = [permissions.AllowAny]
        elif self.action in ['submit']:
            # permission_classes = [IsAuthenticated,IsStudentUser]
            permission_classes = [permissions.AllowAny]
        else:
            # permission_classes = [IsAuthenticated]
            permission_classes = [permissions.AllowAny]

        return [permission() for permission in permission_classes]

    def retrieve(self,request,*args,**kwargs):
        quiz = self.get_object()
        serializer = self.get_serializer(quiz)
        
        return Response(serializer.data)
    
    def create(self,request,*args,**kwargs):
        """Create quiz - validation happens in serializer"""
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        quiz = serializer.save()
        return Response(self.get_serializer(quiz).data,status = 201)
    

    def update(self,request,*args,**kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail = True,methods = ['post'])
    def submit(self,request,pk =None):
        quiz = self.get_object()

        alreadyAttempt = QuizAttempt.objects.filter(
            student = request.user,
            quiz = quiz,
            endAt__isnull = False
        ).first()

        if alreadyAttempt:
            return Response({'error':'You have already Attempt to this quiz.'},
                            status = status.HTTP_400_BAD_REQUEST
                            )
        attempt = QuizAttempt.objects.create(student = request.user,quiz = quiz,startedAt = timezone.now())

        answerData = request.data.get('answers',[])
        score = 0
        totalQuestion = quiz.questions.count()

        for ans in answerData:
            try:
                question = Question.objects.get(id = ans['questionId'])
            except Question.DoesNotExist:
                continue

            studentAnswer = StudentAnswer.objects.create(attempt = attempt,question = question,textAnswer = ans.get('textAnswer'))

            if 'selectedOptions'  in ans and ans['selectedOptions'] :
                options = Option.objects.filter(id__in = ans['selectedOptions'])
                studentAnswer.selectedOptions.set(options)

                correctAnswers = question.options.filter(is_correct = True)

                if set(options) == set(correctAnswers):
                    studentAnswer.isCorrect = True
                    score +=1
                
                studentAnswer.save()
        attempt.endAt = timezone.now()
        attempt.score = (score/totalQuestion)*100 if totalQuestion > 0 else 0
        attempt.save()
        return Response({
            'message': 'Quiz submitted successfully',
            'score': attempt.score,
            'correct': score,
            'total': totalQuestion
        }, status=status.HTTP_200_OK)
    
class QuestionViewSet(viewsets.ModelViewSet):
    """
    - Manage Questions
    """
    queryset = Question.objects.all()

    def get_permissions(self):
        """Simple permission control"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only instructors can modify questions
            # permission_classes = [IsAuthenticated, IsInstructorUser]
            permission_classes = [permissions.AllowAny]
        else:
            # Anyone authenticated can view
            # permission_classes = [IsAuthenticated]
            permission_classes = [permissions.AllowAny]
        
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
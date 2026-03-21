#lms/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Course, Enrollment, ExamTimetable, ExamResult, SystemSetting

User = get_user_model()

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description',
            'credits', 'instructor', 'instructor_name',
            'created_at', 'updated_at'
        ]

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    student = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'course',
            'student_name', 'course_code',
            'status', 'grade',
            'enrollment_date', 'updated_at'
        ]

    # def validate(self, data):
    #     request = self.context['request']

    #     if request.user.role == 'student':
    #         if data.get('student') and data.get('student') != request.user:
    #             raise serializers.ValidationError("You can only enroll yourself")

    #     return data

class ExamTimetableSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = ExamTimetable
        fields = [
            'id', 'course', 'course_name',
            'title', 'date', 'start_time', 'end_time', 'location'
        ]

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = ExamResult
        fields = [
            'id', 'student', 'student_name',
            'exam', 'exam_title',
            'score', 'grade'
        ]

    def validate_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Score must be between 0 and 100")
        return value
    
    def validate(self, data):
        exam = data.get('exam')
        student = data.get('student')

        if exam and student:
            from .models import Enrollment
            if not Enrollment.objects.filter(
                student=student,
                course=exam.course
            ).exists():
                raise serializers.ValidationError("Student is not enrolled in this course")

        return data

class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ['id', 'key', 'value', 'description', 'updated_at']

# Serializer for managing users (admin only)
class UserManageSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_role(self, value):
        if value not in ['admin', 'instructor', 'student']:
            raise serializers.ValidationError("Invalid role")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
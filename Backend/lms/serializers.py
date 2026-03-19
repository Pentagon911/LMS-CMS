from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Course, Enrollment, ExamTimetable, ExamResult, SystemSetting

User = get_user_model()

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'

class ExamTimetableSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model = ExamTimetable
        fields = '__all__'

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = ExamResult
        fields = '__all__'

class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = '__all__'

# Serializer for managing users (admin only)
class UserManageSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'password']
        extra_kwargs = {'password': {'write_only': True}}

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
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from .profiles import StudentProfile, InstructorProfile, AdminProfile

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 
                 'first_name', 'last_name', 'role', 'phone_number')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        
        # Create role-specific profile
        if user.role == User.Role.STUDENT:
            StudentProfile.objects.create(
                user=user,
                student_id=self.generate_student_id(user)
            )
        elif user.role == User.Role.ADMIN:
            AdminProfile.objects.create(
                user=user,
                admin_id=self.generate_admin_id(user)
            )
        elif user.role == User.Role.INSTRUCTOR:
            InstructorProfile.objects.create(
                user=user,
                instructor_id=self.generate_instructor_id(user)
            )
        
        return user
    
    def generate_student_id(self, user):
        # Implement your logic for generating student ID
        return f"STU{user.id:06d}"
    
    def generate_admin_id(self, user):
        return f"ADMIN{user.id:06d}"
    
    def generate_instructor_id(self, user):
        return f"INS{user.id:06d}"

class UserDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                 'role', 'phone_number', 'profile_picture', 'profile',
                 'date_joined', 'last_login')
        read_only_fields = ('date_joined', 'last_login')
    
    def get_profile(self, obj):
        if obj.is_student and hasattr(obj, 'student_profile'):
            return StudentProfileSerializer(obj.student_profile).data
        elif obj.is_admin and hasattr(obj, 'admin_profile'):
            return AdminProfileSerializer(obj.admin_profile).data
        elif obj.is_instructor and hasattr(obj, 'instructor_profile'):
            return InstructorProfileSerializer(obj.instructor_profile).data
        return None

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = '__all__'

class InstructorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstructorProfile
        fields = '__all__'

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone_number', 
                 'address', 'date_of_birth', 'profile_picture')
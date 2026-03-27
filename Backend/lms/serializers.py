#lms/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *
from .validators import validate_pdf_file

User = get_user_model()


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ['id', 'name', 'code', 'department', 'description']


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description',
            'credits', 'instructor', 'instructor_name',
            'created_at', 'updated_at', 'color', 'program_name', 'gpa_applicable', 'offering_type', 'semester', 'department', 'program'
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
            'enrollment_date'
        ]

    # def validate(self, data):
    #     request = self.context['request']

    #     if request.user.role == 'student':
    #         if data.get('student') and data.get('student') != request.user:
    #             raise serializers.ValidationError("You can only enroll yourself")

    #     return data

class ExamTimetableSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    class Meta:
        model = ExamTimetable
        fields = [
            'id', 'course', 'course_name', 'semester',
            'title', 'pdf', 'pdf_url', 'created_at'
        ]

    def get_pdf_url(self, obj):
        return obj.pdf.url if obj.pdf else None

    def validate_pdf(self, value):
        if value and not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be under  MB.")
        return value    

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    course_code = serializers.CharField(source='exam.course.code', read_only=True)

    class Meta:
        model = ExamResult
        fields = [
            'id', 'student', 'student_name',
            'exam', 'exam_title',
            'score', 'grade', 'course_code',
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
    

# ---------- ACADEMIC STRUCTURE SERIALIZERS ----------

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['id', 'name', 'code', 'description']


class DepartmentSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'faculty', 'faculty_name', 'description']


class BatchSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Batch
        fields = ['id', 'name', 'year', 'department', 'department_name']


class ModuleSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    
    class Meta:
        model = Module
        fields = ['id', 'code', 'name', 'course', 'course_name', 'course_code', 'credits']


# ---------- BASE APPEAL SERIALIZER ----------

class BaseAppealSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    appeal_type_display = serializers.CharField(source='get_appeal_type_display', read_only=True)
    supporting_documents = serializers.FileField(validators=[validate_pdf_file], required=False, allow_null=True)
    
    class Meta:
        abstract = True
        fields = [
            'id', 'appeal_id', 'appeal_type', 'appeal_type_display', 'status',
            'student', 'student_name', 'academic_year','department', 'department_name',
            'faculty', 'faculty_name','batch',
            'batch_name', 'title', 'description',
            'supporting_documents', 'review_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['appeal_id', 'status', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']


# ---------- CONCRETE APPEAL SERIALIZERS ----------

class BursaryAppealSerializer(BaseAppealSerializer):
    income_certificate = serializers.FileField(
        validators=[validate_pdf_file],
        required=True,
        error_messages={'required': 'Income certificate is required'}
    )
    bank_statements = serializers.FileField(
        validators=[validate_pdf_file], 
        required=False, 
        allow_null=True
    )
    
    class Meta(BaseAppealSerializer.Meta):
        model = BursaryAppeal
        fields = BaseAppealSerializer.Meta.fields + [
            'family_income_bracket', 'has_scholarship', 'reason_for_aid',
            'income_certificate', 'bank_statements', 'approved_amount'
        ]
        read_only_fields = BaseAppealSerializer.Meta.read_only_fields + ['approved_amount']


class HostelAppealSerializer(BaseAppealSerializer):
    medical_certificate = serializers.FileField(
        validators=[validate_pdf_file], 
        required=False, 
        allow_null=True
    )
    
    class Meta(BaseAppealSerializer.Meta):
        model = HostelAppeal
        fields = BaseAppealSerializer.Meta.fields + [
            'preferred_check_in', 'duration_months', 'special_requirements',
            'has_medical_condition', 'medical_certificate',
            'allocated_room_number', 'allocated_hostel', 'check_in_date', 'check_out_date'
        ]
        read_only_fields = BaseAppealSerializer.Meta.read_only_fields + [
            'allocated_room_number', 'allocated_hostel', 'check_in_date', 'check_out_date'
        ]


class ExamRewriteAppealSerializer(BaseAppealSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    # module_name = serializers.CharField(source='module.name', read_only=True)
    medical_certificate = serializers.FileField(
        validators=[validate_pdf_file], 
        required=False, 
        allow_null=True
    )
    
    class Meta(BaseAppealSerializer.Meta):
        model = ExamRewriteAppeal
        fields = BaseAppealSerializer.Meta.fields + [
            'course', 'course_name', 'semester',
            'original_exam_date', 'reason_type', 'detailed_reason',
            'medical_certificate', 'new_exam_date', 'exam_venue'
        ]
        read_only_fields = BaseAppealSerializer.Meta.read_only_fields + [
            'new_exam_date', 'exam_venue'
        ]


class MedicalLeaveAppealSerializer(BaseAppealSerializer):
    medical_report = serializers.FileField(
        validators=[validate_pdf_file],
        required=True,
        error_messages={'required': 'Medical report is required'}
    )
    hospital_letter = serializers.FileField(
        validators=[validate_pdf_file],
        required=True,
        error_messages={'required': 'Hospital letter is required'}
    )

    class Meta(BaseAppealSerializer.Meta):
        model = MedicalLeaveAppeal
        fields = BaseAppealSerializer.Meta.fields + [
            'start_date', 'end_date', 'diagnosis', 'hospital_name', 'doctor_name',
            'medical_report', 'hospital_letter', 'approved_leave_days'
        ]
        read_only_fields = BaseAppealSerializer.Meta.read_only_fields + ['approved_leave_days']


class ResultReEvaluationAppealSerializer(BaseAppealSerializer):
    exam_result_details = ExamResultSerializer(source='exam_result', read_only=True)
    
    class Meta(BaseAppealSerializer.Meta):
        model = ResultReEvaluationAppeal
        fields = BaseAppealSerializer.Meta.fields + [
            'exam_result', 'exam_result_details', 'reason_type', 'specific_concerns',
            'reviewed_by_instructor', 'new_marks', 'new_grade', 'review_comments'
        ]
        read_only_fields = BaseAppealSerializer.Meta.read_only_fields + [
            'reviewed_by_instructor', 'new_marks', 'new_grade', 'review_comments'
        ]


class AppealReviewQueueSerializer(serializers.ModelSerializer):
    appeal_details = serializers.SerializerMethodField()
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    
    class Meta:
        model = AppealReviewQueue
        fields = '__all__'
    
    def get_appeal_details(self, obj):
        if not obj.appeal:
            return None
        if isinstance(obj.appeal, BursaryAppeal):
            return BursaryAppealSerializer(obj.appeal).data
        elif isinstance(obj.appeal, HostelAppeal):
            return HostelAppealSerializer(obj.appeal).data
        elif isinstance(obj.appeal, ExamRewriteAppeal):
            return ExamRewriteAppealSerializer(obj.appeal).data
        elif isinstance(obj.appeal, MedicalLeaveAppeal):
            return MedicalLeaveAppealSerializer(obj.appeal).data
        elif isinstance(obj.appeal, ResultReEvaluationAppeal):
            return ResultReEvaluationAppealSerializer(obj.appeal).data
        return None


class AppealAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file = serializers.FileField(
        validators=[validate_pdf_file],
        required=True,
        error_messages={'required': 'File is required'}
    )

    class Meta:
        model = AppealAttachment
        fields = ['id', 'file', 'description', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['uploaded_at']


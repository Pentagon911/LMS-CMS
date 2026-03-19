from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsAdminOrInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'instructor']

class IsEnrolledStudentOrStaff(permissions.BasePermission):
    """
    Object-level permission: allow if user is admin, instructor of the course, or the enrolled student.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'admin':
            return True
        if user.role == 'instructor':
            # For Enrollment/ExamResult, check if the course is taught by this instructor
            if hasattr(obj, 'course'):
                return obj.course.instructor == user
            elif hasattr(obj, 'exam'):
                return obj.exam.course.instructor == user
        if user.role == 'student':
            # For Enrollment/ExamResult, check if the student field matches
            if hasattr(obj, 'student'):
                return obj.student == user
        return False
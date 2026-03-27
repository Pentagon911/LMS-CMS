from rest_framework import permissions

class IsAdminOrSelf(permissions.BasePermission):
    """
    Custom permission to only allow users to edit their own profile
    or allow admin users to edit any profile.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the user themselves or admin
        return obj == request.user or request.user.is_admin


class IsRoleAllowed(permissions.BasePermission):
    """
    Custom permission to only allow users with specific roles.
    Usage: 
    permission_classes = [IsRoleAllowed]
    allowed_roles = ['admin', 'instructor']
    
    Or as a class:
    @method_decorator(decorator=IsRoleAllowed(['admin', 'instructor']))
    """
    
    def __init__(self, allowed_roles=None):
        self.allowed_roles = allowed_roles or []
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # If no specific roles are required, just check authentication
        if not self.allowed_roles:
            return True
        
        return request.user.role in self.allowed_roles


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_admin
        )


class IsStudentUser(permissions.BasePermission):
    """
    Custom permission to only allow student users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_student
        )


class IsInstructorUser(permissions.BasePermission):
    """
    Custom permission to only allow instructor users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_instructor
        )


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow staff (lecturers, instructors, admin) 
    to edit, but anyone authenticated can read.
    """
    
    def has_permission(self, request, view):
        # Allow read methods for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write methods only for staff roles
        return (
            request.user.is_authenticated and 
            request.user.role in ['admin', 'instructor']
        )


class IsAdminOrInstructor(permissions.BasePermission):
    """
    Allow access only to admin or instructor users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'instructor']


# NEW PERMISSION CLASS FOR COURSE INSTRUCTOR ACCESS
class IsCourseInstructor(permissions.BasePermission):
    """
    Custom permission to check if user is one of the instructors for a specific course.
    Use this for object-level permissions on course-related views.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin always has access
        if request.user.is_admin:
            return True
        
        # Check if user is a student (students can't access instructor-only actions)
        if request.user.is_student:
            return False
        
        # For instructor, check if they are in the course's instructors list
        if request.user.is_instructor:
            # If obj is a Course, check directly
            if hasattr(obj, 'instructors'):
                return request.user in obj.instructors.all()
            # If obj has a course attribute (like Enrollment, ExamTimetable, etc.)
            elif hasattr(obj, 'course'):
                return request.user in obj.course.instructors.all()
        
        return False


class IsCourseInstructorForAction(permissions.BasePermission):
    """
    Permission to check if user is an instructor for the course
    when the course is passed via URL parameter or queryset.
    This is for view-level permissions where the course ID is in kwargs.
    """
    
    def has_permission(self, request, view):
        # Admin always has permission
        if request.user.is_admin:
            return True
        
        # Only instructors need to be checked
        if not request.user.is_instructor:
            return False
        
        # Get course ID from URL kwargs or query params
        course_id = None
        
        # Try to get from URL kwargs
        if hasattr(view, 'kwargs') and 'pk' in view.kwargs:
            course_id = view.kwargs.get('pk')
        
        # If not found, try from query params
        if not course_id and hasattr(request, 'query_params'):
            course_id = request.query_params.get('course')
        
        if course_id:
            from lms.models import Course
            try:
                course = Course.objects.get(id=course_id)
                return request.user in course.instructors.all()
            except Course.DoesNotExist:
                return False
        
        # If no course ID found, deny access
        return False


class IsEnrolledStudent(permissions.BasePermission):
    """
    Check if student is enrolled in the course.
    Use for object-level permissions on enrollment-related views.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin always has access
        if request.user.is_admin:
            return True
        
        # Check if user is the student
        if request.user.is_student:
            # For Enrollment object
            if hasattr(obj, 'student'):
                return obj.student == request.user
            # For other objects with student relationship
            elif hasattr(obj, 'student'):
                return obj.student == request.user
        
        return False
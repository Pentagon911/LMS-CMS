#user/permissions.py
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
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import User
from .serializers import (
    UserRegistrationSerializer, UserDetailSerializer, 
    UserUpdateSerializer, StudentProfileSerializer,
    AdminProfileSerializer, InstructorProfileSerializer
)
from .permissions import (
    IsAdminOrSelf, IsAdminUser, IsRoleAllowed, 
    IsStaffOrReadOnly
)


class UserRegistrationView(generics.CreateAPIView):
    """
    Public endpoint for user registration.
    Anyone can register, but profile is created based on role.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    @transaction.atomic
    def perform_create(self, serializer):
        # Serializer's create method handles profile creation
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Get the created user
        user = serializer.instance
        
        # Return custom response
        return Response({
            'message': f'{user.role.capitalize()} registered successfully',
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update user details.
    Users can update their own profile, admins can update any profile.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserDetailSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Profile updated successfully',
            'user': UserDetailSerializer(instance).data
        })


class UserListView(generics.ListAPIView):
    """
    List all users with optional filtering.
    Only accessible by admin users.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by name, username, or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Date range filters
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(date_joined__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(date_joined__lte=end_date)
        
        return queryset.order_by('-date_joined')


class UserProfileView(generics.RetrieveAPIView):
    """
    Get current authenticated user's profile.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UpdateProfilePictureView(APIView):
    """
    Update current user's profile picture.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if 'profile_picture' not in request.FILES:
            return Response(
                {'error': 'No image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete old profile picture if exists
        if user.profile_picture:
            user.profile_picture.delete(save=False)
        
        # Save new profile picture
        user.profile_picture = request.FILES['profile_picture']
        user.save()
        
        return Response({
            'message': 'Profile picture updated successfully',
            'profile_picture': request.build_absolute_uri(user.profile_picture.url)
        }, status=status.HTTP_200_OK)
    
    def delete(self, request):
        """Remove profile picture"""
        user = request.user
        
        if user.profile_picture:
            user.profile_picture.delete(save=True)
            return Response({
                'message': 'Profile picture removed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'No profile picture to remove'
        }, status=status.HTTP_200_OK)


class StudentListView(generics.ListAPIView):
    """
    List all students.
    Accessible by admin and instructor.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAllowed]
    allowed_roles = ['admin', 'instructor']
    
    def get_queryset(self):
        return User.objects.filter(role=User.Role.STUDENT).order_by('-date_joined')


class InstructorListView(generics.ListAPIView):
    """
    List all instructors.
    Only accessible by admin.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return User.objects.filter(role=User.Role.INSTRUCTOR).order_by('-date_joined')


class AdminListView(generics.ListAPIView):
    """
    List all admins.
    Only accessible by admin.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return User.objects.filter(role=User.Role.ADMIN).order_by('-date_joined')


class UserStatsView(APIView):
    """
    Get user statistics.
    Only accessible by admin.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'by_role': {
                'students': User.objects.filter(role=User.Role.STUDENT).count(),
                'instructors': User.objects.filter(role=User.Role.INSTRUCTOR).count(),
                'admins': User.objects.filter(role=User.Role.ADMIN).count(),
            },
            'recent_joins': UserDetailSerializer(
                User.objects.order_by('-date_joined')[:5], 
                many=True
            ).data
        }
        
        return Response(stats)


class BulkUserCreateView(APIView):
    """
    Bulk create users.
    Only accessible by admin.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        users_data = request.data.get('users', [])
        
        if not users_data:
            return Response(
                {'error': 'No user data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_users = []
        errors = []
        
        with transaction.atomic():
            for index, user_data in enumerate(users_data):
                serializer = UserRegistrationSerializer(data=user_data)
                
                if serializer.is_valid():
                    user = serializer.save()
                    created_users.append(UserDetailSerializer(user).data)
                else:
                    errors.append({
                        'index': index,
                        'data': user_data,
                        'errors': serializer.errors
                    })
        
        return Response({
            'message': f'Successfully created {len(created_users)} users',
            'created_users': created_users,
            'errors': errors,
            'total_created': len(created_users),
            'total_errors': len(errors)
        }, status=status.HTTP_201_CREATED if created_users else status.HTTP_400_BAD_REQUEST)


class ProfileDetailView(generics.RetrieveAPIView):
    """
    Get detailed profile information for a specific user based on their role.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    
    def get_object(self):
        if 'pk' in self.kwargs:
            return get_object_or_404(User, pk=self.kwargs['pk'])
        return self.request.user
    # def get(self, request, pk=None):
    #     user = get_object_or_404(User, pk=pk) if pk else request.user
        
    #     profile_data = {
    #         'user': UserDetailSerializer(user).data
    #     }
        
    #     # Add role-specific profile data
    #     if user.is_student and hasattr(user, 'student_profile'):
    #         profile_data['profile'] = StudentProfileSerializer(user.student_profile).data
    #     elif user.is_admin and hasattr(user, 'admin_profile'):
    #         profile_data['profile'] = AdminProfileSerializer(user.admin_profile).data
    #     elif user.is_instructor and hasattr(user, 'instructor_profile'):
    #         profile_data['profile'] = InstructorProfileSerializer(user.instructor_profile).data
        
    #     return Response(profile_data)
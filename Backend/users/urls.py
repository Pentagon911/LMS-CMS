from django.urls import path
from . import views

urlpatterns = [
    # Registration and profile
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/picture/', views.UpdateProfilePictureView.as_view(), name='update-profile-picture'),
    path('profile/detail/', views.ProfileDetailView.as_view(), name='profile-detail'),
    
    # User management
    path('', views.UserListView.as_view(), name='user-list'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('bulk-create/', views.BulkUserCreateView.as_view(), name='user-bulk-create'),
    
    # Role-based lists
    path('students/', views.StudentListView.as_view(), name='student-list'),
    path('instructors/', views.InstructorListView.as_view(), name='instructor-list'),
    path('admins/', views.AdminListView.as_view(), name='admin-list'),
    
    # Individual user operations
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('<int:pk>/profile/', views.ProfileDetailView.as_view(), name='user-profile-detail'),
    
]
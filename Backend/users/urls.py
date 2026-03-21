from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),

    # Registration
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('bulk-create/', views.BulkUserCreateView.as_view(), name='user-bulk-create'),
    
    # User profile
    path('profile/', views.UserDetailView.as_view(), name='user-profile'),  # Current user
    path('profile/me/', views.UserDetailView.as_view(), {'pk': 'me'}, name='profile-me'),  # Explicit current user
    path('profile/<int:pk>/', views.UserDetailView.as_view(), name='profile-detail'),  # Specific user find by userID
    path('profile/picture/', views.UserDetailView.as_view(), name='update-profile-picture'),   

    # User management
    path('', views.UserListView.as_view(), name='user-list'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    
    # Role-based lists
    path('students/', views.StudentListView.as_view(), name='student-list'),
    path('instructors/', views.InstructorListView.as_view(), name='instructor-list'),
    path('admins/', views.AdminListView.as_view(), name='admin-list'),
   
]
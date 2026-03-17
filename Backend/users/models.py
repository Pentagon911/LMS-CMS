from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    """custom User Model for LMS"""

    #Roles
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        ADMIN = "admin", "Admin"
        INSTRUCTOR = "instructor", "Instructor"

    # Basic Information
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True
    )
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')],
        blank=True
    )
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        null=True,
        blank=True
    )
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(max_length=500, blank=True)
    
    # Status fields
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Track password changes
    last_password_change = models.DateTimeField(null=True, blank=True)

    # Metadata
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email', 'role']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
    
    @property
    def is_student(self):
        return self.role == self.Role.STUDENT
    
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    @property
    def is_instructor(self):
        return self.role == self.Role.INSTRUCTOR
    
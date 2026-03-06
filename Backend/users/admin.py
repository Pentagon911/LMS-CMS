from django.contrib import admin
from .models import User
from .profiles import StudentProfile, AdminProfile, InstructorProfile
# Register your models here.

admin.site.register(User)
admin.site.register(AdminProfile)
admin.site.register(InstructorProfile)
admin.site.register(StudentProfile)
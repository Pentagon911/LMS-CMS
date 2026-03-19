from django.contrib import admin
from .models import Course, Enrollment, ExamTimetable, ExamResult, SystemSetting

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'credits', 'instructor', 'created_at')
    search_fields = ('code', 'name')
    list_filter = ('credits', 'instructor')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'status', 'enrollment_date')
    list_filter = ('status', 'course')
    search_fields = ('student__username', 'course__code')

@admin.register(ExamTimetable)
class ExamTimetableAdmin(admin.ModelAdmin):
    list_display = ('course', 'title', 'date', 'start_time', 'location')
    list_filter = ('date', 'course')

@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'score', 'grade')
    list_filter = ('exam__course',)

@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at')
    search_fields = ('key',)
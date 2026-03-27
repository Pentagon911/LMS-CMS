# CMS/ admin.py
from django.contrib import admin
from .models import*
# Register your models here.
admin.site.register(Week)
admin.site.register(Video)
admin.site.register(Pdf)
admin.site.register(Link)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Announcement)
admin.site.register(Option)
admin.site.register(QuizAttempt)
admin.site.register(StudentAnswer)

from .models import GlobalAnnouncement

@admin.register(GlobalAnnouncement)
class GlobalAnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'target_type', 'is_active', 'created_by', 'created_at']
    list_filter = ['target_type', 'is_active', 'created_at']
    search_fields = ['title', 'content']
    filter_horizontal = ['faculties', 'departments', 'batches', 'programs']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Announcement Information', {
            'fields': ('title', 'content', 'pdf_file')
        }),
        ('Targeting', {
            'fields': ('target_type', 'faculties', 'departments', 'batches', 'programs')
        }),
        ('Publishing', {
            'fields': ('is_active', 'publish_from', 'publish_until')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
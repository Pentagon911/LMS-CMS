from django.urls import path
from . import views

urlpatterns = [
    # ---------- STUDENT APPEALS ----------
    path('appeals/bursary/', views.BursaryAppealListCreateView.as_view(), name='bursary-list'),                         # Student: Submit bursary application / Admin: List all bursary appeals
    path('appeals/bursary/<int:pk>/', views.BursaryAppealDetailView.as_view(), name='bursary-detail'),                  # Retrieve/Update/Delete specific bursary appeal (owner or admin)
    path('appeals/hostel/', views.HostelAppealListCreateView.as_view(), name='hostel-list'),                            # Student: Submit hostel application / Admin: List all hostel appeals
    path('appeals/hostel/<int:pk>/', views.HostelAppealDetailView.as_view(), name='hostel-detail'),                     # Retrieve/Update/Delete specific hostel appeal (owner or admin)
    path('appeals/exam-rewrite/', views.ExamRewriteAppealListCreateView.as_view(), name='exam-rewrite-list'),           # Student: Request exam rewrite / Admin: List all exam rewrite appeals
    path('appeals/exam-rewrite/<int:pk>/', views.ExamRewriteAppealDetailView.as_view(), name='exam-rewrite-detail'),    # Retrieve/Update/Delete specific exam rewrite appeal
    path('appeals/medical-leave/', views.MedicalLeaveAppealListCreateView.as_view(), name='medical-leave-list'),        # Student: Apply for medical leave / Admin: List all medical leave appeals
    path('appeals/medical-leave/<int:pk>/', views.MedicalLeaveAppealDetailView.as_view(), name='medical-leave-detail'), # Retrieve/Update/Delete specific medical leave appeal
    path('appeals/result-reeval/', views.ResultReEvaluationAppealListCreateView.as_view(), name='reeval-list'),         # Student: Request result re-evaluation / Admin: List all re-evaluation appeals
    path('appeals/result-reeval/<int:pk>/', views.ResultReEvaluationAppealDetailView.as_view(), name='reeval-detail'),  # Retrieve/Update/Delete specific re-evaluation appeal
    path('appeals/my/', views.StudentMyAppealsView.as_view(), name='my-appeals'),                                       # Student: Get all my appeals across all types
    
    # ---------- ADMIN APPEAL REVIEW ----------
    path('admin/appeals/bursary/pending/', views.AdminPendingBursaryView.as_view(), name='pending-bursary'),            # Admin: View all pending bursary appeals
    path('admin/appeals/hostel/pending/', views.AdminPendingHostelView.as_view(), name='pending-hostel'),               # Admin: View all pending hostel appeals
    path('admin/appeals/exam-rewrite/pending/', views.AdminPendingExamRewriteView.as_view(), name='pending-exam'),      # Admin: View all pending exam rewrite appeals
    path('admin/appeals/medical-leave/pending/', views.AdminPendingMedicalLeaveView.as_view(), name='pending-medical'), # Admin: View all pending medical leave appeals
    path('admin/appeals/result-reeval/pending/', views.AdminPendingReevalView.as_view(), name='pending-reeval'),        # Admin: View all pending re-evaluation appeals
    
    # ---------- ADMIN PROCESSING (APPROVE/REJECT) ----------
    path('admin/appeals/bursary/<int:pk>/process/', views.AdminProcessBursaryView.as_view(), name='process-bursary'),            # Admin: Approve/reject bursary appeal with amount
    path('admin/appeals/hostel/<int:pk>/process/', views.AdminProcessHostelView.as_view(), name='process-hostel'),               # Admin: Approve/reject hostel appeal with room allocation
    path('admin/appeals/exam-rewrite/<int:pk>/process/', views.AdminProcessExamRewriteView.as_view(), name='process-exam'),      # Admin: Approve/reject exam rewrite with new schedule
    path('admin/appeals/medical-leave/<int:pk>/process/', views.AdminProcessMedicalLeaveView.as_view(), name='process-medical'), # Admin: Approve/reject medical leave with approved days
    path('admin/appeals/result-reeval/<int:pk>/process/', views.AdminProcessReevalView.as_view(), name='process-reeval'),        # Admin: Approve/reject re-evaluation with grade update
    
    # ---------- REVIEW QUEUE ----------
    path('review-queue/', views.AppealReviewQueueListView.as_view(), name='review-queue'),                       # Admin: View pending review queue with category/department filters
    path('review-queue/<int:pk>/assign/', views.AppealReviewQueueAssignView.as_view(), name='assign-review'),    # Admin: Assign queue item to yourself
    path('review-queue/<int:pk>/process/', views.AppealReviewQueueProcessView.as_view(), name='process-review'), # Admin: Mark queue item as processed
    
    # ---------- ATTACHMENTS ----------
    path('attachments/', views.AppealAttachmentCreateView.as_view(), name='attachment-create'),                     # Upload PDF attachment for an appeal (max 5MB)
    path('appeals/<int:appeal_id>/attachments/', views.AppealAttachmentListView.as_view(), name='attachment-list'), # List all attachments for a specific appeal
    path('attachments/<int:pk>/', views.AppealAttachmentDeleteView.as_view(), name='attachment-delete'),            # Delete specific attachment (owner or admin)
    
    # ---------- DASHBOARDS ----------
    path('dashboard/admin/', views.AdminDashboardView.as_view(), name='admin-dashboard'),           # Admin: Get dashboard with pending appeals and queue statistics
    path('dashboard/student/', views.StudentDashboardView.as_view(), name='student-dashboard'),     # Student: Get personal dashboard with appeal statistics
]
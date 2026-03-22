import { Routes, Route, Navigate } from "react-router-dom";
import CMSLayout from "../modules/cms/components/CMSLayout.jsx";
import LMSLayout from "../modules/lms/components/LMSLayout.jsx";

// LMS Pages
import Login from "../modules/Login.jsx";
import LMSDashboard from "../modules/lms/pages/Dashboard.jsx";
import LMSEditProfile from "../modules/lms/pages/EditProfile.jsx";
import ExamTimeTablePage from "../modules/lms/pages/TimeTablePage.jsx";
import UserManagement from "../modules/lms/pages/UserManagement.jsx";
import CourseManagement from "../modules/lms/pages/CourseManagement.jsx";
import EnrollmentsPage from "../modules/lms/pages/EnrollmentsPage.jsx";
import MyCoursesPage from "../modules/lms/pages/MyCoursesPage.jsx";
import ExamResultsPage from "../modules/lms/pages/ExamResultsPage.jsx";
import UpdateResultsPage from "../modules/lms/pages/UpdateResultsPage.jsx";
import BursaryAppealsPage from "../modules/lms/pages/BursaryAppealsPage.jsx";
import HostelAppealsPage from "../modules/lms/pages/HostelAppealsPage.jsx";
import ExamAppealsPage from "../modules/lms/pages/ExamAppealsPage.jsx";
import MedicalAppealsPage from "../modules/lms/pages/MedicalAppealsPage.jsx";
import BursaryApplicationPage from "../modules/lms/pages/BursaryApplicationPage.jsx";
import HostelApplicationPage from "../modules/lms/pages/HostelApplicationPage.jsx";
import ExamAppealFormPage from "../modules/lms/pages/ExamAppealFormPage.jsx";
import MedicalLeavePage from "../modules/lms/pages/MedicalLeavePage.jsx";
import MyAppealsPage from "../modules/lms/pages/MyAppealsPage.jsx";

//CMS Pages
import CMSDashboard from "../modules/cms/pages/Dashboard.jsx";
import QuizEditor from "../modules/cms/pages/QuizEditor.jsx";
import Coursepage from "../modules/cms/pages/CoursesPage.jsx";
import CourseContentPage from "../modules/cms/pages/CourseContentPage.jsx";
import AnnouncementEditor from "../modules/cms/pages/AnnouncementEditor.jsx";
import Quiz from "../modules/cms/pages/QuizPage.jsx";
import TimeTablePage from "../modules/cms/pages/TimeTablePage.jsx";
import EditProfile from "../modules/cms/pages/EditProfile.jsx";

// --- ProtectedRoute Component ---
function ProtectedRoute({ children }) {
  // TODO: replace with real auth logic
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// --- AppRoutes ---
function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      
      {/* CMS Routes - Each route individually wrapped with CMSLayout */}
      <Route path="/cms/dashboard" element={<CMSLayout> <CMSDashboard /> </CMSLayout>} />
      <Route path="/cms/quiz-editor" element={<CMSLayout> <QuizEditor /> </CMSLayout>} />
      <Route path="/cms/quizes" element={<CMSLayout> <Quiz /> </CMSLayout>} />
      <Route path="/cms/courses" element={<CMSLayout> <Coursepage /> </CMSLayout>} />
      <Route path="/cms/course-content/:moduleCode" element={<CMSLayout> <CourseContentPage /> </CMSLayout>} />
      <Route path="/cms/announcements" element={<CMSLayout> <AnnouncementEditor /> </CMSLayout>} />
      <Route path="/cms/time-tables" element={<CMSLayout> <TimeTablePage /> </CMSLayout>} />
      <Route path="/cms/edit-profile" element={<CMSLayout> <EditProfile /> </CMSLayout>} />

      {/* LMS Routes */}
      <Route path="/lms/dashboard" element={<LMSLayout> <LMSDashboard /> </LMSLayout>} />
      <Route path="/lms/edit-profile" element={<LMSLayout> <LMSEditProfile/> </LMSLayout>} />
      <Route path="/lms/academics/time-tables" element={<LMSLayout> <ExamTimeTablePage /> </LMSLayout>} />
      <Route path="/lms/server-management/users" element={<LMSLayout> <UserManagement /> </LMSLayout>} />
      <Route path="/lms/server-management/courses" element={<LMSLayout> <CourseManagement /> </LMSLayout>} />
      <Route path="/lms/academics/enrollment" element={<LMSLayout><EnrollmentsPage /></LMSLayout>} />
<Route path="/lms/academics/my-courses" element={<LMSLayout><MyCoursesPage /></LMSLayout>} />
<Route path="/lms/academics/results" element={<LMSLayout><ExamResultsPage /></LMSLayout>} />
<Route path="/lms/update-results" element={<LMSLayout><UpdateResultsPage /></LMSLayout>} />

<Route path="/lms/appeals-and-welfare/bursary-appeals" element={<LMSLayout><BursaryAppealsPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/hostel-appeals" element={<LMSLayout><HostelAppealsPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/exam-appeals" element={<LMSLayout><ExamAppealsPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/medical-appeals" element={<LMSLayout><MedicalAppealsPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/bursary" element={<LMSLayout><BursaryApplicationPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/welfare-request" element={<LMSLayout><HostelApplicationPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/my-appeals" element={<LMSLayout><MyAppealsPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/medical-leave" element={<LMSLayout><MedicalLeavePage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/exam-rewrite" element={<LMSLayout><ExamAppealFormPage /></LMSLayout>} />
<Route path="/lms/appeals-and-welfare/appeal/:id" element={<LMSLayout><MyAppealsPage /></LMSLayout>} /> {/* placeholder for detail view */}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;

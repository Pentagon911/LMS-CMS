import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import CMSLayout from "../modules/cms/components/CMSLayout.jsx"; // Import CMS Layout

// LMS Pages
import Login from "../modules/Login.jsx";
import MyAccount from "../modules/lms/pages/MyAccount.jsx";
import MenuBar from "../modules/lms/pages/MenuBar.jsx"; 
import LMSDashboard from "../modules/lms/pages/Dashboard.jsx";

//CMS Pages
import CMSDashboard from "../modules/cms/pages/Dashboard.jsx";
import QuizEditor from "../modules/cms/components/QuizEditor.jsx";
import Coursepage from "../modules/cms/pages/CoursesPage.jsx";
import CourseContentPage from "../modules/cms/pages/CourseContentPage.jsx";
import AnnouncementEditor from "../modules/cms/components/AnnouncementEditor.jsx";

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
      <Route path="/quiz" element={<CMSLayout> <QuizEditor /> </CMSLayout>} />
      <Route path="/cms/courses" element={<CMSLayout> <Coursepage /> </CMSLayout>} />
      <Route path="/cms/course-content" element={<CMSLayout> <CourseContentPage /> </CMSLayout>} />
      <Route path="/cms/announcements" element={<CMSLayout> <AnnouncementEditor /> </CMSLayout>} />

      {/* Protected LMS Routes - NO HEADER */}
      <Route
        path="/lms/*"
        element={
          <ProtectedRoute>
            <MenuBar />
          </ProtectedRoute>
        }
      >
        {/* Nested routes rendered in MenuBar's <Outlet /> */}
        <Route path="dashboard" element={<LMSDashboard />} />
        <Route path="myAccount" element={<MyAccount />} />
        {/* Redirect /lms → /lms/dashboard */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;

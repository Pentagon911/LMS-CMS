import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import CMSLayout from "../modules/cms/components/CMSLayout.jsx"; // Import CMS Layout

// Pages
import Login from "../modules/Login.jsx";
import MyAccount from "../modules/lms/pages/MyAccount.jsx";
import MenuBar from "../modules/lms/pages/MenuBar.jsx"; 
import Dashboard from "../modules/lms/pages/Dashboard.jsx";
import CMS from "../modules/cms/FakeApp.jsx";
import QuizEditor from "../modules/cms/components/QuizEditor.jsx"

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
      <Route 
        path="/cms" 
        element={
          <CMSLayout>
            <CMS />
          </CMSLayout>
        } 
      />

      <Route 
        path="/quiz" 
        element={
          <CMSLayout>
            <QuizEditor />
          </CMSLayout>
        } 
      />

      {/* Add more CMS routes here later */}
      <Route 
        path="/cms/pages" 
        element={
          <CMSLayout>
            <div>CMS Pages</div>
          </CMSLayout>
        } 
      />

      <Route 
        path="/cms/media" 
        element={
          <CMSLayout>
            <div>CMS Media</div>
          </CMSLayout>
        } 
      />

      <Route 
        path="/cms/settings" 
        element={
          <CMSLayout>
            <div>CMS Settings</div>
          </CMSLayout>
        } 
      />

      {/* Protected LMS Routes - NO HEADER (friend's navigation only) */}
      <Route
        path="/lms/*"
        element={
          <ProtectedRoute>
            <MenuBar />
          </ProtectedRoute>
        }
      >
        {/* Nested routes rendered in MenuBar's <Outlet /> */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="myAccount" element={<MyAccount />} />
        {/* Redirect /lms → /lms/dashboard */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Protect root / route as well */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <h1>Home Page</h1>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;

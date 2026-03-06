import { Routes, Route, Navigate, Outlet } from "react-router-dom";

// Pages
import Login from "../modules/Login.jsx";
import MyAccount from "../modules/lms/pages/MyAccount.jsx";
import MenuBar from "../modules/lms/pages/MenuBar.jsx"; 
import Dashboard from "../modules/lms/pages/Dashboard.jsx";
import CMS from "../modules/cms/FakeApp.jsx";

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
      <Route path="/cms" element={<CMS />} />

      {/* Protected LMS Routes */}
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

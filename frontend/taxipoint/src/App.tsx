import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Assuming these files exist in your project
import Login from "./screens/users/Login";
import Landing from "./screens/Landing";
import AdminPage from "./screens/AdminPage";

export interface User {
  email: string;
  name: string;
  role: string;
  token: string;
}

const isAuthenticated = (user: User | null) => !!(user && user.token);

const ProtectedRoute: React.FC<{ user: User | null; children: JSX.Element; requiredRole?: string }> = ({ user, children, requiredRole }) => {
  const location = useLocation();

  if (!isAuthenticated(user)) {
    console.log("ProtectedRoute: user not authenticated, redirecting to login");
    // Removed the toast message from here. The logout function now handles toast messages.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log(`ProtectedRoute: user role ${user.role} does not match required ${requiredRole}`);
    toast.warning("You do not have access to this page!");
    return <Navigate to={user.role === "ROLE_ADMIN" ? "/admin" : "/landing"} replace />;
  }

  return children;
};

// We will now create a new component to hold all the logic.
// This component will be rendered inside the Router.
const MainApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // This hook is now called correctly inside a component that is a child of Router

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    console.log("App handleLogin userData:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.info("Logged out successfully!");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} requiredRole="ROLE_ADMIN">
              {user && <AdminPage user={user} onLogout={handleLogout} />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/landing"
          element={
            <ProtectedRoute user={user}>
              {user && <Landing user={user} onLogout={handleLogout} />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            user
              ? user.role === "ROLE_ADMIN"
                ? <Navigate to="/admin" replace />
                : <Navigate to="/landing" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Catch-all route to redirect to the correct home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};


// The main App component now just provides the Router
const App: React.FC = () => (
  <Router>
    <ToastContainer />
    <MainApp />
  </Router>
);

export default App;

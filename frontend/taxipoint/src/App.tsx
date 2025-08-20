import React, { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Screens
import Login from "./screens/users/Login";
import Register from "./screens/users/Register";
import UserSettings from "./screens/UserSettings";
import Landing from "./screens/Landing";
import AdminPage from "./screens/AdminPage";
import About from "./screens/About";
import Support from "./screens/Support";

// User interface
export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  token: string;
}

// Auth helper
const isAuthenticated = (user: User | null) => !!(user && user.token);

// ProtectedRoute component
const ProtectedRoute: React.FC<{
  user: User | null;
  children: ReactElement | null;
  requiredRole?: string;
}> = ({ user, children, requiredRole }) => {
  const location = useLocation();

  if (!isAuthenticated(user)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    toast.warning("You do not have access to this page!");
    // Add null check here to fix the TypeScript error
    return <Navigate to={user?.role === "ROLE_ADMIN" ? "/admin" : "/landing"} replace />;
  }

  return children;
};

// MainApp component
const MainApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleLogin = (userData: any) => {
    // Map UserResponse to User
    const fullUser: User = {
      id: userData.id ?? 0,
      surname: userData.surname ?? "",
      name: userData.name,
      email: userData.email,
      role: userData.role,
      token: userData.token,
    };
    setUser(fullUser);
    localStorage.setItem("user", JSON.stringify(fullUser));
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
          element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} requiredRole="ROLE_ADMIN">
              {user ? <AdminPage user={user} onLogout={handleLogout} /> : null}
            </ProtectedRoute>
          }
        />

        <Route path="/about" element={<About />} />
        <Route path="/support" element={<Support />} />

        <Route
          path="/landing"
          element={
            <ProtectedRoute user={user}>
              {user ? <Landing user={user} onLogout={handleLogout} /> : null}
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user}>
              {user ? <UserSettings user={user} onUpdateUser={setUser} /> : null}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// Main App
const App: React.FC = () => (
  <Router>
    <ToastContainer />
    <MainApp />
  </Router>
);

export default App;
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/users/Login';
import Register from './screens/users/Register';
import Landing from './screens/Landing';
import AdminPage from './screens/AdminPage'; // Assuming you have this component
import 'leaflet/dist/leaflet.css';

interface User {
  email: string;
  role?: string;
  token?: string;
}

// Function to get the initial user state from localStorage
const getInitialUser = (): User | null => {
  try {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    localStorage.removeItem('user');
    return null;
  }
};

function App() {
  const [user, setUser] = useState<User | null>(getInitialUser);

  // The rest of your component remains the same
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // The PrivateRoute component is a good way to manage access control
  const PrivateRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode; allowedRoles?: string[] }) => {
    if (!user) {
      // Not logged in, redirect to login
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role)) {
      // Logged in but not authorized, redirect to landing page
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Home page for both regular and admin users */}
        <Route
          path="/"
          element={
            <PrivateRoute allowedRoles={['ROLE_USER', 'ROLE_ADMIN']}>
              {/* Redirect to the appropriate page after login */}
              {user?.role === "ROLE_ADMIN" ? <Navigate to="/admin" /> : <Navigate to="/landing" />}
            </PrivateRoute>
          }
        />

        {/* Landing page for regular users */}
        <Route
          path="/landing"
          element={
            <PrivateRoute allowedRoles={['ROLE_USER']}>
              <Landing onLogout={handleLogout} user={user!} />
            </PrivateRoute>
          }
        />

        {/* Admin page for admins only */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminPage onLogout={handleLogout} user={user!} />
            </PrivateRoute>
          }
        />
        
        {/* Redirect any other path to the appropriate page */}
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

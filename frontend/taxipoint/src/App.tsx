import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/users/Login';
import Register from './screens/users/Register';
import Landing from './screens/Landing'; // Landing page component

function App() {
  // user: full user object or null
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Role-based private route component
  const PrivateRoute = ({ children, allowedRoles = [] }) => {
    if (!user) {
      // Not logged in -> redirect to register
      return <Navigate to="/register" replace />;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Logged in but no permission -> redirect to login
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            <PrivateRoute allowedRoles={['ROLE_USER', 'ROLE_ADMIN']}>
              <Landing onLogout={handleLogout} user={user} />
            </PrivateRoute>
          }
        />
        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to={user ? '/' : '/register'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

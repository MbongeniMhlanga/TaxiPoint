import React, { useState } from 'react';
import Login from '../auth/LoginScreen'; 
import Landing from '../home/Landing';

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    // Show Login screen if user is not logged in
    return <Login onLogin={setUser} />;
  }

  // Once logged in, show Landing page
  return <Landing user={user} />;
}

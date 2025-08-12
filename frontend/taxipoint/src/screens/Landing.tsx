interface LandingProps {
    user: string;
    onLogout: () => void;
  }
  
  const Landing = ({ user, onLogout }: LandingProps) => {
    return (
      <div style={{ padding: 20 }}>
        <h1>Welcome, {user}!</h1>
        <button onClick={onLogout}>Logout</button>
        {/* Your landing page content */}
      </div>
    );
  };
  
  export default Landing;
  
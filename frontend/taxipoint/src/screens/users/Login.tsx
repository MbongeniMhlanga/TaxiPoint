import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

interface User {
  email: string;
  role?: string;
}

interface LoginProps {
  onLogin: (userData: User) => void;
}

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { email?: string; password?: string } | undefined;

  const [form, setForm] = useState<LoginForm>({
    email: state?.email || '',
    password: state?.password || '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const contentType = res.headers.get('content-type');
      let data: User | null = null;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        toast.error(data?.message || `Login failed with status ${res.status}`);
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${form.email}!`);
      onLogin(data!);  // pass full user object

      // Redirect to landing page
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
          disabled={isLoading}
        />
        <button type="submit" style={{ width: '100%', padding: 10 }} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '10px', textAlign: 'center' }}>
        Don't have an account?{' '}
        <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ color: 'blue' }}>
          Register
        </a>
      </p>
    </div>
  );
};

export default Login;

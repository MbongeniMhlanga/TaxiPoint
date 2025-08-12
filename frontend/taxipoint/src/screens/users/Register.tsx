import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface RegisterForm {
  name: string;
  surname: string;
  email: string;
  password: string;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    surname: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Registration failed with status ${res.status}. ${errorBody}`);
      }

      await res.json();

      toast.success('Registration successful! Redirecting to login...');
      // Redirect to login with email and password autofilled
      navigate('/login', { state: { email: form.email, password: form.password } });

      // Optionally clear form
      setForm({ name: '', surname: '', email: '', password: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="First Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <input
          type="text"
          name="surname"
          placeholder="Surname"
          value={form.surname}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <button type="submit" style={{ width: '100%', padding: 10 }}>
          Register
        </button>
      </form>
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
        <hr style={{ flex: 1, borderTop: '1px solid #ccc' }} />
        <span style={{ padding: '0 10px', color: '#888' }}>or</span>
        <hr style={{ flex: 1, borderTop: '1px solid #ccc' }} />
      </div>
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <button 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: 10, backgroundColor: '#fff', border: '1px solid #ddd', cursor: 'pointer' }}
          onClick={() => alert('Google login not implemented.')}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M44.5 20H24V28.2H35.8C35.2 31.5 32.7 34.6 29 36.6V42H35.5C40.6 37.3 43.6 30.6 44.5 20Z" fill="#4285F4"/>
            <path d="M24 44C30.6 44 36.1 41.8 40.5 37.9L35.5 31.9C33.1 33.5 29.8 34.4 26 34.4C18.8 34.4 12.8 29.5 10.5 23.3L4.7 27.6C6.7 33.5 11.9 38.6 18.2 41.5L24 44Z" fill="#34A853"/>
            <path d="M10.5 23.3C10 21.8 9.7 20.3 9.7 18.7C9.7 17.1 10 15.6 10.5 14.1L4.7 9.8C3.1 13.7 2.1 18.1 2.1 22.8C2.1 27.5 3.1 31.9 4.7 35.8L10.5 23.3Z" fill="#FBBC04"/>
            <path d="M26 13.8C29.6 13.8 31.9 15.3 33.2 16.5L38.4 11.3C36.1 9.1 33.1 7.4 29.7 6.4C26.3 5.4 22.6 5.4 19.3 6.4C12.4 8.7 7.2 13.8 5.2 20.1L10.5 24.4C11.6 20.9 14.1 18.2 17.5 16.8C19.9 15.8 22.9 15.8 26 13.8Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <button 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: 10, backgroundColor: '#1877F2', color: '#fff', border: '1px solid #ddd', cursor: 'pointer' }}
          onClick={() => alert('Facebook login not implemented.')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#fff"/>
            <path d="M18.1 12H15.1V10C15.1 9.34 15.16 8.75 16.03 8.75H17.9V5.5H15.1C12.38 5.5 11.23 7.14 11.23 9.77V12H9V15.1H11.23V21H14.43V15.1H17.2L18.1 12Z" fill="#1877F2"/>
          </svg>
          Continue with Facebook
        </button>
      </div>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already a user?{' '}
        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: 'blue' }}>
          Log in
        </a>
      </p>
    </div>
  );
};

export default Register;

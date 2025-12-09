import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ThemeToggle from "../../components/ThemeToggle";

// SVG components (Google, Facebook, Eye, EyeSlash)
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.61 20.083H42V20H24v8h11.309a11.523 11.523 0 0 1-4.996 7.348v5.525h7.172c4.167-3.834 6.587-9.408 6.587-16.143 0-.805-.072-1.583-.192-2.327z" />
    <path fill="#4CAF50" d="M24 44c5.966 0 10.96-1.977 14.61-5.385l-7.172-5.525c-1.921 1.293-4.382 2.063-7.438 2.063-5.718 0-10.584-3.874-12.333-9.083H4.07v5.694C7.818 39.754 15.42 44 24 44z" />
    <path fill="#1976D2" d="M11.667 27.917c-.572-1.696-.893-3.498-.893-5.5s.32-3.804.893-5.5V11.72H4.07C2.083 15.6 1 19.64 1 23.917s1.083 8.317 3.07 12.197l7.597-5.694z" />
    <path fill="#E53935" d="M24 10.167c3.273 0 6.276 1.18 8.604 3.42l6.34-6.34c-3.79-3.535-8.775-5.602-14.944-5.602C15.42 1.64 7.818 5.887 4.07 11.72l7.597 5.694c1.749-5.21 6.615-9.084 12.333-9.084z" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.309h2l-.209 2.19h-1.791v7.014h-3.097v-7.014h-2.096v-2.19h2.096v-1.549c0-1.584.5-2.812 2.793-2.812h1.536v2.775z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 4.5c-6.5 0-10.3 7.8-10.3 7.8S5.5 19.5 12 19.5c6.5 0 10.3-7.8 10.3-7.8S18.5 4.5 12 4.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 4.5c-6.5 0-10.3 7.8-10.3 7.8S5.5 19.5 12 19.5c6.5 0 10.3-7.8 10.3-7.8S18.5 4.5 12 4.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.8 1.9L22.1 21.2 21.2 22.1 1.9 2.8 2.8 1.9z" />
  </svg>
);
//user
interface UserResponse {
  email: string;
  name: string;
  role: string;
  token: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface LoginProps {
  onLogin: (userData: UserResponse) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("https://taxipoint-backend.onrender.com/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Invalid email or password.");
      }
      const userData: UserResponse = await res.json();
      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
      navigate(userData.role === "ROLE_ADMIN" ? "/admin" : "/landing");
      toast.success(`Welcome back, ${userData.name}!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

      {/* Absolute theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side - Logo & Slogan */}
      <div className="flex flex-col justify-center items-center md:items-start p-8 md:p-16 w-full md:w-1/3 text-center md:text-left bg-blue-600 dark:bg-gray-800 text-white transition-colors duration-300">
        <img src="/favicon.ico" alt="TaxiPoint Logo" className="w-24 h-24 md:w-32 md:h-32 mb-4 bg-white rounded-full p-2" />
        <h1 className="text-3xl md:text-5xl font-bold mb-2">TaxiPoint</h1>
        <p className="text-blue-100 dark:text-gray-300 text-base md:text-lg">Your ride, your way</p>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex justify-center items-center w-full md:w-2/3 p-8 md:p-16">
        <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700 animate-fadeIn transition-colors duration-300">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Login</h2>

          <div className="space-y-3 mb-6">
            <button type="button" onClick={() => toast.info("Google login coming soon!")} className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition">
              <GoogleIcon /> Login with Google
            </button>
            <button type="button" onClick={() => toast.info("Facebook login coming soon!")} className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#1877F2] text-white font-semibold shadow-md hover:bg-[#166fe5] transition">
              <FacebookIcon /> Login with Facebook
            </button>
          </div>

          <div className="flex items-center mb-6">
            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
            <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">or</span>
            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required
              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" disabled={isLoading} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={form.password} onChange={handleChange} required
                className="w-full p-3 pr-10 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" disabled={isLoading} />
              <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400">
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Forgot Password?</button>
            </div>

            <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} className="text-blue-600 dark:text-blue-400 hover:underline">Register</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


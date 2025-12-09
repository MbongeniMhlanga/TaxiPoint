import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ThemeToggle from "../../components/ThemeToggle";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { API_BASE_URL } from "../../config";
import { motion } from "framer-motion";

// Interface for props
interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const navigate = useNavigate();

  // Reset animation every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {


      // ... inside component
      // headers...
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login Failed:", response.status, errorText);

        let errorMessage = `Error (${response.status}): Invalid credentials`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          // response is not JSON
          if (response.status === 404) errorMessage = "Error (404): Endpoint not found";
          if (response.status === 500) errorMessage = "Error (500): Internal Server Error";
        }

        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();

      toast.success("Login successful!");
      onLogin(data);
      navigate(data.role === "ROLE_ADMIN" ? "/admin" : "/landing");

    } catch (error: any) {
      console.error("Login Network Error:", error);
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* Theme Toggle (Absolute) */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* LEFT SIDE: Visual / Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-800 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

        <div className="relative z-10 text-white max-w-lg text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-2xl">
            <span className="text-4xl font-bold text-white">TP</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight">TaxiPoint</h1>
          <p className="text-xl text-blue-100 font-light leading-relaxed">
            Seamless commuting and rank management for the modern era. Connect, commute, and control.
          </p>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-24 right-12 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl"></div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center lg:text-left">
            <motion.h2
              key={animationKey}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {"Welcome to TaxiPoint".split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button type="button" disabled className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-not-allowed opacity-60">
              <FcGoogle size={20} /> Google
            </button>
            <button type="button" disabled className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-not-allowed opacity-60">
              <FaFacebook size={20} color="#1877F2" /> Facebook
            </button>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

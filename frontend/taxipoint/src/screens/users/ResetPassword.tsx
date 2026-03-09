import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ThemeToggle from "../../components/ThemeToggle";
import { Key, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast.error("Invalid reset link");
      navigate("/login");
      return;
    }
    setToken(tokenParam);
    
    // Validate token
    validateToken(tokenParam);
  }, [searchParams, navigate]);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/reset-password/validate?token=${encodeURIComponent(token)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } else {
        setTokenValid(false);
        const errorText = await response.text();
        console.error("Token validation failed:", errorText);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setTokenValid(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password, confirmPassword }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Reset Password Failed:", response.status, errorText);
        
        let errorMessage = "Failed to reset password";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          // Keep default error message
        }
        
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.success("Password reset successfully!");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error: any) {
      console.error("Reset Password Network Error:", error);
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const strength = passedChecks / Object.keys(checks).length;

    return { checks, strength };
  };

  const { checks, strength } = getPasswordStrength(password);

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Reset Link</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

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
            Secure password reset for your TaxiPoint account. Create a new strong password to continue.
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
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Reset Your Password
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400">
              Choose a new password for your account. Make sure it's strong and unique.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                  placeholder="Enter new password"
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

            {/* Password Strength Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Password Strength</span>
                <span className={`font-medium ${
                  strength < 0.4 ? 'text-red-500' : 
                  strength < 0.7 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {strength < 0.4 ? 'Weak' : strength < 0.7 ? 'Medium' : 'Strong'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    strength < 0.4 ? 'bg-red-500' : 
                    strength < 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${strength * 100}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className={checks.length ? "text-green-500" : "text-gray-300"} size={14} />
                  At least 6 characters
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={checks.hasUpper ? "text-green-500" : "text-gray-300"} size={14} />
                  Uppercase letter
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={checks.hasLower ? "text-green-500" : "text-gray-300"} size={14} />
                  Lowercase letter
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={checks.hasNumber ? "text-green-500" : "text-gray-300"} size={14} />
                  Number
                </div>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || password !== confirmPassword || password.length < 6}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Reset Password <CheckCircle size={18} /></>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Remember your password? <button onClick={() => navigate("/login")} className="text-blue-600 hover:text-blue-500 font-medium">Back to Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
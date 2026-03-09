import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ThemeToggle from "../../components/ThemeToggle";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Forgot Password Failed:", response.status, errorText);
        
        let errorMessage = "Failed to process request";
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

      setEmailSent(true);
      toast.success("Password reset email sent successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error: any) {
      console.error("Forgot Password Network Error:", error);
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
            Secure password reset for your TaxiPoint account. We'll send you an email with instructions to reset your password.
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
              Forgot Password?
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                    placeholder="user@example.com"
                    required
                  />
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
                  <>Send Reset Link <Send size={18} /></>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Send className="text-green-600 dark:text-green-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                  Check Your Email
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  The link will expire in 15 minutes for security reasons.
                </p>
              </div>
              
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Redirecting to login in 3 seconds...
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-500 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Login
            </button>
            
            <button
              onClick={() => navigate("/register")}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
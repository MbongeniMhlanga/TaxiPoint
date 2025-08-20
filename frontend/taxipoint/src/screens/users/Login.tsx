import React, { useState, useEffect } from "react";

// SVG components
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.61 20.083H42V20H24v8h11.309a11.523 11.523 0 0 1-4.996 7.348v5.525h7.172c4.167-3.834 6.587-9.408 6.587-16.143 0-.805-.072-1.583-.192-2.327z"/>
    <path fill="#4CAF50" d="M24 44c5.966 0 10.96-1.977 14.61-5.385l-7.172-5.525c-1.921 1.293-4.382 2.063-7.438 2.063-5.718 0-10.584-3.874-12.333-9.083H4.07v5.694C7.818 39.754 15.42 44 24 44z"/>
    <path fill="#1976D2" d="M11.667 27.917c-.572-1.696-.893-3.498-.893-5.5s.32-3.804.893-5.5V11.72H4.07C2.083 15.6 1 19.64 1 23.917s1.083 8.317 3.07 12.197l7.597-5.694z"/>
    <path fill="#E53935" d="M24 10.167c3.273 0 6.276 1.18 8.604 3.42l6.34-6.34c-3.79-3.535-8.775-5.602-14.944-5.602C15.42 1.64 7.818 5.887 4.07 11.72l7.597 5.694c1.749-5.21 6.615-9.084 12.333-9.084z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.309h2l-.209 2.19h-1.791v7.014h-3.097v-7.014h-2.096v-2.19h2.096v-1.549c0-1.584.5-2.812 2.793-2.812h1.536v2.775z"/>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 4.5c-6.5 0-10.3 7.8-10.3 7.8S5.5 19.5 12 19.5c6.5 0 10.3-7.8 10.3-7.8S18.5 4.5 12 4.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 4.5c-6.5 0-10.3 7.8-10.3 7.8S5.5 19.5 12 19.5c6.5 0 10.3-7.8 10.3-7.8S18.5 4.5 12 4.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.8 1.9L22.1 21.2 21.2 22.1 1.9 2.8 2.8 1.9z"/>
  </svg>
);

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

const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${info}`]);
  };

  const checkBackendStatus = async () => {
    addDebugInfo("🔍 Checking backend status...");
    setBackendStatus('checking');
    
    try {
      // Try multiple endpoints to check backend
      const endpoints = [
        'https://taxipoint-backend.onrender.com/api/health',
        'https://taxipoint-backend.onrender.com/api/users/test',
        'https://taxipoint-backend.onrender.com/api/status',
        'https://taxipoint-backend.onrender.com/api',
        'https://taxipoint-backend.onrender.com'
      ];

      let backendOnline = false;
      
      for (const endpoint of endpoints) {
        try {
          addDebugInfo(`🌐 Testing endpoint: ${endpoint}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(endpoint, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json, text/plain, */*',
            }
          });
          
          clearTimeout(timeoutId);
          addDebugInfo(`✅ ${endpoint} responded with status: ${response.status}`);
          backendOnline = true;
          break;
        } catch (err: any) {
          addDebugInfo(`❌ ${endpoint} failed: ${err.message}`);
        }
      }
      
      setBackendStatus(backendOnline ? 'online' : 'offline');
      addDebugInfo(backendOnline ? "✅ Backend is online" : "❌ Backend appears to be offline");
      
    } catch (err: any) {
      addDebugInfo(`❌ Backend check failed: ${err.message}`);
      setBackendStatus('offline');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    addDebugInfo("🚀 Starting login attempt...");
    
    try {
      // Log request details
      addDebugInfo(`📧 Email: ${form.email}`);
      addDebugInfo(`🔑 Password length: ${form.password.length} characters`);
      addDebugInfo(`🌐 API URL: https://taxipoint-backend.onrender.com/api/users/login`);
      
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error("No internet connection detected");
      }
      addDebugInfo("✅ Internet connection detected");

      const requestBody = JSON.stringify(form);
      addDebugInfo(`📦 Request body: ${requestBody}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        addDebugInfo("⏰ Request timeout after 30 seconds");
      }, 30000);

      addDebugInfo("📡 Sending request...");
      const startTime = Date.now();
      
      const res = await fetch("https://taxipoint-backend.onrender.com/api/users/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: requestBody,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      addDebugInfo(`⏱️ Response received in ${responseTime}ms`);
      addDebugInfo(`📊 Status: ${res.status} ${res.statusText}`);
      addDebugInfo(`📋 Headers: ${JSON.stringify(Object.fromEntries(res.headers.entries()))}`);

      if (!res.ok) {
        const errorText = await res.text();
        addDebugInfo(`❌ Error response: ${errorText}`);
        throw new Error(errorText || `Server error: ${res.status}`);
      }

      const responseText = await res.text();
      addDebugInfo(`📥 Raw response: ${responseText}`);
      
      let userData: UserResponse;
      try {
        userData = JSON.parse(responseText);
        addDebugInfo(`✅ Parsed user data: ${JSON.stringify(userData, null, 2)}`);
      } catch (parseErr) {
        addDebugInfo(`❌ Failed to parse JSON: ${parseErr}`);
        throw new Error("Invalid response format from server");
      }

      // Store user data
      const userDataString = JSON.stringify(userData);
      addDebugInfo(`💾 Storing user data: ${userDataString}`);
      
      // Simulate localStorage since we can't use it in artifacts
      addDebugInfo("✅ Login successful!");
      addDebugInfo(`👤 Welcome ${userData.name}!`);
      addDebugInfo(`🎭 Role: ${userData.role}`);
      addDebugInfo(`🔑 Token: ${userData.token.substring(0, 20)}...`);
      
      // Show success message
      alert(`Welcome back, ${userData.name}! Login successful.`);
      
    } catch (err: any) {
      addDebugInfo(`❌ Login failed: ${err.message}`);
      
      // Detailed error analysis
      if (err.name === 'AbortError') {
        addDebugInfo("🚫 Request was aborted (timeout or user cancellation)");
      } else if (err.message.includes('Failed to fetch')) {
        addDebugInfo("🌐 Network error - possible causes:");
        addDebugInfo("  • Backend server is down");
        addDebugInfo("  • CORS policy blocking request");
        addDebugInfo("  • Network connectivity issues");
        addDebugInfo("  • Firewall blocking request");
      } else if (err.message.includes('NetworkError')) {
        addDebugInfo("🔌 Network error - check internet connection");
      }
      
      alert(`Login failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'online': return 'Backend Online';
      case 'offline': return 'Backend Offline';
      default: return 'Checking Backend...';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Debug Panel Toggle */}
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
      >
        {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
      </button>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="fixed top-16 right-4 bottom-4 w-80 bg-black/90 text-green-400 p-4 rounded-lg overflow-y-auto z-40 font-mono text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold">Debug Console</h3>
            <button
              onClick={() => setDebugInfo([])}
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
            >
              Clear
            </button>
          </div>
          <div className={`mb-2 ${getStatusColor()}`}>
            Status: {getStatusText()}
          </div>
          <div className="space-y-1">
            {debugInfo.map((info, index) => (
              <div key={index} className="break-words">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Left Side - Logo & Slogan */}
      <div className="flex flex-col justify-center items-center md:items-start p-8 md:p-16 w-full md:w-1/3 text-center md:text-left">
        <div className="w-24 h-24 md:w-32 md:h-32 mb-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
          T
        </div>
        <h1 className="text-white text-3xl md:text-5xl font-bold mb-2">TaxiPoint</h1>
        <p className="text-gray-300 text-base md:text-lg">Your ride, your way</p>
        
        {/* Backend Status Indicator */}
        <div className={`mt-4 text-sm ${getStatusColor()}`}>
          ● {getStatusText()}
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex justify-center items-center w-full md:w-2/3 p-8 md:p-16">
        <div className="bg-white/10 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-lg w-full max-w-md border border-white/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">Login</h2>

          <div className="space-y-3 mb-6">
            <button 
              type="button" 
              onClick={() => {
                addDebugInfo("🔵 Google login clicked (not implemented)");
                alert("Google login coming soon!");
              }} 
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white text-gray-800 font-semibold shadow-md hover:bg-gray-100 transition"
            >
              <GoogleIcon /> Login with Google
            </button>
            <button 
              type="button" 
              onClick={() => {
                addDebugInfo("🔵 Facebook login clicked (not implemented)");
                alert("Facebook login coming soon!");
              }} 
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              <FacebookIcon /> Login with Facebook
            </button>
          </div>

          <div className="flex items-center mb-6">
            <hr className="flex-1 border-gray-500" />
            <span className="px-3 text-gray-400 text-sm">or</span>
            <hr className="flex-1 border-gray-500" />
          </div>

          <div className="space-y-4">
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={form.email} 
              onChange={handleChange} 
              required
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400" 
              disabled={isLoading} 
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Password" 
                value={form.password} 
                onChange={handleChange} 
                required
                className="w-full p-3 pr-10 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                disabled={isLoading} 
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => {
                  addDebugInfo("🔄 Rechecking backend status...");
                  checkBackendStatus();
                }} 
                className="text-sm text-blue-400 hover:underline"
              >
                Recheck Backend
              </button>
              <button 
                type="button" 
                onClick={() => addDebugInfo("🔗 Forgot password clicked")} 
                className="text-sm text-blue-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition disabled:bg-gray-500 disabled:cursor-not-allowed" 
              disabled={isLoading || backendStatus === 'offline'}
            >
              {isLoading ? "Logging in..." : backendStatus === 'offline' ? "Backend Offline" : "Login"}
            </button>
          </div>

          <p className="mt-4 text-center text-gray-300 text-sm md:text-base">
            Don't have an account?{" "}
            <button 
              onClick={() => addDebugInfo("📝 Register clicked")} 
              className="text-blue-400 hover:underline"
            >
              Register
            </button>
          </p>
          
          {/* Test Credentials */}
          <div className="mt-6 p-3 bg-white/5 rounded-lg text-xs text-gray-400">
            <div className="font-semibold mb-1">Test Credentials:</div>
            <div>Email: admin@test.com</div>
            <div>Password: admin123</div>
            <button
              onClick={() => {
                setForm({ email: "admin@test.com", password: "admin123" });
                addDebugInfo("🧪 Test credentials filled");
              }}
              className="mt-2 text-blue-400 hover:underline text-xs"
            >
              Fill Test Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
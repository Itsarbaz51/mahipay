import { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, passwordReset } from "../../redux/slices/authSlice";

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser, error, success, isLoading, isAuthenticated } =
    useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!emailOrPhone || !password) {
      return;
    }

    const payload = {
      emailOrUsername: emailOrPhone.trim(),
      password,
    };

    try {
      await dispatch(login(payload));
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      return;
    }

    try {
      await dispatch(passwordReset(forgotPasswordEmail.trim()));
      // Reset form on success
      setForgotPasswordEmail("");
    } catch (err) {
      console.error("Forgot password failed:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate, location]);

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {showForgotPassword ? "Reset Password" : "Welcome Back"}
            </h2>
            <p className="text-blue-100 text-sm">
              {showForgotPassword
                ? "Enter your email to reset your password"
                : "Sign in to your account to continue"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Error and Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Forgot Password Form */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your registered email"
                  disabled={isLoading}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Sending..." : "Reset Password"}
                </button>
              </div>

              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  We'll send password reset instructions to your email
                </p>
              </div>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Phone *
                </label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter email or username"
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* Footer Info */}
          {!showForgotPassword && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-500 mb-2">
                  <Lock className="h-3 w-3 mr-1" />
                  <p className="text-xs">Your credentials are secure</p>
                </div>
                <p className="text-xs text-gray-500">
                  Use your registered Email or Phone to login
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

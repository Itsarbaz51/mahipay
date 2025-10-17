import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../../redux/slices/authSlice";

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser, error, success, isLoading } = useSelector(
    (state) => state.auth
  );

  console.log(currentUser?.user.status);

  const handleLogin = async (e) => {
    e.preventDefault();
    const payload = { emailOrUsername: emailOrPhone, password };

    try {
      await dispatch(login(payload)).unwrap();
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  useEffect(() => {
    if (success && currentUser) {
      if (currentUser?.user.isKycVerified === false) navigate("/kyc-submit");
      else if (currentUser?.user.status === "ACTIVE") navigate("/dashboard");
    }
  }, [success, currentUser, navigate]);

  return (
    <div className="flex items-center justify-center bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg p-8 rounded-xl w-96">
        <div className="text-center mb-6">
          <Shield className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Login</h2>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email or Phone
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer bg-black/90 text-white py-2 px-4 rounded-md hover:bg-black transition duration-200 disabled:bg-gray-400"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Use your registered Email or Phone to login</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

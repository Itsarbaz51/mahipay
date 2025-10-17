import { useEffect, useState } from "react";
import { registation } from "../../redux/slices/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    transactionPin: "",
    // domainName: "",
    roleId: "",
    parentId: "",
    profileImage: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch roles dynamically
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}roles`
        );
        setRoles(response.data || []);
      } catch (error) {
        console.error("Failed to fetch roles", error);
        setMessage({ type: "error", text: "Failed to load roles" });
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username || formData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";

    if (!formData.firstName) newErrors.firstName = "First name is required";

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Valid email is required";

    if (!formData.phoneNumber || !/^\d{10}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Valid 10-digit phone number required";

    if (!formData.password || formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.transactionPin || !/^\d{4,6}$/.test(formData.transactionPin))
      newErrors.transactionPin = "Transaction PIN must be 4-6 digits";

    if (!formData.roleId) newErrors.roleId = "Please select a role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the errors above" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });

      await dispatch(registation(submitData)).unwrap();
      setMessage({ type: "success", text: "Account created successfully!" });
      navigate("/login");
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    name,
    type = "text",
    placeholder,
    required = false,
    togglePassword = false,
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && "*"}
      </label>
      <div className="relative">
        <input
          type={togglePassword ? (showPassword ? "text" : "password") : type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
            errors[name]
              ? "border-red-400 focus:ring-red-300"
              : "border-gray-300 focus:ring-blue-400"
          }`}
        />
        {togglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
              Create Your Account
            </h1>
            <p className="text-blue-100 text-center mt-2 text-sm sm:text-base">
              Join us today and get started
            </p>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                  message.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <InputField
                  label="Username"
                  name="username"
                  placeholder="john_doe"
                  required
                />
                <InputField
                  label="First Name"
                  name="firstName"
                  placeholder="John"
                  required
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  placeholder="Doe"
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                />
                <InputField
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  placeholder="9876543210"
                  required
                />
                <InputField
                  label="Password"
                  name="password"
                  placeholder="Min 8 characters"
                  required
                  togglePassword
                />
                <InputField
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role *
                  </label>
                  {rolesLoading ? (
                    <p className="text-gray-500 text-sm">Loading roles...</p>
                  ) : (
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.roleId
                          ? "border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:ring-blue-400"
                      }`}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.roleId && (
                    <p className="text-red-500 text-xs mt-1">{errors.roleId}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Registering...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6 text-sm">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUser, updateUser } from "../../redux/slices/userSlice";
import { getAllRoles } from "../../redux/slices/roleSlice";

export default function AddMember({ onClose, editData }) {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    transactionPin: "",
    roleId: "",
    profileImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const dispatch = useDispatch();

  const roles = useSelector((state) => state?.roles?.roles.roles || []);

  // Prefill form if editData exists
  useEffect(() => {
    dispatch(getAllRoles());
    if (editData) {
      setFormData({
        username: editData.username || "",
        firstName: editData.firstName || "",
        lastName: editData.lastName || "",
        email: editData.email || "",
        phoneNumber: editData.phoneNumber || "",
        password: "", // always blank for security
        confirmPassword: "",
        transactionPin: editData.transactionPin || generateTransactionPin(),
        roleId: editData.roleId || "",
        profileImage: null,
      });
      if (editData.profileImage) {
        setImagePreview(editData.profileImage);
      }
    }
  }, [editData, dispatch]);

  const generateTransactionPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...formData, [name]: value };

    if (name === "email") {
      const usernameFromEmail = value.split("@")[0];
      updatedForm.username = usernameFromEmail || "";
    }

    if (name === "password") {
      updatedForm.confirmPassword = value;
    }

    setFormData(updatedForm);
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profileImage: "Image must be less than 5MB" });
        return;
      }
      setFormData({ ...formData, profileImage: file });
      setImagePreview(URL.createObjectURL(file));
      setErrors({ ...errors, profileImage: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setErrors({});

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      });

      const res = editData
        ? await dispatch(updateUser({ id: editData.id, formData: form }))
        : await dispatch(createUser(form));

      if (res?.status === "success" || res?.data?.status === "success") {
        setMessage({
          type: "success",
          text: editData
            ? "Member updated successfully!"
            : "Member added successfully!",
        });
        setTimeout(() => onClose(), 1500);
      }
    } catch (error) {
      const backendErrors = error?.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const formattedErrors = {};
        backendErrors.forEach((err) => {
          formattedErrors[err.field] = err.message;
        });
        setErrors(formattedErrors);
        setMessage({ type: "error", text: "Validation failed on server" });
      } else {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editData ? "Edit Member" : "Add New Member"}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {editData
                ? "Update existing member details"
                : "Create a new team member account"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-lg text-sm font-medium flex items-center gap-3 ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl bg-gray-100 cursor-not-allowed border-gray-300"
                  placeholder="Auto-filled from email"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.email
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="email@example.com"
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400"
                  placeholder="First name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400"
                  placeholder="Last name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setFormData({ ...formData, phoneNumber: value });
                    if (errors.phoneNumber)
                      setErrors({ ...errors, phoneNumber: "" });
                  }}
                  className="w-full px-4 py-3 border rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400"
                  placeholder="10-digit number"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name || role.roleName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl bg-gray-100 cursor-not-allowed border-gray-300"
                  placeholder="Auto-filled from password"
                />
              </div>

              {/* Transaction Pin */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction PIN *
                </label>
                <input
                  type="text"
                  name="transactionPin"
                  value={formData.transactionPin}
                  onChange={handleChange}
                  maxLength={6}
                  className="w-full px-4 py-3 border rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400"
                  placeholder="6-digit PIN"
                />
              </div>

              {/* Profile Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-24 h-24 object-cover rounded-full border border-gray-300"
                  />
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {loading
                  ? editData
                    ? "Updating..."
                    : "Creating..."
                  : editData
                  ? "Update Member"
                  : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

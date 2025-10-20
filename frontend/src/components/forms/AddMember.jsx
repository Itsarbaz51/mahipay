import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllRoles } from "../../redux/slices/roleSlice";
import { register, updateProfile } from "../../redux/slices/userSlice";

export default function AddMember({ onClose, onSuccess, editData }) {
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const dispatch = useDispatch();

  const roles = useSelector((state) => state?.roles?.roles || []);

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
        roleId: editData.roleId || "",
        password: "",
        confirmPassword: "",
        transactionPin: "",
        profileImage: null,
      });
      if (editData.profileImage) {
        setImagePreview(editData.profileImage);
      }
    }
  }, [editData, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-generate username from email (only for new members)
    if (name === "email" && !editData) {
      const usernameFromEmail = value.split("@")[0];
      setFormData((prev) => ({
        ...prev,
        username: usernameFromEmail || "",
      }));
    }

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";
    if (!formData.roleId) newErrors.roleId = "Role is required";

    if (!editData) {
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.transactionPin)
        newErrors.transactionPin = "Transaction PIN is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: handleSubmit function with auto-close
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix validation errors" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let res;

      if (editData) {
        // Edit case
        const submitData = { ...formData };
        // Remove empty fields for edit
        if (!submitData.password) delete submitData.password;
        if (!submitData.confirmPassword) delete submitData.confirmPassword;
        if (!submitData.transactionPin) delete submitData.transactionPin;

        res = await dispatch(updateProfile(editData.id, submitData));
      } else {
        // New member case - always use FormData
        const form = new FormData();
        Object.keys(formData).forEach((key) => {
          if (
            formData[key] !== null &&
            formData[key] !== undefined &&
            formData[key] !== ""
          ) {
            form.append(key, formData[key]);
          }
        });
        res = await dispatch(register(form));
      }

      // Check multiple success conditions
      if (res?.success || res?.status === "success" || res?.data?.success) {
        setMessage({
          type: "success",
          text: editData
            ? "Member updated successfully!"
            : "Member added successfully!",
        });

        // FIXED: Auto-close on success after short delay
        setTimeout(() => {
          onSuccess(); // Refresh list in parent
          onClose(); // Close the form modal
        }, 1500);
      }
    } catch (error) {
      const backendErrors = error?.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const formattedErrors = {};
        backendErrors.forEach((err) => {
          formattedErrors[err.field] = err.message;
        });
        setErrors(formattedErrors);
      } else {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || "Something went wrong",
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
              className={`mb-4 p-4 rounded-lg text-sm font-medium ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Username - Always show in both modes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username {!editData && "*"}
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!editData} // Disabled only for new members (auto-filled from email)
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    !editData
                      ? "bg-gray-100 cursor-not-allowed border-gray-300"
                      : errors.username
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder={editData ? "Username" : "Auto-filled from email"}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {/* Email - Only show for new members */}
              {!editData && (
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
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              {/* First Name - Always show */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.firstName
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name - Always show */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name {editData ? "" : "(Optional)"}
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

              {/* Phone Number - Always show */}
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
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.phoneNumber
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="10-digit number"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Role - Only show for new members */}
              {!editData && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                      errors.roleId
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-gray-300 focus:ring-blue-400"
                    }`}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name || role.roleName}
                      </option>
                    ))}
                  </select>
                  {errors.roleId && (
                    <p className="text-red-500 text-sm mt-1">{errors.roleId}</p>
                  )}
                </div>
              )}

              {/* Password - Only show for new members */}
              {!editData && (
                <>
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
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                          errors.password
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 focus:ring-blue-400"
                        }`}
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
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password - Only show for new members */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                          errors.confirmPassword
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 focus:ring-blue-400"
                        }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Transaction Pin - Only show for new members */}
              {!editData && (
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
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                      errors.transactionPin
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-gray-300 focus:ring-blue-400"
                    }`}
                    placeholder="6-digit PIN"
                  />
                  {errors.transactionPin && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.transactionPin}
                    </p>
                  )}
                </div>
              )}

              {/* Profile Image - Only show for new members */}
              {!editData && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center gap-4">
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
                        className="w-16 h-16 object-cover rounded-full border border-gray-300"
                      />
                    )}
                  </div>
                  {errors.profileImage && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.profileImage}
                    </p>
                  )}
                </div>
              )}
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

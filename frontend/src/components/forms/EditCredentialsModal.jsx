import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { updateCredentials } from "../../redux/slices/authSlice";

const EditCredentialsModal = ({ userId, type, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    currentTransactionPin: "",
    newTransactionPin: "",
    confirmNewTransactionPin: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only allow numbers for PIN fields
    if (name.includes("Pin") || name.includes("PIN")) {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Current password is always required
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (type === "password") {
      if (!formData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters";
      }

      if (formData.newPassword !== formData.confirmNewPassword) {
        newErrors.confirmNewPassword = "New passwords do not match";
      }
    } else if (type === "pin") {
      if (!formData.currentTransactionPin) {
        newErrors.currentTransactionPin = "Current transaction PIN is required";
      } else if (
        formData.currentTransactionPin.length < 4 ||
        formData.currentTransactionPin.length > 6
      ) {
        newErrors.currentTransactionPin = "Current PIN must be 4-6 digits";
      }

      if (!formData.newTransactionPin) {
        newErrors.newTransactionPin = "New transaction PIN is required";
      } else if (
        formData.newTransactionPin.length < 4 ||
        formData.newTransactionPin.length > 6
      ) {
        newErrors.newTransactionPin = "New PIN must be 4-6 digits";
      }

      if (formData.newTransactionPin !== formData.confirmNewTransactionPin) {
        newErrors.confirmNewTransactionPin = "New PINs do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        currentPassword: formData.currentPassword,
        ...(type === "password"
          ? {
              newPassword: formData.newPassword,
              confirmNewPassword: formData.confirmNewPassword,
            }
          : {
              currentTransactionPin: formData.currentTransactionPin,
              newTransactionPin: formData.newTransactionPin,
              confirmNewTransactionPin: formData.confirmNewTransactionPin,
            }),
      };

      const currentUserId = currentUser?.id;
      const result = await dispatch(
        updateCredentials({
          userId,
          credentialsData: payload,
          currentUserId,
        })
      );

      if (result.payload?.logout !== true) {
        // Only close modal if it wasn't own password update
        toast.success(
          `${
            type === "password" ? "Password" : "Transaction PIN"
          } updated successfully!`
        );

        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
          currentTransactionPin: "",
          newTransactionPin: "",
          confirmNewTransactionPin: "",
        });

        onSuccess();
      }
    } catch (error) {
      console.error("Credentials update error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    return type === "password" ? "Change Password" : "Change Transaction PIN";
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">{getTitle()}</h2>
          <p className="text-blue-100 text-sm">
            {type === "password"
              ? "Update your password securely"
              : "Update your transaction PIN (4-6 digits)"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password - Always Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.currentPassword
                  ? "border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
              placeholder="Enter current password"
            />
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {type === "password" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="At least 8 characters"
                />
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.confirmNewPassword
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Confirm new password"
                />
                {errors.confirmNewPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmNewPassword}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Transaction PIN *
                </label>
                <input
                  type="password"
                  name="currentTransactionPin"
                  value={formData.currentTransactionPin}
                  onChange={handleChange}
                  maxLength={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.currentTransactionPin
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="4-6 digits"
                />
                {errors.currentTransactionPin && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.currentTransactionPin}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Transaction PIN *
                </label>
                <input
                  type="password"
                  name="newTransactionPin"
                  value={formData.newTransactionPin}
                  onChange={handleChange}
                  maxLength={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.newTransactionPin
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="4-6 digits"
                />
                {errors.newTransactionPin && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.newTransactionPin}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New PIN *
                </label>
                <input
                  type="password"
                  name="confirmNewTransactionPin"
                  value={formData.confirmNewTransactionPin}
                  onChange={handleChange}
                  maxLength={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.confirmNewTransactionPin
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Confirm new PIN"
                />
                {errors.confirmNewTransactionPin && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmNewTransactionPin}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Updating..."
                : `Update ${type === "password" ? "Password" : "PIN"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCredentialsModal;

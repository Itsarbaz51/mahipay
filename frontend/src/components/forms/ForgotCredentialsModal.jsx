import { Mail, X, Key, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export default function ForgotCredentialsModal({
  type = "password",
  setForgotMode,
  handleForgotCredentials,
  forgotForm,
  setForgotForm,
  loading,
  userData,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(null);
  const [buttonText, setButtonText] = useState("");

  useEffect(() => {
    switch (type) {
      case "pin":
        setTitle("Forgot Transaction PIN");
        setDescription(
          "We'll send a PIN reset link to this email address. The link will expire in 5 minutes."
        );
        setIcon(<Key className="w-5 h-5 mr-2 text-green-600" />);
        setButtonText("Send PIN Reset Link");
        break;
      case "password":
      default:
        setTitle("Forgot Password");
        setDescription(
          "We'll send a password reset link to this email address. The link will expire in 5 minutes."
        );
        setIcon(<Lock className="w-5 h-5 mr-2 text-blue-600" />);
        setButtonText("Send Password Reset Link");
        break;
    }
  }, [type]);

  const getModalStyles = () => {
    switch (type) {
      case "pin":
        return {
          iconColor: "text-green-600",
          buttonColor: "bg-green-600 hover:bg-green-700",
          borderColor: "border-green-200",
        };
      case "password":
      default:
        return {
          iconColor: "text-blue-600",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          borderColor: "border-blue-200",
        };
    }
  };

  const styles = getModalStyles();

  const handleSubmit = (e) => {
    e.preventDefault();
    handleForgotCredentials(forgotForm.email);
  };

  const handleCancel = () => {
    setForgotMode(false);
    setForgotForm({
      email: userData?.email || "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            {icon}
            {title}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`mb-4 p-3 rounded-md bg-${
            type === "pin" ? "green" : "blue"
          }-50 border ${styles.borderColor}`}
        >
          <p
            className={`text-sm text-${
              type === "pin" ? "green" : "blue"
            }-800 font-medium`}
          >
            {type === "pin"
              ? "🔒 Secure PIN Reset"
              : "🔐 Secure Password Reset"}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {type === "pin"
              ? "Your transaction PIN ensures secure financial operations."
              : "Keep your password strong and unique for maximum security."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={forgotForm.email}
              onChange={(e) =>
                setForgotForm({
                  ...forgotForm,
                  email: e.target.value,
                })
              }
              disabled={Boolean(userData)}
              className={`${
                userData ? "cursor-not-allowed bg-gray-100" : ""
              } mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                type === "pin"
                  ? "focus:ring-green-500 focus:border-green-500"
                  : "focus:ring-blue-500 focus:border-blue-500"
              } transition-colors`}
              placeholder="Enter your email address"
              required
            />
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong>{" "}
              {type === "pin"
                ? "After reset, you will need to set a new 4-digit transaction PIN."
                : "After reset, you will need to create a new strong password."}
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${styles.buttonColor} text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors font-medium`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </span>
              ) : (
                buttonText
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {type === "pin"
              ? "Never share your PIN with anyone. Our team will never ask for it."
              : "Use a combination of letters, numbers, and symbols for better security."}
          </p>
        </div>
      </div>
    </div>
  );
}

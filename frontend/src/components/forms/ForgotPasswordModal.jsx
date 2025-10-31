import { Mail, X } from "lucide-react";

export default function ForgotPasswordModal({
  setForgotPasswordMode,
  handleForgotPassword,
  forgotPasswordForm,
  setForgotPasswordForm,
  loading,
  userData,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            Forgot Password
          </h3>
          <button
            onClick={() => setForgotPasswordMode(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleForgotPassword(forgotPasswordForm.email);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              value={forgotPasswordForm.email}
              onChange={(e) =>
                setForgotPasswordForm({
                  ...forgotPasswordForm,
                  email: e.target.value,
                })
              }
              disabled={Boolean(userData)}
              className={`${
                userData && "cursor-not-allowed"
              } mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter your email address"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              We'll send a password reset link to this email address. The link
              will expire in 5 minutes.
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForgotPasswordMode(false);
                setForgotPasswordForm({
                  email: userData.email || "",
                });
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

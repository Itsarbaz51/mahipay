import { useLocation } from "react-router-dom";
import { protectedRoute } from "../../index";

export default function Footer() {
  const location = useLocation();
  const isProtectedRoute = protectedRoute.includes(location.pathname);

  return (
    <footer
      className={`${!isProtectedRoute && "bg-white border-t border-gray-300"}`}
    >
      {/* Show full footer only on public routes, show only copyright on protected routes */}
      {!isProtectedRoute && (
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://via.placeholder.com/24"
                alt="Monks Pay Logo"
                className="w-6 h-6"
              />
              <span className="font-bold text-lg text-gray-900">Monks Pay</span>
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              Monks Pay offers secure, seamless, and fee-free payments for
              effortless global transactions.
            </p>
          </div>

          {/* Middle Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Short links</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>
                <a href="#">Features</a>
              </li>
              <li>
                <a href="#">How it works</a>
              </li>
              <li>
                <a href="#">Security</a>
              </li>
              <li>
                <a href="#">Testimonial</a>
              </li>
            </ul>
          </div>

          {/* Right Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Other pages</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>
                <a href="#">Privacy policy</a>
              </li>
              <li>
                <a href="#">Terms & conditions</a>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Always show copyright section on all routes */}
      <div className="border-t border-gray-300 mt-6 ">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex gap-4 mb-4 md:mb-0">
            <a href="#">Get This Turch</a>
            <a href="#">azzunique.com</a>
          </div>
          <div>2025 © Design Monks. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

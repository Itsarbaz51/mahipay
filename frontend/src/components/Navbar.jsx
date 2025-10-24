import { useState } from "react";
import { ChevronDown, Settings, User, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { protectedRoute } from "../../index";
import Title from "./ui/Title";

const Navbar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const isProtectedRoute = protectedRoute.includes(location.pathname);

  const navigate = useNavigate();

  const menuItems = [
    { name: "Home", link: "/" },
    { name: "About", link: "/about" },
    { name: "Testimonial", link: "/testimonial" },
    {
      name: "Pages",
      dropdown: [
        { name: "About", link: "/about" },
        { name: "Team", link: "/team" },
        { name: "Price", link: "/pricing" },
        { name: "FAQ", link: "/faq" },
        { name: "404", link: "/404" },
      ],
    },
    { name: "Contact", link: "/contact" },
  ];

  return (
    <nav
      className={`border-b border-gray-300 ${
        !isProtectedRoute
          ? "flex items-center justify-between px-6 md:px-8 py-4 backdrop-blur-2xl sticky top-0 z-50"
          : "py-5"
      }`}
    >
      {/* ===== PUBLIC NAVBAR ===== */}
      {!isProtectedRoute ? (
        <div className="flex items-center justify-between w-full relative">
          {/* LOGO */}
          <div className="flex items-center space-x-2">
            <img
              src="/WhatsApp Image 2025-10-10 at 11.48.12 AM.jpeg"
              alt="Impulse"
              className="h-fit w-24  object-contain"
            />
            {/* <span className="text-2xl font-bold text-gray-900">Impulse</span> */}
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center bg-white shadow px-6 py-2 rounded-full space-x-8">
            {menuItems.map((item, idx) => (
              <div
                key={idx}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.dropdown ? (
                  <button
                    className="flex items-center space-x-1 text-gray-700 hover:text-black font-medium focus:outline-none"
                    onFocus={() => setOpenDropdown(item.name)}
                    onBlur={() => setOpenDropdown(null)}
                  >
                    <span>{item.name}</span>
                    <ChevronDown size={16} />
                  </button>
                ) : (
                  <Link
                    to={item.link}
                    className={`font-medium transition ${
                      location.pathname === item.link
                        ? "text-black font-semibold"
                        : "text-gray-700 hover:text-black"
                    }`}
                  >
                    {item.name}
                  </Link>
                )}

                {/* DROPDOWN */}
                {openDropdown === item.name && item.dropdown && (
                  <div className="absolute left-0 mt-3 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    {item.dropdown.map((sub, i) => (
                      <Link
                        key={i}
                        to={sub.link}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT SIDE BUTTONS */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition"
            >
              Register
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* MOBILE DROPDOWN */}
          {isMobileOpen && (
            <div className="absolute top-16 left-0 w-full bg-white shadow-md flex flex-col items-center space-y-4 py-4 md:hidden z-50">
              {menuItems.map((item, idx) =>
                item.dropdown ? (
                  <div key={idx} className="w-full text-center">
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === item.name ? null : item.name
                        )
                      }
                      className="w-full py-2 font-medium text-gray-800 hover:text-black"
                    >
                      {item.name} <ChevronDown className="inline" size={14} />
                    </button>
                    {openDropdown === item.name && (
                      <div className="flex flex-col space-y-1">
                        {item.dropdown.map((sub, i) => (
                          <Link
                            key={i}
                            to={sub.link}
                            onClick={() => setIsMobileOpen(false)}
                            className="block text-gray-600 hover:text-black text-sm"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={idx}
                    to={item.link}
                    onClick={() => setIsMobileOpen(false)}
                    className={`text-gray-800 font-medium ${
                      location.pathname === item.link
                        ? "text-black font-semibold"
                        : ""
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              )}

              {/* Login / Register for Mobile */}
              <div className="flex flex-col space-y-2 mt-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition text-center"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition text-center"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== PROTECTED NAVBAR ===== */
        <div className="px-6">
          <div className="flex justify-between items-center">
            <Title />

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/settings")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </button>

              <button
                onClick={() => navigate("/profile")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FileText, Briefcase, PlusCircle, LogOut, CheckCircle2 } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: FileText },
    { label: "Resumes", path: "/resumes", icon: FileText },
    { label: "Analyze Job", path: "/jobs/new", icon: Briefcase },
    { label: "Applications", path: "/applications", icon: CheckCircle2 }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              CareerFit<span className="text-brand-600">.AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              Zero-Fabrication ATS
            </span>
          </div>
        </Link>

        {/* Links */}
        {user ? (
          <div className="flex items-center space-x-1 sm:space-x-4">
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Link
              to="/resumes/upload"
              className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Resume</span>
            </Link>

            <div className="flex items-center pl-2 border-l border-slate-200 space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">{user.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[120px]">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-brand-600 px-3 py-1.5"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-1.5 rounded-lg shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

import { Link, useLocation, useNavigate } from "react-router-dom";
import { Zap, Settings, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("docmosiss_token");
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 z-20">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-900">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xl font-bold tracking-tight font-display text-zinc-950 dark:text-white"
        >
          <Zap className="h-6 w-6 text-emerald-500" /> DOCMOSISS
        </Link>
      </div>

      {/* Sidebar Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        <p className="px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Workspace
        </p>

        {NAV_ITEMS.map((item) => {
          // Check if the current URL matches the link path
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? "text-emerald-600 dark:text-emerald-500" : "text-zinc-400"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 space-y-1.5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900/50 transition-all">
          <Settings className="h-5 w-5 text-zinc-400" /> Settings
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="h-5 w-5 opacity-70" /> Log out
        </button>
      </div>
    </aside>
  );
}

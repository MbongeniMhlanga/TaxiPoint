import React from "react";
import type { User } from "../App"; // adjust path if needed
import { LogOut, Settings, Info, HelpCircle, User as UserIcon, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";


interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col p-4 border-r border-gray-200 dark:border-gray-800">
      {/* Profile section - clickable */}
      <div
        onClick={() => navigate("/profile")}
        className="flex items-center space-x-3 mb-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition"
      >
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300">
          <UserIcon size={24} />
        </div>
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 space-y-3">

        <button
          onClick={() => navigate("/landing")}
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition w-full"
        >
          <Home size={18} />
          <span>Home</span>
        </button>


        <button
          onClick={() => navigate("/settings")}
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition w-full"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => navigate("/about")}
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition w-full">
          <Info size={18} />
          <span>About</span>
        </button>
        <button
          onClick={() => navigate("/support")}
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition w-full">
          <HelpCircle size={18} />
          <span>Support</span>
        </button>
      </nav>

      {/* Logout at bottom */}
      <button
        onClick={onLogout}
        className="flex items-center space-x-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-lg transition w-full mt-auto"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;

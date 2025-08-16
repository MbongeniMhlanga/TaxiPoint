import React from "react";
import type { User } from "../App"; // adjust path if needed
  // adjust path if needed
import { LogOut, Settings, Info, HelpCircle, User as UserIcon } from "lucide-react";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col p-4">
      {/* Profile section */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
          <UserIcon size={24} />
        </div>
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 space-y-3">
        <button className="flex items-center space-x-2 hover:text-gray-300 w-full">
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button className="flex items-center space-x-2 hover:text-gray-300 w-full">
          <Info size={18} />
          <span>About</span>
        </button>
        <button className="flex items-center space-x-2 hover:text-gray-300 w-full">
          <HelpCircle size={18} />
          <span>Support</span>
        </button>
      </nav>

      {/* Logout at bottom */}
      <button
        onClick={onLogout}
        className="flex items-center space-x-2 hover:text-red-400 w-full mt-auto"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;

import React from "react";
import type { ReactNode } from 'react';
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

// User interface
interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  token: string;
}

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  user,
  onLogout,
  children,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out bg-gray-900 text-white shadow-xl ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} onLogout={onLogout} />
      </div>

      {/* Dark overlay - only on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content - NO margin classes, NO padding */}
      <div className="relative w-full h-screen">
        {/* Sidebar Toggle Button */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition shadow-lg"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Your page content (Landing component) renders here */}
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
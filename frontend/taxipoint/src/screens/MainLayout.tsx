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
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 pointer-events-auto">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out bg-gray-900 text-white shadow-xl ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} onLogout={onLogout} />
      </div>

      {/* Dark overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-2001"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="relative h-full w-full">
        {/* Sidebar Toggle Button (always above map) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-[9999] p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Page Content */}
        <div className="h-full w-full">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;

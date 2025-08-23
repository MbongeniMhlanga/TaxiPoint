import React from "react";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 to-gray-800 relative">
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
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col p-6 gap-6 w-full transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Sidebar Toggle */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Header (optional) */}
        <div className="w-full max-w-6xl mx-auto flex items-center gap-4">
          {/* <h1 className="text-2xl font-bold text-white">TaxiPoint</h1> */}
        </div>

        {children}
      </div>
    </div>
  );
};

export default MainLayout;

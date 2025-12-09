import React from 'react';
import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from "../components/ThemeToggle";

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
    <div className="relative h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pointer-events-auto transition-colors duration-300">

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-[9999] transform transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 shadow-xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <Sidebar user={user} onLogout={onLogout} />
      </div>

      {/* Dark overlay (behind sidebar, above map) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="relative h-full w-full pointer-events-auto">
        {/* Sidebar Toggle Button */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-[1000] p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Theme Toggle Button - Absolute Top Right */}
        <div className="absolute top-4 right-4 z-[1000]">
          <ThemeToggle />
        </div>

        {/* Page Content */}
        <div className="h-full w-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

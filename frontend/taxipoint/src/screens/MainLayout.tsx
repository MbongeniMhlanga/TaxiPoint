import React from 'react';
import type { ReactNode } from 'react';
import { Menu, X, Sun, Moon, LayoutDashboard, Map as MapIcon, Info, HelpCircle, Settings, User as UserIcon } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();


  const navItems = [
    { name: 'Home', icon: <MapIcon size={20} />, path: '/landing' },
    { name: 'About', icon: <Info size={20} />, path: '/about' },
    { name: 'Support', icon: <HelpCircle size={20} />, path: '/support' },
    ...(user.role === 'ROLE_ADMIN' ? [{ name: 'Admin', icon: <LayoutDashboard size={20} />, path: '/admin' }] : []),
  ];

  const bottomNavItems = [
    { name: 'Profile', icon: <UserIcon size={20} />, path: '/profile' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  // Helper to determine active state
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* 
         MODERN SIDEBAR (Desktop) 
         Floating dock style on the left, visible on md+ screens
      */}
      <div className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 transition-all duration-300">

        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
              TP
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">TaxiPoint</h1>
              <span className="text-xs text-gray-500 font-medium">Driver & Commuter</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}

          <div className="my-4 border-t border-gray-100 dark:border-gray-700 mx-2"></div>

          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">User</p>
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors mb-2"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* 
        MOBILE HEADER & SIDEBAR OVERLAY 
      */}
      <div className="md:hidden">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-sm z-[1500] flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              TP
            </div>
            <span className="font-bold text-lg">TaxiPoint</span>
          </div>

          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Sidebar Drawer */}
        <div className={`fixed inset-0 z-[2000] flex transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-80 bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col p-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 flex-1">
              {navItems.concat(bottomNavItems).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {item.icon}
                  <span className="text-lg font-medium">{item.name}</span>
                </Link>
              ))}
              <hr className="border-gray-100 dark:border-gray-700 my-4" />
              <button
                onClick={toggleTheme}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span className="text-lg font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={() => { onLogout(); setIsSidebarOpen(false); }}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span className="text-lg font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-full w-full pt-16 md:pt-0 md:pl-72 relative transition-all duration-300">
        <div className="h-full w-full overflow-hidden p-4 md:p-4">
          <div className="h-full w-full bg-white dark:bg-gray-800 md:rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative transition-colors duration-300">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
};

export default MainLayout;

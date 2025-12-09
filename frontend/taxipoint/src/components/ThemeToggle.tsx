import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            ) : (
                <Sun className="w-6 h-6 text-yellow-500" />
            )}
        </button>
    );
};

export default ThemeToggle;

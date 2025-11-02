'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  // Prevent hydration mismatch by not rendering until client-side
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative inline-flex h-9 w-16 md:h-10 md:w-20 items-center rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse">
        <span className="h-7 w-7 md:h-8 md:w-8 transform rounded-full bg-white shadow-lg translate-x-1 flex items-center justify-center">
          <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-400 rounded-full"></div>
        </span>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-9 w-16 md:h-10 md:w-20 items-center rounded-full 
        transition-all duration-300 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-blue-400 dark:focus:ring-blue-500
        hover:scale-105 active:scale-95
        shadow-md hover:shadow-lg
        ${isDark ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-yellow-300 to-orange-300'}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background glow effect */}
      <span
        className={`
          absolute inset-0 rounded-full
          transition-opacity duration-300
          ${isDark ? 'bg-blue-500 opacity-0' : 'bg-yellow-400 opacity-20'}
        `}
      />
      
      {/* Toggle circle */}
      <span
        className={`
          relative h-7 w-7 md:h-8 md:w-8 transform rounded-full 
          bg-white dark:bg-blue-900 shadow-lg 
          transition-all duration-300 ease-in-out
          flex items-center justify-center
          ${isDark ? 'translate-x-8 md:translate-x-11' : 'translate-x-1'}
        `}
      >
        {/* Icon container with smooth transition */}
        <span
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}
          `}
        >
          <Moon className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-200" />
        </span>
        <span
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}
          `}
        >
          <Sun className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
        </span>
      </span>
    </button>
  );
}

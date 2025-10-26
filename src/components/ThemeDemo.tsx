'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeDemo() {
  const { theme } = useTheme();

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-300">
        <h2 className="text-xl font-bold text-text-dark dark:text-text-light mb-4">
          Theme Demo
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-dark-700 rounded-lg">
            <p className="text-text-dark dark:text-text-muted">
              Current theme: <span className="font-semibold text-primary-600 dark:text-primary-400">{theme}</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary-500 dark:bg-primary-600 rounded text-white text-center shadow-md">
              Blue Card
            </div>
            <div className="p-3 bg-green-500 dark:bg-green-600 rounded text-white text-center shadow-md">
              Green Card
            </div>
          </div>
          
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg bg-gray-50 dark:bg-dark-900">
            <p className="text-text-muted dark:text-text-muted text-sm">
              This card demonstrates how components adapt to the current theme.
              The toggle switch in the navigation will change this appearance.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text-dark dark:text-text-light">Color Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="h-8 bg-dark-200 dark:bg-dark-700 rounded"></div>
              <div className="h-8 bg-dark-300 dark:bg-dark-600 rounded"></div>
              <div className="h-8 bg-dark-400 dark:bg-dark-500 rounded"></div>
              <div className="h-8 bg-dark-500 dark:bg-dark-400 rounded"></div>
              <div className="h-8 bg-dark-600 dark:bg-dark-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

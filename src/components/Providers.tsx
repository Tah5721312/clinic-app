'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AutoLogout from '@/components/AutoLogout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AutoLogout inactivityTimeout={60 * 60 * 1000} /> {/* 1 hour inactivity timeout */}
        {children}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          className="custom-toast-container"
        />
      </ThemeProvider>
    </SessionProvider>
  );
}



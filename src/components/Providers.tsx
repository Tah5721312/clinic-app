'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AutoLogout from '@/components/AutoLogout';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AutoLogout inactivityTimeout={60 * 60 * 1000} /> {/* 1 hour inactivity timeout */}
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}



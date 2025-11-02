'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';

interface AutoLogoutProps {
  inactivityTimeout?: number; // in milliseconds, default 1 hour (3600000ms)
}

export default function AutoLogout({ inactivityTimeout = 60 * 60 * 1000 }: AutoLogoutProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  useEffect(() => {
    const resetTimeout = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        // Auto logout after inactivity
        signOut({ 
          redirect: true, 
          callbackUrl: '/login' 
        });
      }, inactivityTimeout);
    };

    // Set initial timeout
    resetTimeout();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout, true);
    });

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        resetTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inactivityTimeout]);

  return null; // This component doesn't render anything
}


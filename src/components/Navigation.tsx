'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const userId = (session?.user as any)?.id;

  const commonItems = [
    { href: '/Dashboard', label: 'Dashboard' },
    { href: '/doctors', label: 'Doctors' },
    { href: '/patients', label: 'Patients' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/appointments/new', label: 'New Appointment' },
  ];

  return (
    <nav className='bg-blue-600 text-white shadow-lg'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center py-4'>
          <h1 className='text-xl font-bold'>
              <Link  href={"/"} >
                 Medical Clinic Management System
              </Link>
          </h1>

          <div className='flex space-x-4 space-x-reverse'>
            {commonItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <>
                <Link
                  href={'/login'}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/login'
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href={'/register'}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/register'
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  Register
                </Link>
              </>
            )}

            {isAuthenticated && (
              <>
                <Link
                  href={`/profile/${userId}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === `/profile/${userId}`
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
                  className='px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-700'
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

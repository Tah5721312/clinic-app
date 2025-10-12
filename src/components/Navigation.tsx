'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Can } from '@/components/Can';
import { Actions, Subjects } from '@/lib/ability';



export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const userId = (session?.user as any)?.id;

  const commonItems: Array<{
    href: string;
    label: string;
    permission: { do: Actions; on: Subjects };
  }> = [
    { href: '/Dashboard', label: 'Dashboard', permission: { do: 'read', on: 'Dashboard' } },
    { href: '/doctors', label: 'Doctors', permission: { do: 'read', on: 'Doctor' } },
    { href: '/patients', label: 'Patients', permission: { do: 'read', on: 'Patient' } },
    { href: '/appointments', label: 'Appointments', permission: { do: 'read', on: 'Appointment' } },
    { href: '/appointments/new', label: 'New Appointment', permission: { do: 'create', on: 'Appointment' } },
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
              <Can key={item.href} do={item.permission.do} on={item.permission.on}>
                <Link
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  {item.label}
                </Link>
              </Can>
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
             
               <Can do="read" on="Patient">
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
               </Can>

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

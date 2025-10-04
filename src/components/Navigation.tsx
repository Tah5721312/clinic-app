'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
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
            {navItems.map((item) => (
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
          </div>
        </div>
      </div>
    </nav>
  );
}

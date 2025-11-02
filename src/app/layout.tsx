import { Metadata } from 'next';
import * as React from 'react';

import '@/styles/globals.css';

// !STARTERCONF This is for demo purposes, remove @/styles/colors.css import immediately
import '@/styles/colors.css';

import { siteConfig } from '@/constant/config';
import Navigation from '@/components/Navigation';
import Providers from '@/components/Providers';
import ScrollToTop from '@/components/ScrollToTop';


import { AbilityProvider } from '@/contexts/AbilityContext';
import { AbilityRule } from '@/lib/ability';
import { fetchAbilityRulesFromDB } from '@/lib/ability.server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';



// !STARTERCONF Change these default meta
// !STARTERCONF Look at @/constant/config to change them
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  robots: { index: true, follow: true },
  // !STARTERCONF this is the default favicon, you can generate your own from https://realfavicongenerator.net/
  // ! copy to /favicon folder
  icons: {
    icon: '/favicon/favicon.png',
    shortcut: '/favicon/favicon-512x512.png',
    apple: '/favicon/favicon-192x192.png',
  },
  manifest: `/favicon/site.webmanifest`,
  openGraph: {
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
    images: [`${siteConfig.url}/images/og.jpg`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [`${siteConfig.url}/images/og.jpg`],
    // creator: '@th_clarence',
  },
  // authors: [
  //   {
  //     name: 'Theodorus Clarence',
  //     url: 'https://theodorusclarence.com',
  //   },
  // ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

   // الاعتماد 100% على الصلاحيات من الداتابيز
   const cookieStore = await cookies();
   const userIdCookie = cookieStore.get('userId')?.value;
   let userId = userIdCookie ? Number(userIdCookie) : undefined;

   // Fallback: لو الكوكيز مش موجودة استخدم الـ session
   if (!Number.isFinite(userId)) {
     const session = await auth();
     const sessionUserId = Number((session?.user as any)?.id ?? 0);
     if (Number.isFinite(sessionUserId) && sessionUserId > 0) {
       userId = sessionUserId;
     }
   }

   let abilityRules: AbilityRule[] = [];
   if (Number.isFinite(userId)) {
     try {
       abilityRules = await fetchAbilityRulesFromDB(userId as number);
     } catch {
       // في حال الفشل: اترك الصلاحيات فارغة (عدم السماح بأي شيء)
       abilityRules = [];
     }
   } else {
     // بدون userId: لا صلاحيات
     abilityRules = [];
   }

   // لا نضيف manage:all تلقائياً — الاعتماد بالكامل على قواعد الداتابيز

   
  return (
    <html>
      {/* <body>{children}</body> */}
      <body className="bg-white dark:bg-dark-900 text-text-dark dark:text-text-light transition-colors duration-200">
        <Providers>
          <AbilityProvider rules={abilityRules}>
            <Navigation />
            <main className="container mx-auto p-4">
              {children}
            </main>
            <ScrollToTop />
          </AbilityProvider>
        </Providers>
      </body>
    </html>
  );
}

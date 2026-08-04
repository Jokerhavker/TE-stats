'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem('s8ul_user_role');
    
    // Redirect to login if not logged in and not already on login page
    if (!role && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else {
      setIsReady(true);
    }
  }, [pathname, router]);

  // Don't render anything until we've checked the role to avoid layout shift or leakage
  if (!isReady && pathname !== '/admin/login') return null;

  // If on login page, don't use the AdminLayout wrapper (which has sidebar/topbar)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

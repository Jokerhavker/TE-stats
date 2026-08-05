'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { getAuthToken, getUserRole, clearAuthSession } from '@/lib/clientAuth';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    const token = getAuthToken();

    // Redirect to login if not logged in and not already on login page
    if (!role && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }

    if (pathname === '/admin/login') {
      setIsReady(true);
      return;
    }

    // Server-side validation: without a valid session token, any forged
    // s8ul_user_role in devtools gets cleared and sent back to login.
    if (!token) {
      clearAuthSession();
      router.push('/admin/login');
      return;
    }

    let cancelled = false;
    fetch('/api/auth', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          clearAuthSession();
          router.push('/admin/login');
          return;
        }
        setIsReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Network error: keep the session so the admin can keep working locally.
        setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // Don't render anything until we've checked the role to avoid layout shift or leakage
  if (!isReady && pathname !== '/admin/login') return null;

  // If on login page, don't use the AdminLayout wrapper (which has sidebar/topbar)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

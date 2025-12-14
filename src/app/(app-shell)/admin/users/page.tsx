"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page was deprecated. Redirect to the new admin panel route.
export default function DeprecatedAdminUsers() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin-panel/users');
  }, [router]);
  return null;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/messenger');
  }, [router]);

  return null;
}

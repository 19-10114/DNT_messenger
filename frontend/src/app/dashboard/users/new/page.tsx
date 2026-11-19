'use client';

import { CreateUser } from '@/components/user/create.component';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button.component';

export default function NewUserPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2"
      >
        <ChevronLeft className="h-8 w-8" size={28} />
      </Button>
      <CreateUser />
    </div>
  );
}

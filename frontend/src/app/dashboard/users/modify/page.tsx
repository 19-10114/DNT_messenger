'use client';
import { ModifyUser } from '@/components/user/modify.component';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button.component';

export default function ModifyUserPage({
  params,
}: {
  params: { userId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('userId') || '';

  return (
    <div className="container mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2"
      >
        <ChevronLeft className="h-8 w-8" size={28} />
      </Button>
      <ModifyUser userId={id} />
    </div>
  );
}

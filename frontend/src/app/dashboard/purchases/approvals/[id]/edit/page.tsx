'use client';

import React from 'react';

import { ApprovalForm } from '@/components/approvals/approvalForm.component';
import { useApproval } from '@/hooks/approvals';

export default function EditApprovalPage({
  params,
}: {
  params: { id: string };
}) {
  const { approval, isLoadingApproval, isErrorApproval } = useApproval(
    Number(params.id)
  );

  if (isLoadingApproval) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }
  if (isErrorApproval || !approval) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudo cargar la aprobación.
      </p>
    );
  }
  // `key`: el formulario toma los valores iniciales una sola vez.
  return <ApprovalForm key={approval.id} approval={approval} />;
}

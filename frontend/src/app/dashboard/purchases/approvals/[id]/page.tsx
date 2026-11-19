import React from 'react';

import { ApprovalDetail } from '@/components/approvals/approvalDetail.component';

export default function ApprovalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ApprovalDetail approvalId={Number(params.id)} />;
}

import React from 'react';

import { BikeRequestDetail } from '@/components/bikeRequests/bikeRequestDetail.component';

interface ArrancaRequestDetailPageProps {
  params: { id: string };
}

export default function ArrancaRequestDetailPage({
  params,
}: ArrancaRequestDetailPageProps) {
  return <BikeRequestDetail bikeRequestId={Number(params.id)} />;
}

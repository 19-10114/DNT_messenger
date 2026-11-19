import { TicketDetail } from '@/components/support/ticketDetail.component';

export default function SupportTicketPage({
  params,
}: {
  params: { id: string };
}) {
  return <TicketDetail ticketId={Number(params.id)} />;
}

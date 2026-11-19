import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SupportService } from '@/services/support/support.service';
import {
  AddSupportCommentInput,
  ConfirmSupportTicketInput,
  CreateSupportTicketInput,
  UpdateSupportTicketInput,
} from '@/services/support/types';
import { useToken } from '@/stores/auth/auth.store';
import { SUPPORT_QUERY_KEY } from './supportQueryKeys';

const supportService = new SupportService();

/** Listas, detalle y contador cambian juntos: se invalida todo soporte */
function useInvalidateSupport() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [SUPPORT_QUERY_KEY] });
}

export function useCreateSupportTicket() {
  const token = useToken();
  const invalidate = useInvalidateSupport();
  const { mutateAsync, isLoading } = useMutation({
    mutationFn: (input: CreateSupportTicketInput) =>
      supportService.createTicket(token as string, input),
    onSuccess: invalidate,
  });
  return { createSupportTicket: mutateAsync, isCreatingTicket: isLoading };
}

export function useUpdateSupportTicket(ticketId: number) {
  const token = useToken();
  const invalidate = useInvalidateSupport();
  const { mutateAsync, isLoading } = useMutation({
    mutationFn: (input: UpdateSupportTicketInput) =>
      supportService.updateTicket(token as string, ticketId, input),
    onSuccess: invalidate,
  });
  return { updateSupportTicket: mutateAsync, isUpdatingTicket: isLoading };
}

export function useAddSupportComment(ticketId: number) {
  const token = useToken();
  const invalidate = useInvalidateSupport();
  const { mutateAsync, isLoading } = useMutation({
    mutationFn: (input: AddSupportCommentInput) =>
      supportService.addComment(token as string, ticketId, input),
    onSuccess: invalidate,
  });
  return { addSupportComment: mutateAsync, isAddingComment: isLoading };
}

export function useConfirmSupportTicket(ticketId: number) {
  const token = useToken();
  const invalidate = useInvalidateSupport();
  const { mutateAsync, isLoading } = useMutation({
    mutationFn: (input: ConfirmSupportTicketInput) =>
      supportService.confirmTicket(token as string, ticketId, input),
    onSuccess: invalidate,
  });
  return { confirmSupportTicket: mutateAsync, isConfirmingTicket: isLoading };
}

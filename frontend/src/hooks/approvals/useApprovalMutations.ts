import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApprovalsService } from '@/services/approvals/approvals.service';
import {
  CreateApprovalPayload,
  MoveApprovalBikesPayload,
  UpdateApprovalPayload,
} from '@/services/approvals/types';
import { useToken } from '@/stores/auth/auth.store';
import {
  APPROVALS_QUERY_KEY,
  APPROVAL_LOOKUP_QUERY_KEY,
  APPROVAL_PENDING_BY_MODEL_QUERY_KEY,
  APPROVAL_PENDING_UNITS_QUERY_KEY,
  APPROVAL_QUERY_KEY,
  APPROVAL_SEARCH_QUERY_KEY,
} from './approvalsQueryKeys';

const approvalsService = new ApprovalsService();

/** Todo el módulo: listado, detalle, motos por recibir y la consulta del carrito. */
function useInvalidateApprovals() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [
        APPROVALS_QUERY_KEY,
        APPROVAL_QUERY_KEY,
        APPROVAL_PENDING_UNITS_QUERY_KEY,
        APPROVAL_LOOKUP_QUERY_KEY,
        APPROVAL_SEARCH_QUERY_KEY,
        APPROVAL_PENDING_BY_MODEL_QUERY_KEY,
      ].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    );
}

export function useCreateApproval() {
  const token = useToken();
  const invalidate = useInvalidateApprovals();
  const mutation = useMutation({
    mutationFn: (payload: CreateApprovalPayload) =>
      approvalsService.createApproval(token as string, payload),
    onSuccess: invalidate,
  });
  return {
    createApproval: mutation.mutateAsync,
    isCreatingApproval: mutation.isLoading,
  };
}

export function useUpdateApproval() {
  const token = useToken();
  const invalidate = useInvalidateApprovals();
  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateApprovalPayload;
    }) => approvalsService.updateApproval(token as string, id, payload),
    onSuccess: invalidate,
  });
  return {
    updateApproval: mutation.mutateAsync,
    isUpdatingApproval: mutation.isLoading,
  };
}

export function useCloseApproval() {
  const token = useToken();
  const invalidate = useInvalidateApprovals();
  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      approvalsService.closeApproval(token as string, id, reason),
    onSuccess: invalidate,
  });
  return {
    closeApproval: mutation.mutateAsync,
    isClosingApproval: mutation.isLoading,
  };
}

export function useReopenApproval() {
  const token = useToken();
  const invalidate = useInvalidateApprovals();
  const mutation = useMutation({
    mutationFn: (id: number) =>
      approvalsService.reopenApproval(token as string, id),
    onSuccess: invalidate,
  });
  return {
    reopenApproval: mutation.mutateAsync,
    isReopeningApproval: mutation.isLoading,
  };
}

export function useUploadApprovalDocument() {
  const token = useToken();
  const invalidate = useInvalidateApprovals();
  const mutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      approvalsService.uploadDocument(token as string, id, file),
    onSuccess: invalidate,
  });
  return {
    uploadApprovalDocument: mutation.mutateAsync,
    isUploadingApprovalDocument: mutation.isLoading,
  };
}

export function useMoveApprovalBikes() {
  const token = useToken();
  const invalidate = useInvalidateApprovals();
  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: MoveApprovalBikesPayload;
    }) => approvalsService.moveBikes(token as string, id, payload),
    onSuccess: invalidate,
  });
  return {
    moveApprovalBikes: mutation.mutateAsync,
    isMovingApprovalBikes: mutation.isLoading,
  };
}

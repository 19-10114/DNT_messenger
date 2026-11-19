'use client';

import { useState } from 'react';
import { Banknote } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button.component';
import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { CashWithdrawalFormModal } from './cashWithdrawalFormModal.component';
import { canCreateCashWithdrawals } from './cashWithdrawal.utils';

interface CashWithdrawalButtonProps {
  /** Sucursal activa. Sin una concreta ("Todas" = 0) el botón se deshabilita. */
  branchId: number | undefined;
  branchName?: string;
  variant?: ButtonProps['variant'];
}

/**
 * "Salida de efectivo": abre el registro de una salida para la sucursal
 * activa. Solo para quien puede sacar efectivo (gerente y arriba); para el
 * resto no se muestra.
 */
export function CashWithdrawalButton({
  branchId,
  branchName,
  variant = 'outline',
}: CashWithdrawalButtonProps) {
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const [isOpen, setIsOpen] = useState(false);

  if (!canCreateCashWithdrawals(roles, isSuperuser, isStaff)) return null;
  const hasBranch = !!branchId;

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setIsOpen(true)}
        disabled={!hasBranch}
        title={hasBranch ? undefined : 'Elige una sucursal'}
      >
        <Banknote className="mr-2 h-4 w-4" />
        Salida de efectivo
      </Button>
      {hasBranch && (
        <CashWithdrawalFormModal
          open={isOpen}
          onOpenChange={setIsOpen}
          branchId={branchId}
          branchName={branchName}
        />
      )}
    </>
  );
}

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useAllBranchesUnfiltered } from '@/hooks/useAllBranches';

const ALL_VALUE = 'all';

interface BranchOriginTargetFiltersProps {
  /** `undefined` = sin filtro (mapeado a/desde el sentinel "all" del Select). */
  originBranch: string | undefined;
  targetBranch: string | undefined;
  onOriginChange: (value: string | undefined) => void;
  onTargetChange: (value: string | undefined) => void;
}

/**
 * Dos selects de sucursal independientes y combinables (AND) para filtrar
 * transacciones por sede de origen y sede de destino. No tiene relación con
 * la sucursal activa del dashboard -- esa ya limita a "aparece en cualquiera
 * de los dos lados"; esto filtra por un lado específico, o por ambos a la vez.
 */
export function BranchOriginTargetFilters({
  originBranch,
  targetBranch,
  onOriginChange,
  onTargetChange,
}: BranchOriginTargetFiltersProps) {
  const { data: branches } = useAllBranchesUnfiltered();

  return (
    <>
      <Select
        value={originBranch ?? ALL_VALUE}
        onValueChange={(value) =>
          onOriginChange(value === ALL_VALUE ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sede de origen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Sede de origen: todas</SelectItem>
          {(branches || []).map((branch) => (
            <SelectItem key={branch.id} value={branch.id.toString()}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={targetBranch ?? ALL_VALUE}
        onValueChange={(value) =>
          onTargetChange(value === ALL_VALUE ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sede de destino" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Sede de destino: todas</SelectItem>
          {(branches || []).map((branch) => (
            <SelectItem key={branch.id} value={branch.id.toString()}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

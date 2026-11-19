'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToken, useSuperuser, useIsStaff } from '@/stores/auth/auth.store';
import { BranchService } from '@/services/branches/branch.service';
import { BranchTable } from '@/components/tables/branchTable.component';
import { BranchForm } from '@/components/forms/branchForm.component';
import { Button } from '@/components/ui/button.component';
import { BranchItem } from '@/services/branches/types/Branch.type';
import { useToast } from '@/components/ui/use-toast';

const branchService = new BranchService();

export default function BranchManagementPage() {
  const token = useToken() || '';
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchItem | undefined>();

  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();

  // Verificar si el usuario es administrador
  const isAdmin = isSuperuser === true && isStaff === false;

  // Fetch branches
  const {
    data: branchesData,
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    refetch: refetchBranches,
  } = useQuery({
    queryKey: ['branches', token],
    queryFn: () => {
      // Usar '20' como valor predeterminado para administradores
      return branchService.getBranches(token, '20');
    },
    enabled: !!token,
  });

  const handleCreateBranch = () => {
    setBranchToEdit(undefined);
    setShowForm(true);
  };

  const handleEditBranch = (branch: BranchItem) => {
    setBranchToEdit(branch);
    setShowForm(true);
  };

  const handleDeleteBranch = async (branch: BranchItem) => {
    if (!token) return;

    try {
      await branchService.deleteBranch(token, branch.name);
      toast.toast({
        title: 'Éxito',
        description: 'Sucursal eliminada correctamente',
      });
      refetchBranches();
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: 'No se pudo eliminar la sucursal',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    refetchBranches();
  };

  // Si no es administrador, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4 text-primary">
          Acceso Denegado
        </h1>
        <p>No tienes permisos para acceder.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="border-l-4 border-primary pl-4 mb-6">
          <h1 className="text-2xl font-semibold text-primary font-serif">
            Gestión de Sucursales
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Visualización, Gestión y Administración de Sucursales.
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleCreateBranch}>Nueva Sucursal</Button>
        )}
      </div>

      {showForm ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {branchToEdit ? 'Editar' : 'Crear'} Sucursal
          </h2>
          <BranchForm
            branchToEdit={branchToEdit}
            onSuccess={handleFormSuccess}
          />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="mr-2"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          {isErrorBranches ? (
            <div className="text-red-500">
              Error al cargar las sucursales. Por favor, intenta de nuevo.
            </div>
          ) : (
            <BranchTable
              branchData={branchesData?.data || []}
              isLoading={isLoadingBranches}
              onEdit={handleEditBranch}
              onDelete={handleDeleteBranch}
              isAdmin={isAdmin}
            />
          )}
        </>
      )}
    </div>
  );
}

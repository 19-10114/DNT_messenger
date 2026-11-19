import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToken } from '@/stores/auth/auth.store';
import { TrashIcon } from '@/app/icons/trash';
import { EditIcon } from '@/app/icons/edit';
import { Button } from '../ui/button.component';
import { useProductCategories } from '@/hooks/products';
import { CategoryModel } from '@/models/category.model';
import { ProductsService } from '@/services/products/products.service';
import { Category } from '@/services/products/types/Categories.type';

const productsService = new ProductsService();

function Categories() {
  const token = useToken() || '';
  const queryClient = useQueryClient();
  const categories = useProductCategories();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editedCategoryName, setEditedCategoryName] = useState('');

  // Mutación para eliminar categoría
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => {
      // Aquí implementaremos la eliminación cuando esté disponible en el backend
      return Promise.resolve(); // Placeholder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    },
  });

  const openEditPopup = (categoryId: string, categoryName: string) => {
    setEditingCategoryId(categoryId);
    setEditedCategoryName(categoryName);
  };

  const closeEditPopup = () => {
    setEditingCategoryId(null);
    setEditedCategoryName('');
  };

  const handleEditCategory = async () => {
    try {
      if (editingCategoryId !== null) {
        // Aquí implementaremos la actualización cuando esté disponible en el backend
        // Por ahora, solo cerramos el popup
        closeEditPopup();
        queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      }
    } catch (error) {
      console.error('Error al editar la categoría', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      console.error('Error al eliminar la categoría', error);
    }
  };

  if (categories.isLoading) {
    return <div>Cargando categorías...</div>;
  }

  if (categories.isError) {
    return <div>Error al cargar las categorías</div>;
  }

  return (
    <section className="pt-4">
      {categories.data && categories.data.length > 0 ? (
        <>
          {categories.data.map((category: Category) => (
            <div
              key={category.id}
              className="flex justify-between items-center mb-2 p-3 border border-gray-200 rounded-md"
            >
              <h1 className="mr-2">{category.name}</h1>
              {/* FIXME: UNCOMMENT WHEN BE IS FIXED
              <div className="flex space-x-2">
                <button
                  title="Editar categoría"
                  type="button"
                  className="text-sm p-1 hover:bg-gray-100 rounded-full"
                  onClick={() =>
                    openEditPopup(String(category.id), category.name)
                  }
                >
                  <EditIcon />
                </button>
                
                <button 
                  title="Eliminar categoría"
                  type="button"
                  className="text-sm p-1 hover:bg-gray-100 rounded-full"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <TrashIcon />
                </button>
              </div> */}
            </div>
          ))}
        </>
      ) : (
        <div className="text-center py-4">No hay categorías disponibles</div>
      )}

      {editingCategoryId !== null && (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Editar Categoría</h2>
            <input
              aria-label="editedCategoryName"
              type="text"
              className="border border-gray-300 rounded-md p-2 mb-2 w-full"
              value={editedCategoryName}
              onChange={(e) => setEditedCategoryName(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button className="mx-2" onClick={handleEditCategory}>
                Aceptar
              </Button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                onClick={closeEditPopup}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Categories;

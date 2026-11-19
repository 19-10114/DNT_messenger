'use client';
import React, { useState } from 'react';

import { Title } from '@/components/typography/title.component';
import { Button } from '@/components/ui/button.component';
import { useToken, useAuthService } from '@/stores/auth/auth.store';
import Categories from '@/components/category/categories.component';
import { useProductCategories } from '@/hooks/products';
import { ProductsService } from '@/services/products/products.service';

const productsService = new ProductsService();

export default function CategoriesPage() {
  const authService = useAuthService();
  const token = useToken() || '';
  const { refetch: refetchCategories } = useProductCategories();
  const [categoryName, setCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      alert('Por favor ingrese un nombre para la categoría');
      return;
    }

    setIsCreating(true);
    try {
      const currentUser = await authService.getCurrentUser(token);
      if (currentUser) {
        const userId = currentUser.id.toString();
        const categoryData = {
          id: userId,
          name: categoryName,
          parent: null,
        };

        // Implementar la creación de categoría cuando esté disponible en el backend
        // Por ahora, solo simulamos la creación
        // await productsService.createCategory(token, categoryData);

        setCategoryName('');
        refetchCategories(); // Refrescar las categorías para obtenerlas actualizadas
      } else {
        console.error('No se pudo obtener el usuario actual.');
      }
    } catch (error) {
      console.error('Error al crear la categoría:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <section className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <div className="border-l-4 border-primary pl-4 mb-6">
          <h1 className="text-2xl font-semibold text-primary font-serif">
            Categorías
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Visualización, Gestión y Administración de Categorías
          </p>
        </div>
        {/* <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
            disabled={isCreating}
          />
          <Button 
            onClick={handleCreateCategory} 
            disabled={isCreating || !categoryName.trim()}
            className="whitespace-nowrap"
          >
            {isCreating ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </div> */}
      </section>
      <Categories />
    </>
  );
}

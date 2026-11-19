'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import {
  useCarouselImages,
  useCreateCarouselImage,
  useUpdateCarouselImage,
  useDeleteCarouselImage,
} from '@/hooks/useCarouselImages';
import { useToken, useSuperuser, useIsStaff } from '@/stores/auth/auth.store';
import type {
  CarouselImage,
  CreateCarouselImageData,
} from '@/services/carousel/types';
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/services/auth/auth.service';
import { Button } from '@/components/ui/button.component';
import { useToast } from '@/components/ui/use-toast';

export default function CarouselAdminPage() {
  const router = useRouter();
  const token = useToken();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    description: string;
    id: number | null;
  }>({
    isOpen: false,
    description: '',
    id: null,
  });

  const authService = new AuthService();

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => {
      if (!token) throw new Error('Token required');
      return authService.getCurrentUser(token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();

  const isAdmin = isSuperuser === true && isStaff === false;

  const { mutate: createImage, isLoading: isCreating } = useCreateCarouselImage(
    token!
  );
  const { mutate: updateImage, isLoading: isUpdating } = useUpdateCarouselImage(
    token!
  );
  const { mutate: deleteImage, isLoading: isDeleting } = useDeleteCarouselImage(
    token!
  );

  const {
    data: carouselData,
    isLoading: isLoadingImages,
    refetch,
  } = useCarouselImages(token, {
    page: '1',
    pageSize: '50',
  });

  const carouselImages = carouselData?.results || [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (20MB)
      if (file.size > 20 * 1024 * 1024) {
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Limpiar input file
    const fileInput = document.getElementById(
      'file-upload'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleCreate = () => {
    if (!selectedFile) {
      toast.toast({
        title: 'Advertencia',
        description: 'Por favor selecciona un archivo',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast.toast({
        title: 'Advertencia',
        description: 'Por favor ingresa una descripción',
        variant: 'destructive',
      });
      return;
    }

    const payload: CreateCarouselImageData = {
      image: selectedFile,
      description: description,
      is_featured: isFeatured,
    };

    createImage(payload, {
      onSuccess: () => {
        // Reset form
        setSelectedFile(null);
        setDescription('');
        setIsFeatured(false);
        // Limpiar input file
        const fileInput = document.getElementById(
          'file-upload'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        refetch();
        toast.toast({
          title: 'Éxito',
          description: 'Imagen creada exitosamente',
        });
      },
      onError: (error) => {
        toast.toast({
          title: 'Error',
          description: 'Error al crear la imagen',
          variant: 'destructive',
        });
      },
    });
  };

  const handleUpdateFeatured = (image: CarouselImage) => {
    updateImage(
      {
        id: image.id,
        is_featured: !image.isFeatured,
      },
      {
        onSuccess: (data) => {
          refetch();
        },
      }
    );
  };

  const handleDelete = (image: CarouselImage) => {
    setDeleteModal({
      isOpen: true,
      description: image.description,
      id: image.id,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.id) return;

    deleteImage(deleteModal.id, {
      onSuccess: () => {
        setDeleteModal({ isOpen: false, description: '', id: null });
        toast.toast({
          title: 'Éxito',
          description: 'Imagen eliminada exitosamente',
        });
        refetch();
      },
      onError: (error) => {
        toast.toast({
          title: 'Error',
          description: 'Error al eliminar la imagen',
          variant: 'destructive',
        });
      },
    });
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, description: '', id: null });
  };

  // Estados de carga
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900 mb-2">
            Acceso denegado
          </p>
          <p className="text-gray-600">No tienes permisos de administrador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <Button
          onClick={() => router.back()}
          className="mb-4 px-4 bg-primary text-white rounded hover:bg-primary-dark"
        >
          <ArrowLeft />
        </Button>
        <div className="py-4">
          <h1 className="text-2xl font-semibold mb-2 text-primary font-serif">
            Administrar Carrusel
          </h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              className={`flex-1 px-6 py-4 font-medium text-center ${
                activeTab === 'create'
                  ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Crear Nuevo
            </button>
            <button
              className={`flex-1 px-6 py-4 font-medium text-center ${
                activeTab === 'manage'
                  ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('manage')}
            >
              Gestionar Existente ({carouselImages.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'create' && (
              <div className="space-y-6 max-w-2xl">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir Archivo (Imagen/Video) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <div className="w-full max-w-xs bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)}{' '}
                                MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer text-green-600 hover:text-green-500 underline"
                          >
                            Cambiar archivo
                          </label>
                        </p>
                      </div>
                    ) : (
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                        <span className="text-lg font-medium text-gray-600 mb-1">
                          Haz clic para subir un archivo
                        </span>
                        <span className="text-sm text-gray-500">
                          PNG, JPG, GIF, WEBP, MP4, WEBM hasta 20MB
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe la imagen para el carrusel..."
                    maxLength={100}
                  />
                </div>

                {/* Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destacado
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Mostrar en carrusel principal
                    </span>
                  </label>
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !selectedFile || !description.trim()}
                  className="w-full border text-gray-800 font-bold border-input bg-background hover:bg-accent hover:text-accent-foreground py-3 px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Creando...
                    </span>
                  ) : (
                    'Crear Imagen'
                  )}
                </Button>
              </div>
            )}

            {activeTab === 'manage' && (
              <div>
                {isLoadingImages ? (
                  <div className="text-center py-12">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-3" />
                    <p className="text-gray-600">Cargando imágenes...</p>
                  </div>
                ) : carouselImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      No hay imágenes en el carrusel
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {carouselImages.map((image: CarouselImage) => (
                      <div
                        key={image.id}
                        className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Preview */}
                        <div className="aspect-video bg-gray-100 relative">
                          {image.fileType === 'video' ? (
                            <video
                              src={image.imageUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={image.imageUrl}
                              alt={image.description}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-2 right-2 bg-black/70 rounded-full p-1">
                            {image.fileType === 'video' ? (
                              <Video className="h-4 w-4 text-white" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Info and Controls */}
                        <div className="p-4">
                          <p className="text-sm text-gray-800 mb-3 font-medium line-clamp-2">
                            {image.description || 'Sin descripción'}
                          </p>

                          <div className="space-y-3">
                            {/* Featured Toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Destacado:
                              </span>
                              <button
                                onClick={() => handleUpdateFeatured(image)}
                                disabled={isUpdating}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  image.isFeatured
                                    ? 'bg-blue-600'
                                    : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    image.isFeatured
                                      ? 'translate-x-6'
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Delete Button */}
                            <div className="flex justify-end pt-2 border-t">
                              <button
                                onClick={() => handleDelete(image)}
                                disabled={isDeleting}
                                className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm disabled:opacity-50 transition-colors"
                              >
                                <Trash2 size={14} />
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de Confirmación de Eliminación */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Eliminar imagen?
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ¿Estás seguro de que deseas eliminar{' '}
                  <strong>{deleteModal.description || 'esta imagen'}</strong>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

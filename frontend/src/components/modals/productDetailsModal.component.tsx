'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as echarts from 'echarts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.component';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import { useToast } from '@/components/ui/use-toast';
import { ProductModel } from '@/models/product.model';
import { useToken } from '@/stores/auth/auth.store';
import { useGlobalPartInventory } from '@/hooks/useGlobalPartInventory';
import { useUpdateProduct } from '@/hooks/products/useUpdateProduct';
import { useProductCategories } from '@/hooks/products/useProductCategories';
import { TransactionService } from '@/services/transactions/transactions.service';
import { ProductsService } from '@/services/products/products.service';
import { GeneralBikeInventoryResponse } from '@/services/products/types';
import { ProductImagesService } from '@/services/products/product-images.service';
import { ProductImageModel } from '@/models/product-images.model';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import TransactionDetailsDialog from '@/components/modals/TransactionDetailsDialog.component';
import { useOrders } from '@/hooks/useOrders';
import { OrderData } from '@/services/orders/types/Order.type';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import {
  ProductTransactionBranchTotal,
  ProductTransactionItem,
} from '@/services/transactions/types/ProductTransactions.type';
import { ProductUtilitySummary } from '@/services/transactions/types/ProductUtility.type';
import { cn, formatDate, usdFormatCurrency } from '@/lib/utils';
import {
  Package2,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Plus,
  Trash2,
  ImageOff,
} from 'lucide-react';
import { useRoles } from '@/stores/auth/auth.store';
import {
  ActivityTimeline,
  useCanViewActivity,
} from '@/components/activity/activityTimeline.component';
import { BIKES_COLORS } from '@/constants/products';

const transactionService = new TransactionService();
const productsService = new ProductsService();
const productImagesService = new ProductImagesService();

const IMAGE_COLORS = BIKES_COLORS;

/** Categoría de repuestos: su costo se muestra con un 19% adicional. */
const PARTS_CATEGORY_ID = 2;
const PARTS_COST_DISPLAY_MULTIPLIER = 1.19;

interface PendingImageUpload {
  key: string;
  file: File;
  previewUrl: string;
  color: string;
  isVisible: boolean;
}

type TabValue =
  | 'info'
  | 'inventory'
  | 'purchase'
  | 'sale'
  | 'utility'
  | 'history';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'info', label: 'Información' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venta' },
  { value: 'utility', label: 'Utilidad' },
  // Solo para quien ve el registro de actividad (se filtra en el render)
  { value: 'history', label: 'Historial' },
];

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductModel | null;
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  product,
}: ProductDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('info');
  const canViewActivity = useCanViewActivity();
  const visibleTabs = TABS.filter(
    (tab) => tab.value !== 'history' || canViewActivity
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab('info');
    }
  }, [isOpen, product?.id]);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        width="min(760px, calc(100vw - 2rem))"
        maxHeight="85vh"
        className="min-w-0 max-w-[calc(100vw-2rem)] overflow-x-hidden p-4 sm:p-6"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 pr-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <Package2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="break-words text-sm font-semibold text-gray-900 sm:text-base">
                {product.name}
              </DialogTitle>
              <DialogDescription className="mt-0.5 break-all text-xs text-gray-500">
                SKU:{' '}
                <span className="font-medium text-gray-700">{product.sku}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-w-0 border-b border-gray-200">
          <nav className="-mb-px flex gap-4 overflow-x-auto sm:gap-6">
            {visibleTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'shrink-0 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-gray-800 hover:text-gray-600'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-2 min-w-0">
          {activeTab === 'info' && <ProductInfoTab product={product} />}

          {activeTab === 'inventory' && (
            <ProductInventoryTab isOpen={isOpen} product={product} />
          )}

          {activeTab === 'purchase' && (
            <ProductTransactionsTab productId={product.id} type="purchase" />
          )}

          {activeTab === 'sale' && (
            <ProductTransactionsTab productId={product.id} type="sale" />
          )}

          {activeTab === 'utility' && (
            <ProductUtilityTab productId={product.id} />
          )}

          {activeTab === 'history' && canViewActivity && (
            <ActivityTimeline
              targetModel="product"
              targetId={product.id}
              variant="plain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-bold text-gray-800', valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function EditSwitch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Editar</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Editar producto"
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-secondary' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  );
}

interface ProductInfoForm {
  name: string;
  sku: string;
  brand: string;
  model: string;
  cost: string;
  price: string;
  category: string;
}

function buildInfoForm(product: ProductModel): ProductInfoForm {
  return {
    name: product.name ?? '',
    sku: product.sku ?? '',
    brand: product.brand ?? '',
    model: product.model ?? '',
    cost: `${product.cost ?? 0}`,
    price: `${product.price ?? 0}`,
    category: product.category != null ? `${product.category}` : '',
  };
}

function ProductInfoTab({ product }: { product: ProductModel }) {
  const { toast } = useToast();
  const token = useToken() || '';
  const roles = useRoles();
  const isAdmin = roles.includes('admin');
  const queryClient = useQueryClient();
  const updateProduct = useUpdateProduct();
  const { data: categories } = useProductCategories();

  const [panel, setPanel] = useState<'info' | 'images'>('info');

  // Un solo estado de edición compartido por información e imágenes.
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProductInfoForm>(() =>
    buildInfoForm(product)
  );

  // Estado de imágenes.
  const [visibilityChanges, setVisibilityChanges] = useState<
    Record<number, boolean>
  >({});
  const [pendingUploads, setPendingUploads] = useState<PendingImageUpload[]>(
    []
  );
  const [pendingDeletions, setPendingDeletions] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const touchStartYRef = useRef<number | null>(null);

  const initialForm = useMemo(() => buildInfoForm(product), [product]);

  const infoDirty =
    isEditing && JSON.stringify(form) !== JSON.stringify(initialForm);
  const imagesDirty =
    Object.keys(visibilityChanges).length > 0 ||
    pendingUploads.length > 0 ||
    pendingDeletions.length > 0;
  const isDirty = infoDirty || imagesDirty;

  const resetAll = useCallback(() => {
    setForm(buildInfoForm(product));
    setIsEditing(false);
    setVisibilityChanges({});
    setPendingDeletions([]);
    setPendingUploads((prev) => {
      prev.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
      return [];
    });
  }, [product]);

  useEffect(() => {
    resetAll();
    setPanel('info');
  }, [product, resetAll]);

  // El carrusel de dos paneles solo existe en edición; ahí navegan las flechas.
  useEffect(() => {
    if (!isEditing) return;
    const handler = (event: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (event.key === 'ArrowDown') setPanel('images');
      else if (event.key === 'ArrowUp') setPanel('info');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditing]);

  const setField = (field: keyof ProductInfoForm, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  // Toggle único de edición: al apagarlo se descartan los cambios (info e imágenes).
  const handleEditingChange = (checked: boolean) => {
    if (checked) {
      setPanel('info');
      setIsEditing(true);
    } else {
      resetAll();
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartYRef.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY === null) return;
    const deltaY = event.changedTouches[0].clientY - startY;
    if (Math.abs(deltaY) < SWIPE_THRESHOLD_PX) return;
    setPanel(deltaY < 0 ? 'images' : 'info');
  };

  const handleToggleVisibility = (image: ProductImageModel, next: boolean) => {
    setVisibilityChanges((prev) => {
      const updated = { ...prev };
      // Si vuelve al valor original, deja de contar como cambio.
      if (next === image.isVisible) delete updated[image.id];
      else updated[image.id] = next;
      return updated;
    });
  };

  const handleToggleDeletion = (imageId: number) => {
    setPendingDeletions((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
    // Un cambio de visibilidad sobre una imagen a eliminar ya no tiene sentido.
    setVisibilityChanges((prev) => {
      if (!(imageId in prev)) return prev;
      const updated = { ...prev };
      delete updated[imageId];
      return updated;
    });
  };

  const handleAddUpload = (file: File) => {
    setPendingUploads((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
        color: IMAGE_COLORS[0],
        isVisible: true,
      },
    ]);
  };

  const handleUpdateUpload = (
    key: string,
    patch: Partial<Pick<PendingImageUpload, 'color' | 'isVisible'>>
  ) => {
    setPendingUploads((prev) =>
      prev.map((upload) =>
        upload.key === key ? { ...upload, ...patch } : upload
      )
    );
  };

  const handleRemoveUpload = (key: string) => {
    setPendingUploads((prev) => {
      const target = prev.find((upload) => upload.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((upload) => upload.key !== key);
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (infoDirty) {
        await updateProduct.mutateAsync({
          id: product.id,
          name: form.name,
          sku: form.sku,
          brand: form.brand,
          cost: Number(form.cost),
          price: Number(form.price),
          ...(form.category ? { category: Number(form.category) } : {}),
          // Solo se envía el modelo en repuestos, que es donde es editable.
          ...(product.category === PARTS_CATEGORY_ID
            ? { model: form.model }
            : {}),
        });
      }

      await Promise.all(
        pendingDeletions.map((id) => productImagesService.delete(id, token))
      );

      await Promise.all(
        Object.entries(visibilityChanges)
          // No se actualiza la visibilidad de imágenes que se van a eliminar.
          .filter(([id]) => !pendingDeletions.includes(Number(id)))
          .map(([id, isVisible]) =>
            productImagesService.update(
              { id: Number(id), is_visible: isVisible },
              token
            )
          )
      );

      await Promise.all(
        pendingUploads.map((upload) =>
          productImagesService.upload(
            {
              image: upload.file,
              color: upload.color,
              product: `${product.id}`,
              is_visible: `${upload.isVisible}`,
            },
            token
          )
        )
      );

      queryClient.invalidateQueries({
        queryKey: ['productImagesVisible', product.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['productImagesAll', product.id],
      });

      toast({
        title: 'Éxito',
        description: 'Cambios guardados correctamente.',
      });
      resetAll();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {!isEditing ? (
        // Vista: una sola página. Galería de imágenes visibles a la izquierda,
        // información a la derecha.
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <EditSwitch
                checked={false}
                onCheckedChange={handleEditingChange}
                disabled={saving}
              />
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="min-w-0 sm:w-1/2">
              <ProductVisibleGallery productId={product.id} />
            </div>
            <div className="min-w-0 sm:w-1/2">
              <ProductInfoFields
                product={product}
                form={form}
                isEditing={false}
                setField={setField}
                categories={categories}
              />
            </div>
          </div>
        </div>
      ) : (
        // Edición: carrusel de dos paneles (información / imágenes).
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {panel === 'info' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <EditSwitch
                  checked={isEditing}
                  onCheckedChange={handleEditingChange}
                  disabled={saving}
                />
              </div>

              <ProductInfoFields
                product={product}
                form={form}
                isEditing
                setField={setField}
                categories={categories}
              />

              {/* Flecha para bajar al módulo de imágenes. */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setPanel('images')}
                  aria-label="Ir a imágenes"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <span className="text-[11px] text-gray-400">Imágenes</span>
              </div>
            </div>
          ) : (
            <ProductImagesPanel
              productId={product.id}
              showColorSelector={product.category === 1}
              editing={isEditing}
              onEditingChange={handleEditingChange}
              visibilityChanges={visibilityChanges}
              onToggleVisibility={handleToggleVisibility}
              pendingDeletions={pendingDeletions}
              onToggleDeletion={handleToggleDeletion}
              pendingUploads={pendingUploads}
              onAddUpload={handleAddUpload}
              onUpdateUpload={handleUpdateUpload}
              onRemoveUpload={handleRemoveUpload}
              onBack={() => setPanel('info')}
              disabled={saving}
            />
          )}
        </div>
      )}

      {isDirty && (
        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Campos de información del producto */
function ProductInfoFields({
  product,
  form,
  isEditing,
  setField,
  categories,
}: {
  product: ProductModel;
  form: ProductInfoForm;
  isEditing: boolean;
  setField: (field: keyof ProductInfoForm, value: string) => void;
  categories?: { id: number; name: string }[];
}) {
  const categoryName =
    categories?.find((category) => `${category.id}` === form.category)?.name ??
    '—';

  const textFields: { label: string; field: keyof ProductInfoForm }[] = [
    { label: 'Nombre', field: 'name' },
    { label: 'SKU', field: 'sku' },
    { label: 'Marca', field: 'brand' },
    // El modelo solo aplica a repuestos
    ...(product.category === PARTS_CATEGORY_ID
      ? [{ label: 'Modelo', field: 'model' as const }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {(['cost', 'price'] as const).map((field) => {
          // En repuestos el costo se muestra con el 19% adicional. El valor que
          // se edita/guarda sigue siendo el original, para no acumular el ajuste.
          const isPartCost =
            field === 'cost' && product.category === PARTS_CATEGORY_ID;
          const displayValue = isPartCost
            ? Number(form[field]) * PARTS_COST_DISPLAY_MULTIPLIER
            : Number(form[field]);

          return (
            <div
              key={field}
              className="min-w-0 flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {field === 'cost' ? 'Costo' : 'Precio'}
              </p>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form[field]}
                  onChange={(event) => setField(field, event.target.value)}
                  className="mt-1 h-9 bg-white text-lg font-bold"
                />
              ) : (
                <p className="mt-1 break-all text-xl font-bold text-gray-800">
                  {usdFormatCurrency(displayValue)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {textFields.map(({ label, field }) => (
          <div
            key={field}
            className={cn(
              'rounded-lg border border-gray-100 bg-gray-50 px-4 py-2',
              isEditing
                ? 'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
                : 'flex items-center justify-between gap-3'
            )}
          >
            <span className="shrink-0 text-sm font-medium text-gray-500">
              {label}
            </span>
            {isEditing ? (
              <Input
                value={form[field]}
                onChange={(event) => setField(field, event.target.value)}
                className="h-9 bg-white sm:max-w-[65%]"
              />
            ) : (
              <span className="min-w-0 break-all text-right text-sm font-semibold text-gray-800">
                {form[field]}
              </span>
            )}
          </div>
        ))}

        {/* Categoría: se muestra el nombre, pero al editar se envía el id. */}
        <div
          className={cn(
            'rounded-lg border border-gray-100 bg-gray-50 px-4 py-2',
            isEditing
              ? 'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
              : 'flex items-center justify-between gap-3'
          )}
        >
          <span className="shrink-0 text-sm font-medium text-gray-500">
            Categoría
          </span>
          {isEditing ? (
            <select
              value={form.category}
              onChange={(event) => setField('category', event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-[65%]"
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {categories?.map((category) => (
                <option key={category.id} value={`${category.id}`}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="min-w-0 break-all text-right text-sm font-semibold capitalize text-gray-800">
              {categoryName}
            </span>
          )}
        </div>

        {product.description && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
            <p className="mb-1 text-sm font-medium text-gray-500">
              Descripción
            </p>
            <p className="text-sm text-gray-800">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Galería de imágenes visibles */
function ProductVisibleGallery({ productId }: { productId: number }) {
  const token = useToken() || '';
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const visibleQuery = useQuery({
    queryKey: ['productImagesVisible', productId, token],
    queryFn: () => productImagesService.getVisibleByProduct(productId, token),
    enabled: !!productId,
  });

  if (visibleQuery.isLoading || visibleQuery.isError) {
    return (
      <QueryState
        isLoading={visibleQuery.isLoading}
        isError={visibleQuery.isError}
      />
    );
  }

  const images = visibleQuery.data?.data?.results ?? [];
  if (images.length === 0) return <ImagesEmpty />;

  const selected = images.find((image) => image.id === selectedId) ?? images[0];

  return (
    <div className="space-y-2">
      <img
        src={selected.imageUrl}
        alt={selected.color}
        className="aspect-square w-full rounded-lg border border-gray-100 object-cover"
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {/* No se muestra la miniatura de la imagen que ya está en grande. */}
          {images
            .filter((image) => image.id !== selected.id)
            .map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedId(image.id)}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-100 transition-colors hover:border-secondary"
              >
                <img
                  src={image.imageUrl}
                  alt={image.color}
                  className="h-full w-full bg-white object-contain"
                />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function ProductImagesPanel({
  productId,
  showColorSelector,
  editing,
  onEditingChange,
  visibilityChanges,
  onToggleVisibility,
  pendingDeletions,
  onToggleDeletion,
  pendingUploads,
  onAddUpload,
  onUpdateUpload,
  onRemoveUpload,
  onBack,
  disabled,
}: {
  productId: number;
  showColorSelector: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  visibilityChanges: Record<number, boolean>;
  onToggleVisibility: (image: ProductImageModel, next: boolean) => void;
  pendingDeletions: number[];
  onToggleDeletion: (imageId: number) => void;
  pendingUploads: PendingImageUpload[];
  onAddUpload: (file: File) => void;
  onUpdateUpload: (
    key: string,
    patch: Partial<Pick<PendingImageUpload, 'color' | 'isVisible'>>
  ) => void;
  onRemoveUpload: (key: string) => void;
  onBack: () => void;
  disabled: boolean;
}) {
  const token = useToken() || '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vista: solo imágenes visibles. Edición: todas las imágenes del producto.
  const visibleQuery = useQuery({
    queryKey: ['productImagesVisible', productId, token],
    queryFn: () => productImagesService.getVisibleByProduct(productId, token),
    enabled: !editing && !!productId,
  });

  const allImagesQuery = useQuery({
    queryKey: ['productImagesAll', productId, token],
    queryFn: () => productImagesService.getImagesByProductId(productId, token),
    enabled: editing && !!productId,
  });

  const visibleImages = visibleQuery.data?.data?.results ?? [];
  const allImages = allImagesQuery.data?.data ?? [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onAddUpload(file);
    // Permite volver a seleccionar el mismo archivo.
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a información"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        <p className="text-sm font-semibold text-gray-800">Imágenes</p>

        <EditSwitch
          checked={editing}
          onCheckedChange={onEditingChange}
          disabled={disabled}
        />
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-secondary hover:text-secondary disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Agregar nueva
          </button>

          {/* Nuevas imágenes por subir (se cargan al guardar). */}
          {pendingUploads.map((upload) => (
            <div
              key={upload.key}
              className="flex gap-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3"
            >
              <img
                src={upload.previewUrl}
                alt="Nueva imagen"
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
              <div className="flex flex-1 flex-col gap-2">
                {showColorSelector && (
                  <select
                    value={upload.color}
                    onChange={(event) =>
                      onUpdateUpload(upload.key, { color: event.target.value })
                    }
                    className="h-8 rounded-md border border-input bg-white px-2 text-sm"
                  >
                    {IMAGE_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                )}
                <label className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={upload.isVisible}
                    onChange={(event) =>
                      onUpdateUpload(upload.key, {
                        isVisible: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-secondary"
                  />
                  Visible
                </label>
              </div>
              <button
                type="button"
                onClick={() => onRemoveUpload(upload.key)}
                aria-label="Quitar imagen"
                className="self-start text-gray-400 transition-colors hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {allImagesQuery.isLoading || allImagesQuery.isError ? (
            <QueryState
              isLoading={allImagesQuery.isLoading}
              isError={allImagesQuery.isError}
            />
          ) : allImages.length === 0 ? (
            <ImagesEmpty />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allImages.map((image) => {
                const isVisible =
                  visibilityChanges[image.id] ?? image.isVisible;
                const markedForDeletion = pendingDeletions.includes(image.id);
                return (
                  <div
                    key={image.id}
                    className={cn(
                      'overflow-hidden rounded-lg border border-gray-100',
                      markedForDeletion && 'ring-2 ring-red-400'
                    )}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.color}
                      className={cn(
                        'h-24 w-full bg-white object-contain',
                        markedForDeletion && 'opacity-40'
                      )}
                    />

                    <div className="flex items-center justify-between px-2 py-1.5">
                      {markedForDeletion ? (
                        <button
                          type="button"
                          onClick={() => onToggleDeletion(image.id)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <label className="flex items-center gap-1.5 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(event) =>
                              onToggleVisibility(image, event.target.checked)
                            }
                            className="h-3.5 w-3.5 accent-secondary"
                          />
                          Visible
                        </label>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleDeletion(image.id)}
                        aria-label={
                          markedForDeletion
                            ? 'Restaurar imagen'
                            : 'Eliminar imagen'
                        }
                        title={markedForDeletion ? 'Restaurar' : 'Eliminar'}
                        className="text-red-500 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : visibleQuery.isLoading || visibleQuery.isError ? (
        <QueryState
          isLoading={visibleQuery.isLoading}
          isError={visibleQuery.isError}
        />
      ) : visibleImages.length === 0 ? (
        <ImagesEmpty />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleImages.map((image) => (
            <img
              key={image.id}
              src={image.imageUrl}
              alt={image.color}
              className="h-24 w-full rounded-lg border border-gray-100 object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ImagesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <ImageOff className="h-6 w-6 text-gray-300" />
      <p className="text-sm text-gray-500">
        No hay imágenes para este producto.
      </p>
    </div>
  );
}

function QueryState({
  isLoading,
  isError,
}: {
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-green-500" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <AlertCircle className="h-6 w-6 text-red-400" />
      <p className="text-sm text-gray-500">
        Error al cargar los datos. Intenta de nuevo.
      </p>
    </div>
  );
}

function BranchInventoryCost({
  productId,
  branchId,
}: {
  productId: number;
  branchId: number;
}) {
  const token = useToken() || '';

  const inventoryCostQuery = useQuery({
    queryKey: ['productInventoryCost', productId, branchId, token],
    queryFn: () =>
      transactionService.getProductInventoryCost(token, productId, branchId),
  });

  if (inventoryCostQuery.isLoading || inventoryCostQuery.isError) {
    return (
      <QueryState
        isLoading={inventoryCostQuery.isLoading}
        isError={inventoryCostQuery.isError}
      />
    );
  }

  const data = inventoryCostQuery.data?.data;
  const layers = data?.layers ?? [];

  if (!data) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        No hay datos de costo para esta sucursal.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-gray-500">Cantidad total:</span>
          <span className="text-sm font-semibold text-gray-800">
            {data.totalQuantity.toLocaleString()}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-gray-500">Valor total:</span>
          <span className="text-sm font-semibold text-gray-800">
            {usdFormatCurrency(data.totalValue)}
          </span>
        </div>
      </div>

      {layers.length === 0 ? (
        <p className="py-2 text-center text-sm text-gray-500">
          No hay capas de costo registradas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed border-collapse border border-gray-300">
            <TableHeader>
              <TableRow className="bg-gray-200 text-gray-800 text-xs font-medium uppercase tracking-wider">
                <TableHead className="p-2 text-center text-gray-800">
                  Costo unitario
                </TableHead>
                <TableHead className="p-2 text-center text-gray-800">
                  Cantidad
                </TableHead>
                <TableHead className="p-2 text-center text-gray-800">
                  Valor total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layers.map((layer, index) => (
                <TableRow key={index}>
                  <TableCell className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600 break-words">
                    {usdFormatCurrency(layer.unitCost)}
                  </TableCell>
                  <TableCell className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600 break-words">
                    {layer.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600 break-words">
                    {usdFormatCurrency(layer.totalValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

type UtilityMetric = 'utility' | 'revenue' | 'cogs' | 'unitsSold';

const UTILITY_METRICS: {
  value: UtilityMetric;
  label: string;
  isCurrency: boolean;
  pieEnabled: boolean;
}[] = [
  { value: 'utility', label: 'Utilidad', isCurrency: true, pieEnabled: false },
  { value: 'revenue', label: 'Ingresos', isCurrency: true, pieEnabled: false },
  { value: 'cogs', label: 'Costo', isCurrency: true, pieEnabled: false },
  {
    value: 'unitsSold',
    label: 'Unidades vendidas',
    isCurrency: false,
    pieEnabled: true,
  },
];

const UTILITY_SUMMARY_KPIS: {
  key: keyof ProductUtilitySummary;
  label: string;
  isCurrency: boolean;
}[] = [
  { key: 'revenue', label: 'Ingresos', isCurrency: true },
  { key: 'cogs', label: 'Costo de venta', isCurrency: true },
  { key: 'utility', label: 'Utilidad', isCurrency: true },
  { key: 'unitsSold', label: 'Unidades vendidas', isCurrency: false },
  { key: 'unitsPurchased', label: 'Unidades compradas', isCurrency: false },
  { key: 'unitsMatched', label: 'Unidades conciliadas', isCurrency: false },
  { key: 'unmatchedUnits', label: 'Unidades sin conciliar', isCurrency: false },
];

function ProductUtilityTab({ productId }: { productId: number }) {
  const token = useToken() || '';
  const [metric, setMetric] = useState<UtilityMetric>('utility');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    {}
  );

  const utilityQuery = useQuery({
    queryKey: [
      'productUtility',
      productId,
      token,
      dateRange.start ?? null,
      dateRange.end ?? null,
    ],
    queryFn: () =>
      transactionService.getProductUtility(token, productId, {
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    enabled: !!productId,
    keepPreviousData: true,
  });

  const handleDateChange = (start?: string, end?: string) => {
    setDateRange({ start, end });
  };

  const activeMetric =
    UTILITY_METRICS.find((option) => option.value === metric) ??
    UTILITY_METRICS[0];

  const perBranch = utilityQuery.data?.data.perBranch;
  const branchData = useMemo(
    () =>
      (perBranch ?? []).map((branch) => ({
        name: branch.branchName,
        value: branch[metric],
      })),
    [perBranch, metric]
  );

  const summary = utilityQuery.data?.data.summary;

  return (
    <div className="space-y-4">
      {utilityQuery.isLoading || utilityQuery.isError ? (
        <QueryState
          isLoading={utilityQuery.isLoading}
          isError={utilityQuery.isError}
        />
      ) : !summary ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <AlertCircle className="h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-500">
            No hay datos de utilidad para este producto.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {UTILITY_SUMMARY_KPIS.map((kpi) => (
              <KpiCard
                key={kpi.key}
                label={kpi.label}
                value={
                  kpi.isCurrency
                    ? usdFormatCurrency(summary[kpi.key])
                    : summary[kpi.key].toLocaleString()
                }
                valueClassName={
                  kpi.key === 'utility'
                    ? summary.utility < 0
                      ? 'text-red-600'
                      : 'text-green-600'
                    : undefined
                }
              />
            ))}
          </div>
          {/* Filtro de fechas: aplica a los KPIs y a la gráfica. */}
          <div className="flex justify-center">
            <FilterDate onChange={handleDateChange} />
          </div>

          {branchData.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Distribución por sucursal
                </p>

                <div className="flex flex-wrap gap-1">
                  {UTILITY_METRICS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMetric(option.value)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                        metric === option.value
                          ? 'bg-secondary text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <BranchMetricChart
                data={branchData}
                title={`${activeMetric.label} por sucursal`}
                seriesName={activeMetric.label}
                valueAxisName={activeMetric.isCurrency ? 'USD' : 'Unidades'}
                pieEnabled={activeMetric.pieEnabled}
                formatValue={
                  activeMetric.isCurrency
                    ? usdFormatCurrency
                    : (value: number) => value.toLocaleString()
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface InventoryBranchRow {
  branchId: number;
  branchName: string;
  quantity: number;
  cost: number;
}

/** Enruta el inventario según la categoría del producto */
function ProductInventoryTab({
  isOpen,
  product,
}: {
  isOpen: boolean;
  product: ProductModel;
}) {
  if (product.category === 1) {
    return (
      <BikeInventoryContent
        isOpen={isOpen}
        model={product.model ?? ''}
        productId={product.id}
      />
    );
  }

  return (
    <PartInventoryContent
      isOpen={isOpen}
      sku={product.sku}
      productId={product.id}
    />
  );
}

function InventoryLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      <p className="text-sm text-gray-500">Cargando disponibilidad...</p>
    </div>
  );
}

function InventoryError() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm text-gray-500">
        Error al cargar los datos. Intenta de nuevo.
      </p>
    </div>
  );
}

/** Inventario de repuestos */
function PartInventoryContent({
  isOpen,
  sku,
  productId,
}: {
  isOpen: boolean;
  sku: string;
  productId: number;
}) {
  const globalPartInventory = useGlobalPartInventory({
    page: '1',
    pageSize: '10',
    search: sku,
  });

  useEffect(() => {
    if (isOpen && sku) {
      globalPartInventory.setSearch(sku);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, isOpen]);

  if (globalPartInventory.isLoading) return <InventoryLoading />;
  if (globalPartInventory.isError) return <InventoryError />;

  const branches: InventoryBranchRow[] = (
    globalPartInventory.data?.results?.[0]?.branches ?? []
  ).map((branch) => ({
    branchId: branch.branchId,
    branchName: branch.branchName,
    quantity: branch.quantity,
    cost: branch.cost ?? 0,
  }));

  return <InventoryBranchList branches={branches} productId={productId} />;
}

/** Inventario de motos: se busca por modelo en el inventario general de bikes. */
function BikeInventoryContent({
  isOpen,
  model,
  productId,
}: {
  isOpen: boolean;
  model: string;
  productId: number;
}) {
  const token = useToken() || '';

  const bikeInventoryQuery = useQuery({
    queryKey: ['generalBikeInventory', model, token],
    queryFn: () =>
      productsService.getGeneralBikeInventory(token, '0', {
        model: model,
        origin: 'admiin',
      }) as Promise<GeneralBikeInventoryResponse>,
    enabled: isOpen && !!model,
  });

  if (bikeInventoryQuery.isLoading) return <InventoryLoading />;
  if (bikeInventoryQuery.isError) return <InventoryError />;

  const branches: InventoryBranchRow[] = (
    bikeInventoryQuery.data?.data?.results ?? []
  ).map((branch) => ({
    branchId: branch.branchId,
    branchName: branch.branchName,
    quantity: branch.branchTotal,
    cost: branch.totalBranchCost ?? 0,
  }));

  return <InventoryBranchList branches={branches} productId={productId} />;
}

/** Vista compartida: KPIs totales + lista de sucursales desplegable. */
function InventoryBranchList({
  branches,
  productId,
}: {
  branches: InventoryBranchRow[];
  productId: number;
}) {
  // Solo una sucursal desplegada a la vez para no mostrar demasiada información.
  const [expandedBranchId, setExpandedBranchId] = useState<number | null>(null);

  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <MapPin className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">
          No hay stock registrado en ninguna sucursal.
        </p>
      </div>
    );
  }

  const totalQuantity = branches.reduce((sum, b) => sum + b.quantity, 0);
  const totalCost = branches.reduce((sum, b) => sum + (b.cost ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <KpiCard
          label="Cantidad total"
          value={totalQuantity.toLocaleString()}
        />
        <KpiCard label="Costo total" value={usdFormatCurrency(totalCost)} />
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Disponibilidad por sucursal
      </p>

      <div className="space-y-2">
        {branches.map((branch) => {
          const isExpanded = expandedBranchId === branch.branchId;

          return (
            <div
              key={branch.branchId}
              className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedBranchId(isExpanded ? null : branch.branchId)
                }
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-700">
                    {branch.branchName}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {branch.quantity.toLocaleString()}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-white px-4 py-3">
                  <BranchInventoryCost
                    productId={productId}
                    branchId={branch.branchId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TRANSACTIONS_TAB_COPY: Record<
  'purchase' | 'sale',
  {
    kpi1Label: string;
    kpi2Label: string;
    tableTitle: string;
    amountColumnLabel: string;
    viewAllLabel: string;
    viewLessLabel: string;
    emptyLabel: string;
  }
> = {
  purchase: {
    kpi1Label: 'Total Comprado',
    kpi2Label: 'Costo Total',
    tableTitle: 'Últimas compras',
    amountColumnLabel: 'Costo',
    viewAllLabel: 'Ver todas las compras',
    viewLessLabel: 'Ver menos',
    emptyLabel: 'No hay compras registradas para este producto.',
  },
  sale: {
    kpi1Label: 'Total Vendido',
    kpi2Label: 'Monto Total',
    tableTitle: 'Últimas ventas',
    amountColumnLabel: 'Monto',
    viewAllLabel: 'Ver todas las ventas',
    viewLessLabel: 'Ver menos',
    emptyLabel: 'No hay ventas registradas para este producto.',
  },
};

function buildPageRange(currentPage: number, totalPages: number) {
  const pages: (number | 'gap')[] = [];
  const push = (page: number | 'gap') => pages.push(page);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
    return pages;
  }

  push(1);
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) push('gap');
  for (let i = start; i <= end; i++) push(i);
  if (end < totalPages - 1) push('gap');
  push(totalPages);

  return pages;
}

function ModalPagination({
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}) {
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => canGoBack && onPageChange(currentPage - 1)}
          disabled={!canGoBack}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {buildPageRange(currentPage, totalPages).map((page, index) =>
          page === 'gap' ? (
            <span
              key={`gap-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={cn(
                'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-secondary text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => canGoForward && onPageChange(currentPage + 1)}
          disabled={!canGoForward}
          aria-label="Página siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Página {currentPage} de {totalPages} ({totalElements.toLocaleString()}{' '}
        registros)
      </p>
    </div>
  );
}

type ChartView = 'pie' | 'bar';

const CHART_VIEWS: ChartView[] = ['pie', 'bar'];
const SWIPE_THRESHOLD_PX = 50;

interface BranchMetricDatum {
  name: string;
  value: number;
  id?: string | number;
}

function BranchMetricChart({
  data,
  title,
  seriesName,
  valueAxisName,
  formatValue = (value: number) => `${value}`,
  pieEnabled = true,
  barEnabled = true,
  onSliceClick,
}: {
  data: BranchMetricDatum[];
  title: string;
  seriesName: string;
  valueAxisName: string;
  formatValue?: (value: number) => string;
  pieEnabled?: boolean;
  barEnabled?: boolean;
  onSliceClick?: (datum: BranchMetricDatum) => void;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const [view, setView] = useState<ChartView>('pie');
  const allowPie = pieEnabled && data.every((datum) => datum.value >= 0);
  // El carrusel solo existe cuando ambas vistas están disponibles.
  const showCarousel = barEnabled && allowPie;
  const activeView: ChartView = !barEnabled ? 'pie' : allowPie ? view : 'bar';

  const goToView = (direction: 1 | -1) => {
    if (!showCarousel) return;
    setView((current) => {
      const nextIndex =
        (CHART_VIEWS.indexOf(current) + direction + CHART_VIEWS.length) %
        CHART_VIEWS.length;
      return CHART_VIEWS[nextIndex];
    });
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartXRef.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;

    const deltaX = event.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    goToView(deltaX < 0 ? 1 : -1);
  };

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chartInstance = echarts.init(chartRef.current);

    const sharedOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' },
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        type: 'scroll',
      },
    };

    const pieOption = {
      ...sharedOption,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: ${formatValue(params.value)} (${params.percent}%)`,
      },
      xAxis: undefined,
      yAxis: undefined,
      grid: undefined,
      series: [
        {
          name: seriesName,
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: {
            formatter: (params: any) =>
              `${params.name}: ${formatValue(params.value)}`,
          },
          data,
        },
      ],
    };

    // Una serie por sucursal para que la leyenda encienda/apague.
    const barOption = {
      ...sharedOption,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.seriesName}: ${formatValue(params.value)}`,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: 60,
        top: 50,
        containLabel: true,
      },
      xAxis: { type: 'category', data: [''], axisTick: { show: false } },
      yAxis: {
        type: 'value',
        name: valueAxisName,
        axisLabel: { formatter: (value: number) => formatValue(value) },
      },
      series: data.map((datum) => ({
        name: datum.name,
        type: 'bar',
        data: [datum.value],
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        label: {
          show: true,
          position: datum.value < 0 ? 'bottom' : 'top',
          fontSize: 10,
          formatter: (params: any) => formatValue(params.value),
        },
      })),
    };

    chartInstance.setOption(activeView === 'pie' ? pieOption : barOption, true);

    if (onSliceClick) {
      chartInstance.on('click', (params: any) => {
        if (params?.data) onSliceClick(params.data as BranchMetricDatum);
      });
    }

    const handleResize = () => chartInstance.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.dispose();
    };
  }, [
    data,
    title,
    seriesName,
    valueAxisName,
    formatValue,
    activeView,
    onSliceClick,
  ]);

  if (data.length === 0) return null;

  return (
    <div>
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {showCarousel && (
          <button
            type="button"
            onClick={() => goToView(-1)}
            aria-label="Gráfica anterior"
            className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-500 backdrop-blur transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div ref={chartRef} style={{ width: '100%', height: '320px' }} />

        {showCarousel && (
          <button
            type="button"
            onClick={() => goToView(1)}
            aria-label="Gráfica siguiente"
            className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-500 backdrop-blur transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {showCarousel && (
        <div className="mt-1 flex justify-center gap-1.5">
          {CHART_VIEWS.map((chartView) => (
            <button
              key={chartView}
              type="button"
              onClick={() => setView(chartView)}
              aria-label={chartView === 'pie' ? 'Ver torta' : 'Ver barras'}
              className={cn(
                'h-1.5 rounded-full transition-all',
                view === chartView ? 'w-4 bg-secondary' : 'w-1.5 bg-gray-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

type SummaryMetric = 'quantity' | 'amount';

/** Años disponibles en el selector: desde 2024 hasta el año actual. */
function getSummaryYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = 2024; y <= currentYear; y++) years.push(y);
  return years;
}

/**
 * Gráfica de barras apiladas por sucursal (segundo slide del carrusel).
 * Eje X: meses con datos. Cada serie es una sucursal (color y leyenda propios).
 */
function ProductSummaryChart({
  productId,
  type,
}: {
  productId: number;
  type: 'purchase' | 'sale';
}) {
  const token = useToken() || '';
  const chartRef = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [metric, setMetric] = useState<SummaryMetric>('quantity');

  const summaryQuery = useQuery({
    queryKey: ['productSummary', productId, type, year, token],
    queryFn: () =>
      transactionService.getProductSummary(token, productId, type, `${year}`),
    enabled: !!productId,
    keepPreviousData: true,
  });

  const yearData = summaryQuery.data?.data?.find((item) => item.year === year);

  const { categories, series } = useMemo(() => {
    const months = [...(yearData?.months ?? [])].sort(
      (a, b) => a.month - b.month
    );
    const cats = months.map((m) => MONTH_NAMES[m.month - 1] ?? `${m.month}`);
    const branchNames = new Map<number, string>();
    months.forEach((m) =>
      m.branches.forEach((b) => branchNames.set(b.branchId, b.branchName))
    );

    const seriesList = Array.from(branchNames.entries()).map(
      ([branchId, branchName]) => ({
        name: branchName,
        type: 'bar' as const,
        stack: 'total',
        emphasis: { focus: 'series' as const },
        // Al enfocar una serie, las demás no desaparecen.
        blur: { itemStyle: { opacity: 1 } },
        data: months.map((m) => {
          const branch = m.branches.find((b) => b.branchId === branchId);
          if (!branch) return 0;
          return metric === 'quantity'
            ? branch.totalQuantity
            : branch.totalAmount;
        }),
      })
    );

    return { categories: cats, series: seriesList };
  }, [yearData, metric]);

  const formatValue = useCallback(
    (value: number) =>
      metric === 'amount' ? usdFormatCurrency(value) : value.toLocaleString(),
    [metric]
  );

  useEffect(() => {
    if (!chartRef.current || categories.length === 0) return;

    const chartInstance = echarts.init(chartRef.current);
    chartInstance.setOption(
      {
        title: {
          text:
            type === 'sale'
              ? `Ventas por mes ${year}`
              : `Compras por mes ${year}`,
          left: 'center',
          textStyle: { fontSize: 14, fontWeight: 'bold' },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: (value: number) => formatValue(value),
        },
        legend: { bottom: 0, type: 'scroll' },
        grid: {
          left: '3%',
          right: '4%',
          bottom: 50,
          top: 50,
          containLabel: true,
        },
        xAxis: { type: 'category', data: categories },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: (value: number) => formatValue(value) },
        },
        series,
      },
      true
    );

    const handleResize = () => chartInstance.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.dispose();
    };
  }, [categories, series, formatValue, type, year]);

  return (
    <div>
      {/* Controles */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <select
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          className="h-8 rounded-md border border-input bg-white px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {getSummaryYears().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          {(
            [
              { value: 'quantity', label: 'Cantidad' },
              { value: 'amount', label: 'Monto' },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={metric === option.value}
                onChange={() => setMetric(option.value)}
                className="h-4 w-4 accent-secondary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {(summaryQuery.isLoading || summaryQuery.isError) && (
        <QueryState
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      )}

      {!summaryQuery.isLoading &&
        !summaryQuery.isError &&
        categories.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <AlertCircle className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-500">
              No hay datos para el año seleccionado.
            </p>
          </div>
        )}

      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: '320px',
          display:
            !summaryQuery.isLoading &&
            !summaryQuery.isError &&
            categories.length > 0
              ? 'block'
              : 'none',
        }}
      />
    </div>
  );
}

function TransactionsByBranchChart({
  productId,
  perBranchTotals,
  type,
  view,
  onViewChange,
  onBranchSelect,
}: {
  productId: number;
  perBranchTotals: ProductTransactionBranchTotal[];
  type: 'purchase' | 'sale';
  view: 'pie' | 'summary';
  onViewChange: (view: 'pie' | 'summary') => void;
  onBranchSelect?: (branch: { id: number; name: string }) => void;
}) {
  const touchStartXRef = useRef<number | null>(null);
  const setView = onViewChange;

  const branchData = useMemo(
    () =>
      perBranchTotals.map((branch) => ({
        id: branch.branchId,
        name: branch.branchName,
        value: branch.totalQuantity,
      })),
    [perBranchTotals]
  );

  const handleSliceClick = useCallback(
    (datum: BranchMetricDatum) => {
      if (datum.id == null) return;
      onBranchSelect?.({ id: Number(datum.id), name: datum.name });
    },
    [onBranchSelect]
  );

  const toggleView = () => setView(view === 'pie' ? 'summary' : 'pie');

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartXRef.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;
    if (Math.abs(event.changedTouches[0].clientX - startX) < SWIPE_THRESHOLD_PX)
      return;
    toggleView();
  };

  if (branchData.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {view === 'pie' ? 'Distribución por sucursal' : 'Resumen por mes'}
      </p>

      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={toggleView}
          aria-label="Gráfica anterior"
          className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-500 backdrop-blur transition-colors hover:bg-gray-50 hover:text-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {view === 'pie' ? (
          <BranchMetricChart
            key="pie"
            data={branchData}
            title={
              type === 'sale' ? 'Ventas por sucursal' : 'Compras por sucursal'
            }
            seriesName={
              type === 'sale' ? 'Cantidad vendida' : 'Cantidad comprada'
            }
            valueAxisName="Cantidad"
            formatValue={(value) => value.toLocaleString()}
            barEnabled={false}
            onSliceClick={onBranchSelect ? handleSliceClick : undefined}
          />
        ) : (
          <ProductSummaryChart
            key="summary"
            productId={productId}
            type={type}
          />
        )}

        <button
          type="button"
          onClick={toggleView}
          aria-label="Gráfica siguiente"
          className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-500 backdrop-blur transition-colors hover:bg-gray-50 hover:text-gray-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-1 flex justify-center gap-1.5">
        {(['pie', 'summary'] as const).map((chartView) => (
          <button
            key={chartView}
            type="button"
            onClick={() => setView(chartView)}
            aria-label={chartView === 'pie' ? 'Ver torta' : 'Ver resumen'}
            className={cn(
              'h-1.5 rounded-full transition-all',
              view === chartView ? 'w-4 bg-secondary' : 'w-1.5 bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ProductTransactionsTab({
  productId,
  type,
}: {
  productId: number;
  type: 'purchase' | 'sale';
}) {
  const token = useToken() || '';
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const [chartView, setChartView] = useState<'pie' | 'summary'>('pie');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    {}
  );
  const [branchFilter, setBranchFilter] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(
    null
  );
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<ProductTransactionItem | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const copy = TRANSACTIONS_TAB_COPY[type];

  const transactionsQuery = useQuery({
    queryKey: [
      'productTransactions',
      productId,
      type,
      token,
      page,
      dateRange.start ?? null,
      dateRange.end ?? null,
      branchFilter?.id ?? null,
    ],
    queryFn: () =>
      transactionService.getProductTransactions(token, productId, type, {
        page: `${page}`,
        pageSize: '10',
        start_date: dateRange.start,
        end_date: dateRange.end,
        branch: branchFilter ? String(branchFilter.id) : undefined,
      }),
    enabled: !!productId,
    keepPreviousData: true,
  });

  // Trae la orden por su número solo cuando se selecciona una desde la tabla.
  const { orderById } = useOrders(
    token || undefined,
    false,
    undefined,
    undefined,
    selectedOrderNumber != null ? String(selectedOrderNumber) : undefined,
    selectedOrderNumber != null
  );

  // Con orden asociada abre el detalle de la orden; sin ella, el de la transacción.
  const handleOpenDetail = (transaction: ProductTransactionItem) => {
    if (transaction.orderNumber != null) {
      setSelectedOrderNumber(transaction.orderNumber);
      setIsOrderModalOpen(true);
    } else {
      setSelectedTransaction(transaction);
      setIsTransactionModalOpen(true);
    }
  };

  const handleDateChange = (start?: string, end?: string) => {
    setDateRange({ start, end });
    setPage(1);
  };

  const handleBranchSelect = (branch: { id: number; name: string }) => {
    setBranchFilter(branch);
    setPage(1);
  };

  const clearBranchFilter = () => {
    setBranchFilter(null);
    setPage(1);
  };

  const handleToggleShowAll = () => {
    setShowAll((previous) => {
      if (previous) setPage(1);
      return !previous;
    });
  };

  if (transactionsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (transactionsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-gray-500">
          Error al cargar los datos. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const data = transactionsQuery.data?.data;
  const results: ProductTransactionItem[] = data?.results ?? [];
  const perBranchTotals = data?.staticData?.perBranchTotals ?? [];

  // perBranchTotals cubre todas las páginas; el monto solo existe por transacción.
  const totalQuantity = perBranchTotals.reduce(
    (sum, branch) => sum + branch.totalQuantity,
    0
  );
  const totalAmount = perBranchTotals.reduce(
    (sum, branch) => sum + (branch.totalAmount ?? 0),
    0
  );
  const visibleResults = showAll ? results : results.slice(0, 5);
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? results.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <KpiCard
          label={copy.kpi1Label}
          value={totalQuantity.toLocaleString()}
        />
        <KpiCard
          label={copy.kpi2Label}
          value={usdFormatCurrency(totalAmount)}
        />
      </div>

      {/* Filtros: el de fechas se oculta en el histograma (que tiene su propio
          selector de año). El chip de sucursal se mantiene para poder limpiarlo. */}
      {(chartView === 'pie' || branchFilter) && (
        <div className="flex flex-col items-center gap-2">
          {chartView === 'pie' && <FilterDate onChange={handleDateChange} />}
          {branchFilter ? (
            <button
              type="button"
              onClick={clearBranchFilter}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/20"
            >
              Sucursal: {branchFilter.name}
              <X className="h-3 w-3" />
            </button>
          ) : chartView === 'pie' ? (
            <p className="text-[11px] text-gray-400">
              Toca una sucursal en la gráfica de torta para filtrar.
            </p>
          ) : null}
        </div>
      )}

      <TransactionsByBranchChart
        productId={productId}
        perBranchTotals={perBranchTotals}
        type={type}
        view={chartView}
        onViewChange={setChartView}
        onBranchSelect={handleBranchSelect}
      />

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          {copy.tableTitle}
        </p>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <AlertCircle className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-500">{copy.emptyLabel}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed border-collapse border border-gray-300">
                <TableHeader>
                  <TableRow className="bg-gray-200 text-gray-800 text-xs font-medium uppercase tracking-wider">
                    <TableHead className="p-2 text-gray-800 text-center">
                      Fecha
                    </TableHead>
                    <TableHead className="p-2 text-gray-800 text-center">
                      Sucursal
                    </TableHead>
                    <TableHead className="p-2 text-gray-800 text-center">
                      Cantidad
                    </TableHead>
                    <TableHead className="p-2 text-gray-800 text-center">
                      {copy.amountColumnLabel}
                    </TableHead>
                    <TableHead className="p-2 text-gray-800 text-center">
                      Responsable
                    </TableHead>
                    <TableHead className="p-2 text-gray-800 text-center">
                      Detalle
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleResults.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="border border-gray-300 px-2 py-2 text-sm text-gray-600 text-center break-words">
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                      <TableCell className="border border-gray-300 px-2 py-2 text-sm text-gray-600 text-center break-words">
                        {transaction.originBranch?.name ?? '-'} →{' '}
                        {transaction.targetBranch?.name ?? '-'}
                      </TableCell>
                      <TableCell className="border border-gray-300 px-2 py-2 text-sm text-gray-600 text-center break-words">
                        {transaction.quantity}
                      </TableCell>
                      <TableCell className="border border-gray-300 px-2 py-2 text-sm text-gray-600 text-center break-words">
                        {usdFormatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="border border-gray-300 px-2 py-2 text-sm text-gray-600 text-center break-words">
                        {transaction.responsible?.username ?? '-'}
                      </TableCell>
                      <TableCell className="border border-gray-300 px-2 py-2 text-sm text-gray-600 text-center break-words">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(transaction)}
                          aria-label={
                            transaction.orderNumber != null
                              ? `Ver orden #${transaction.orderNumber}`
                              : `Ver detalle de la transacción #${transaction.id}`
                          }
                          title={
                            transaction.orderNumber != null
                              ? `Ver orden #${transaction.orderNumber}`
                              : 'Ver detalle de la transacción'
                          }
                          className="inline-flex items-center justify-center text-secondary transition-colors hover:text-secondary/70"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {showAll && totalPages > 1 && (
              <ModalPagination
                currentPage={data?.currentPage ?? page}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={setPage}
              />
            )}

            {totalElements > 5 && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleShowAll}
                >
                  {showAll ? copy.viewLessLabel : copy.viewAllLabel}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales por encima del modal de producto: su estado es independiente,
          así que cerrarlos no cierra el modal de producto. La transacción con
          orden abre el detalle de la orden; sin orden, el de la transacción. */}
      <OrderDetailsModal
        order={(orderById as unknown as OrderData) ?? null}
        open={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
      />

      {selectedTransaction && (
        <TransactionDetailsDialog
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          transaction={selectedTransaction as unknown as TransactionDataResult}
        />
      )}
    </div>
  );
}

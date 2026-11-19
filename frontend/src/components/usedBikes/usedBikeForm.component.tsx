'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

import {
  ClientSearch,
  ClientSearchSelection,
} from '@/components/clients/ClientSearch.component';
import { Button } from '@/components/ui/button.component';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Input } from '@/components/ui/input.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useToast } from '@/components/ui/use-toast';
import { BIKES_COLORS } from '@/constants/products';
import { useBikeModels, useUsedBikeMutations } from '@/hooks/products';
import {
  CreateUsedBikePayload,
  UsedBike,
} from '@/services/products/types/UsedBike.type';
import { useRoles } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { getUsedBikeErrorMessage } from './usedBikeError';
import { MechanicSelect, MechanicSelection } from './mechanicSelect.component';
import { PhotoUploadBox } from './photoUploadBox.component';

interface UsedBikeFormProps {
  onCancel: () => void;
  onSaved: (usedBike: UsedBike) => void;
  /** Registro a editar; sin él, el formulario es de alta */
  usedBike?: UsedBike;
}

interface UsedBikeFormState {
  modelId: string;
  year: string;
  plate: string;
  color: string;
  km: string;
  chassisSerial: string;
  engineSerial: string;
  /** Solo en el alta: lo que pide el dueño */
  askedPrice: string;
  /** Solo al editar una unidad aprobada: el precio de reventa */
  price: string;
}

const EMPTY_FORM: UsedBikeFormState = {
  modelId: '',
  year: '',
  plate: '',
  color: '',
  km: '',
  chassisSerial: '',
  engineSerial: '',
  askedPrice: '',
  price: '',
};

const ENTRY_PHOTOS = [
  'Frontal',
  'Trasera',
  'Lateral izquierda',
  'Lateral derecha',
];

/** Texto de un input numérico opcional a número o `null` */
function toOptionalNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm min-w-0">
      <span className="font-medium whitespace-nowrap">{label}</span>
      {children}
    </label>
  );
}

/** Formulario de registro / edición de una moto usada */
export function UsedBikeForm({
  onCancel,
  onSaved,
  usedBike,
}: UsedBikeFormProps) {
  const { toast } = useToast();
  const roles = useRoles();
  const currentBranchId = useCurrentBranchId();
  const { models, isLoadingModels } = useBikeModels();
  const {
    createUsedBike,
    isCreatingUsedBike,
    updateUsedBike,
    isUpdatingUsedBike,
  } = useUsedBikeMutations();

  const isEditing = !!usedBike;
  // Al aprobar, el backend le asigna un precio de reventa: se edita desde aquí
  const canEditPrice = isEditing && usedBike.status === 'approved';
  /**
   * Cualquiera que registre la unidad elige el mecánico, pero una vez guardada
   * solo un admin puede reasignarlo.
   */
  const canEditMechanic =
    !isEditing || roles.includes('admin') || usedBike.status === 'pending';
  const canEditAskedPrice =
    !isEditing ||
    (usedBike.status !== 'approved' && usedBike.status !== 'rejected');

  const [form, setForm] = useState<UsedBikeFormState>(() =>
    usedBike
      ? {
          modelId: String(usedBike.product.id),
          year: usedBike.year !== null ? String(usedBike.year) : '',
          plate: usedBike.plate,
          color: usedBike.color,
          km: usedBike.km !== null ? String(usedBike.km) : '',
          chassisSerial: usedBike.chassisSerial ?? '',
          engineSerial: usedBike.engineSerial ?? '',
          askedPrice:
            usedBike.askedPrice !== null ? String(usedBike.askedPrice) : '',
          price: usedBike.price !== null ? String(usedBike.price) : '',
        }
      : EMPTY_FORM
  );

  // Al editar arranca con el dueño actual, y se puede cambiar por otro
  const [owner, setOwner] = useState<ClientSearchSelection | null>(() =>
    usedBike
      ? {
          id: usedBike.owner.id,
          firstName: usedBike.owner.firstName,
          lastName: usedBike.owner.lastName,
          countryId: usedBike.owner.documentId ?? '',
        }
      : null
  );
  const ownerId = owner?.id;

  // El mecánico viaja en `reviewer`: id al escribir, objeto anidado al leer
  const [mechanic, setMechanic] = useState<MechanicSelection | null>(() =>
    usedBike?.reviewer
      ? {
          id: usedBike.reviewer.id,
          firstName: usedBike.reviewer.firstName,
          lastName: usedBike.reviewer.lastName,
          documentId: usedBike.reviewer.documentId,
        }
      : null
  );

  const isSaving = isCreatingUsedBike || isUpdatingUsedBike;

  const update = (patch: Partial<UsedBikeFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const buildPayload = (): CreateUsedBikePayload | undefined => {
    const missing: string[] = [];
    if (!form.modelId) missing.push('modelo');
    if (!form.color) missing.push('color');
    if (!form.plate.trim()) missing.push('placa');
    if (!ownerId) missing.push('dueño');
    if (currentBranchId === undefined) missing.push('sucursal');

    if (missing.length) {
      toast({
        title: 'Faltan datos',
        description: `Completa: ${missing.join(', ')}.`,
        variant: 'destructive',
      });
      return undefined;
    }

    const base: CreateUsedBikePayload = {
      product: Number(form.modelId),
      color: form.color,
      plate: form.plate.trim(),
      owner: ownerId as number,
      branch: currentBranchId as number,
      year: toOptionalNumber(form.year),
      km: toOptionalNumber(form.km),
      chassisSerial: form.chassisSerial.trim() || null,
      engineSerial: form.engineSerial.trim() || null,
    };

    // `reviewer` es el mecánico asignado a la unidad. El responsable de la
    // evaluación (`responsible`) no se toca acá: lo toma quien la comience
    // desde la ficha.
    if (!isEditing) {
      return {
        ...base,
        askedPrice: toOptionalNumber(form.askedPrice),
        reviewer: mechanic?.id ?? null,
      };
    }

    // `askedPrice` salió del formulario de edición: se omite del payload en vez
    // de mandarse en null, que borraría lo ya guardado. El mecánico solo viaja
    // si quien edita puede cambiarlo.
    return {
      ...base,
      ...(canEditPrice && { price: toOptionalNumber(form.price) }),
      ...(canEditMechanic && { reviewer: mechanic?.id ?? null }),
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      const saved = isEditing
        ? await updateUsedBike({ usedBikeId: usedBike.id, payload })
        : await createUsedBike(payload);

      toast({
        title: isEditing ? 'Registro actualizado' : 'Moto usada registrada',
        description: `${saved.product.name} · Placa ${saved.plate}`,
      });
      onSaved(saved);
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al guardar la moto usada.'
        ),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              {isEditing ? 'Editar moto usada' : 'Registrar moto usada'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Completa los datos de la unidad y su dueño
            </p>
          </div>
        </div>

        <Button type="button" onClick={handleSubmit} disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving
            ? 'Guardando...'
            : isEditing
              ? 'Guardar cambios'
              : 'Registrar'}
        </Button>
      </div>

      {/* Identificación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificación</CardTitle>
          <CardDescription>Datos de la unidad</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Ocho campos: dos filas de cuatro en pantallas grandes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Modelo">
              <Select
                value={form.modelId}
                onValueChange={(modelId) => update({ modelId })}
                disabled={isLoadingModels}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingModels ? 'Cargando...' : 'Seleccionar'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={String(model.id)}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Año">
              <Input
                type="number"
                value={form.year}
                onChange={(event) => update({ year: event.target.value })}
                placeholder="2020"
              />
            </Field>

            <Field label="Placa">
              <Input
                value={form.plate}
                onChange={(event) =>
                  update({ plate: event.target.value.toUpperCase() })
                }
                placeholder="AB123CD"
              />
            </Field>

            <Field label="Color">
              <Select
                value={form.color}
                onValueChange={(color) => update({ color })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {BIKES_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Kilometraje">
              <Input
                type="number"
                value={form.km}
                onChange={(event) => update({ km: event.target.value })}
                placeholder="0"
                min="0"
              />
            </Field>

            <Field label="Serial de chasis">
              <Input
                value={form.chassisSerial}
                onChange={(event) =>
                  update({ chassisSerial: event.target.value.toUpperCase() })
                }
                placeholder="8XX..."
              />
            </Field>

            <Field label="Serial de motor">
              <Input
                value={form.engineSerial}
                onChange={(event) =>
                  update({ engineSerial: event.target.value.toUpperCase() })
                }
                placeholder="1P5..."
              />
            </Field>

            {/* Lo que pide el dueño se fija al recibir la unidad */}
            {canEditAskedPrice ? (
              <Field label="Precio pedido">
                <Input
                  type="number"
                  value={form.askedPrice}
                  onChange={(event) =>
                    update({ askedPrice: event.target.value })
                  }
                  placeholder="0"
                  min="0"
                />
              </Field>
            ) : null}

            {canEditPrice ? (
              <Field label="Precio de venta">
                <Input
                  type="number"
                  value={form.price}
                  onChange={(event) => update({ price: event.target.value })}
                  placeholder="0"
                  min="0"
                />
              </Field>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Dueño */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dueño</CardTitle>
          <CardDescription>Busque por cédula o cree uno nuevo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <ClientSearch initialClient={owner} onClientSelect={setOwner} />
          </div>
          {owner ? (
            <p className="text-xs text-muted-foreground mt-2">
              Seleccionado: {owner.firstName} {owner.lastName}
              {owner.countryId ? ` · ${owner.countryId}` : ''}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Fotos de ingreso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fotos de ingreso</CardTitle>
          <CardDescription>
            Cuatro tomas de la unidad al momento de recibirla
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ENTRY_PHOTOS.map((label) => (
              <PhotoUploadBox key={label} label={label} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mecánico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mecánico</CardTitle>
          <CardDescription>
            {canEditMechanic
              ? 'Mecánico asignado a la unidad'
              : 'Solo un administrador puede cambiar el mecánico asignado, luego de que la unidad cambie de estado.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <MechanicSelect
              value={mechanic}
              onChange={setMechanic}
              disabled={!canEditMechanic}
            />
          </div>
          {mechanic ? (
            <p className="text-xs text-muted-foreground mt-2">
              Seleccionado: {mechanic.firstName} {mechanic.lastName}
              {mechanic.documentId ? ` · ${mechanic.documentId}` : ''}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

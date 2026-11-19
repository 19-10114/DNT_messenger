'use client';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.component';
import { Input } from '@/components/ui/input.component';
import { Button } from '@/components/ui/button.component';
import { UserFormSchema as formSchema } from '@/schemas/user.schema';
import React, { useState, useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { UserService } from '@/services/user/user.service';
import { useToken } from '@/stores/auth/auth.store';
import { CreateNewUserData } from '@/services/user/types/CreateNewUser.type';
import {
  useBranches,
  useBranchActions,
  useCurrentBranchId,
} from '@/stores/branch/branch.store';
import { BranchItem } from '@/services/branches/types/Branch.type';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import DropdownMultiple from '@/components/ui/dropdownMultiple.component';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import showPswrdIcon from '@/../public/password-visible.svg';
import hidePswrdIcon from '@/../public/password-not-visible.svg';
import '../componentStyle.css';
import { UsersService } from '@/services/users/users.service';
import { useQuery } from '@tanstack/react-query';
import { useMappedConstants } from '@/hooks/useMappedConstants';
import { useRoles } from '@/stores/auth/auth.store';

type FormValues = z.infer<typeof formSchema>;

const userService = new UserService();
const usersService = new UsersService();

export function UserForm() {
  const toast = useToast();
  const router = useRouter();
  const token = useToken();
  const userRoles = useRoles();
  const currentBranchId = useCurrentBranchId();
  const isAdmin = userRoles.includes('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() =>
    isAdmin ? [] : ['client']
  );
  const [selectedBranch, setSelectedBranch] = useState('');
  const branches = useBranches();
  const { fetchBranches } = useBranchActions();

  const {
    roles,
    isLoading: rolesLoading,
    isError: rolesError,
  } = useMappedConstants();

  // Filtrar sucursales excluyendo ventas, utilidades, etc.
  const filteredBranches = branches.filter(
    (branch) =>
      !['ventas', 'utilidades', 'ganancias', 'ingresos', 'dale play'].includes(
        branch.name.toLowerCase()
      ) &&
      !['ventas', 'utilidades', 'ganancias', 'ingresos', 'dale play'].includes(
        branch.type.toLowerCase()
      )
  );

  useEffect(() => {
    if (token && branches.length === 0) {
      fetchBranches(token);
    }
  }, [token, branches.length, fetchBranches]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      documentId: '',
      branch: currentBranchId?.toString() ?? '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      password: '',
      role: isAdmin ? '' : 'client',
    },
  });

  useEffect(() => {
    if (!isAdmin && currentBranchId) {
      form.setValue('branch', currentBranchId.toString());
    }
  }, [isAdmin, currentBranchId, form]);

  const onSubmit = async (values: FormValues) => {
    if (!token) return;

    try {
      const userData: CreateNewUserData = {
        username: values.username,
        email: values.email,
        documentId: values.documentId,
        branch: values.branch,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
        password: values.password,
        role: values.role,
      };

      const response = await userService.createUser(token, userData);

      if ('errors' in response) {
        toast.toast({
          title: 'Error',
          description: `El usuario o correo electronico estan repetidos`,
          variant: 'destructive',
        });

        return;
      }

      toast.toast({
        title: 'Éxito',
        description: 'Usuario creado correctamente',
      });

      router.push(`/dashboard/users/${response.data}`);
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: `El usuario o correo electronico estan repetidos`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 w-full max-w-full mx-auto"
      >
        <h3 className="border-b-2 border-gray-300 pb-2 mb-2 text-gray-700 text-lg font-medium text-center">
          Datos Personales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombres</FormLabel>
                <FormControl>
                  <Input
                    id="firstName"
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="none"
                    placeholder="Ingresa el/los nombre(s)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellidos</FormLabel>
                <FormControl>
                  <Input
                    id="lastName"
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="none"
                    placeholder="Ingresa el/los apellido(s)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de usuario</FormLabel>
                <FormControl>
                  <Input
                    id="username"
                    type="text"
                    autoCorrect="off"
                    autoComplete="name"
                    autoCapitalize="none"
                    placeholder="Ingresa el nombre de usuario"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="password-input-container">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoCorrect="off"
                      autoCapitalize="none"
                      placeholder="********"
                      {...field}
                    />
                    <div
                      className="eye-icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Image
                          src={hidePswrdIcon}
                          height={16}
                          width={16}
                          alt="Ocultar Contraseña"
                        />
                      ) : (
                        <Image
                          src={showPswrdIcon}
                          height={16}
                          width={16}
                          alt="Mostrar Contraseña"
                        />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cédula</FormLabel>
                <FormControl>
                  <Input
                    id="documentId"
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="none"
                    placeholder="Ingresa la cédula"
                    minLength={7}
                    pattern="[0-9]*"
                    maxLength={10}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Teléfono</FormLabel>
                <FormControl>
                  <Input
                    id="phoneNumber"
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="none"
                    placeholder="Ingresa el número de teléfono"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    placeholder="Ingresa el correo electrónico"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h3 className="border-b-2 border-gray-300 pb-2 mb-2 text-gray-700 text-lg font-medium text-center">
          Información Adicional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="branch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seleccionar sucursal</FormLabel>
                <Popover
                  open={isAdmin ? open : false}
                  onOpenChange={isAdmin ? setOpen : undefined}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={!isAdmin}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? filteredBranches.find(
                              (branch) => branch.id.toString() === field.value
                            )?.name
                          : 'Selecciona una sucursal...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar sucursal..." />
                      <CommandEmpty>
                        No se encontró ninguna sucursal.
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredBranches.map((branch) => (
                          <CommandItem
                            key={branch.id}
                            value={branch.name}
                            onSelect={() => {
                              field.onChange(branch.id.toString());
                              setSelectedBranch(branch.name);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                field.value === branch.id.toString()
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {branch.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seleccionar roles</FormLabel>
                <FormControl>
                  <DropdownMultiple
                    options={roles.map((role) => ({
                      value: role.value,
                      label: role.label,
                    }))}
                    selectedValues={selectedRoles}
                    onToggle={(roleValue) => {
                      const newSelectedRoles = selectedRoles.includes(roleValue)
                        ? selectedRoles.filter((r) => r !== roleValue)
                        : [...selectedRoles, roleValue];

                      setSelectedRoles(newSelectedRoles);
                      field.onChange(newSelectedRoles.join(','));
                    }}
                    placeholder="Selecciona uno o más roles..."
                    loading={rolesLoading}
                    disabled={!isAdmin}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center pt-4">
          <Button type="submit" className="w-1/2">
            Crear
          </Button>
        </div>
      </form>
    </Form>
  );
}

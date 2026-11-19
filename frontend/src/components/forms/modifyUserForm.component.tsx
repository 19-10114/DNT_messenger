import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  ModifyUserFormSchema,
  ModifyUserFormValues,
} from '@/schemas/modifyUser,schema';
import { useToast } from '@/components/ui/use-toast';
import { UserService } from '@/services/user/user.service';
import { useToken } from '@/stores/auth/auth.store';
import { useQuery } from '@tanstack/react-query';
import { useAuthService } from '@/stores/auth/auth.store';
import { CreateNewUserData } from '@/services/user/types/CreateNewUser.type';
import { useBranches, useBranchActions } from '@/stores/branch/branch.store';
import { useMappedConstants } from '@/hooks/useMappedConstants';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.component';
import DropdownMultiple from '@/components/ui/dropdownMultiple.component';
import { Input } from '@/components/ui/input.component';
import { Button } from '@/components/ui/button.component';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoles } from '@/stores/auth/auth.store';

const userService = new UserService();

interface ModifyUserFormProps {
  userId: string;
}

export function ModifyUserForm({ userId }: ModifyUserFormProps) {
  const toast = useToast();
  const router = useRouter();
  const token = useToken();
  const authService = useAuthService();
  const branches = useBranches();
  const { fetchBranches } = useBranchActions();
  const userRoles = useRoles();
  const isAdmin = userRoles.includes('admin');
  const [openBranch, setOpenBranch] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { roles } = useMappedConstants();
  // Get user data
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => authService.getUserById(userId, token || ''),
    enabled: !!token && !!userId,
  });

  // Filter branches
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

  // Set selected roles when user data is loaded
  useEffect(() => {
    if (user?.role) {
      const rolesArray = Array.isArray(user.role)
        ? user.role
        : user.role.split(',').filter(Boolean);
      setSelectedRoles(rolesArray);
    }
  }, [user]);

  const form = useForm<ModifyUserFormValues>({
    resolver: zodResolver(ModifyUserFormSchema),
    defaultValues: {
      email: '',
      documentId: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      branch: '',
      role: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || '',
        documentId: user.documentId || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        branch: user.branch?.id?.toString() || '',
        role: user.role || '',
      });
    }
  }, [user, form]);

  const onSubmit = async (values: ModifyUserFormValues) => {
    if (!token) return;

    try {
      // Prepare an object with only the changed values
      const changedValues: Partial<CreateNewUserData> = {};

      if (values.email && values.email !== user?.email) {
        changedValues.email = values.email;
      }
      if (values.firstName && values.firstName !== user?.firstName) {
        changedValues.firstName = values.firstName;
      }
      if (values.lastName && values.lastName !== user?.lastName) {
        changedValues.lastName = values.lastName;
      }
      if (values.documentId && values.documentId !== user?.documentId) {
        changedValues.documentId = values.documentId;
      }
      if (values.phoneNumber && values.phoneNumber !== user?.phoneNumber) {
        changedValues.phoneNumber = values.phoneNumber;
      }
      if (values.branch && values.branch !== user?.branch?.id?.toString()) {
        changedValues.branch = values.branch;
      }
      if (values.role && values.role !== user?.role) {
        changedValues.role = values.role;
      }

      if (Object.keys(changedValues).length === 0) {
        toast.toast({
          title: 'Información',
          description: 'No se realizaron cambios',
        });
        return;
      }

      const response = await userService.modifyUser(
        token,
        parseInt(userId),
        changedValues
      );

      if ('errors' in response) {
        toast.toast({
          title: 'Error',
          description: 'Error al modificar el usuario',
          variant: 'destructive',
        });
        return;
      }

      toast.toast({
        title: 'Éxito',
        description: 'Usuario modificado correctamente',
      });

      router.push('/dashboard/users');
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: 'Error al modificar el usuario',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-full mx-auto"
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
                  open={isAdmin ? openBranch : false}
                  onOpenChange={isAdmin ? setOpenBranch : undefined}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBranch}
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
                              setOpenBranch(false);
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
                    loading={false}
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
            Modificar Usuario
          </Button>
        </div>
      </form>
    </Form>
  );
}

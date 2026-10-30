import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  KeyRound,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { useUsers, qk } from '@/hooks/queries';
import { usersApi } from '@/services/users';
import { errorMessage } from '@/services/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { userSchema, type UserValues } from '@/lib/schemas';
import { cn, formatDate, formatNumber, ROL_LABEL } from '@/lib/utils';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField, Input, Select } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Avatar, EmptyState, ErrorState, PageHeader } from '@/components/ui/misc';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/Pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RolNombre, Usuario } from '@/types';

const roleVariant: Record<RolNombre, 'danger' | 'info' | 'default'> = {
  admin: 'danger',
  staff: 'info',
  corredor: 'default',
};

function UserFormDialog({
  open,
  user,
  onOpenChange,
}: {
  open: boolean;
  user: Usuario | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
      email: user?.email ?? '',
      password: '',
      rol: user?.rol?.nombre_rol ?? 'corredor',
      telefono: user?.telefono ?? '',
      genero: user?.genero ?? '',
      fecha_nacimiento: user?.fecha_nacimiento ? user.fecha_nacimiento.slice(0, 10) : '',
      estado_cuenta: user?.estado_cuenta ?? 'activo',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: UserValues) => {
      if (!user && (!values.password || values.password.length < 8)) {
        form.setError('password', { message: 'Minimo 8 caracteres para crear el usuario.' });
        throw new Error('La contrasena es obligatoria para crear un usuario.');
      }
      const base = {
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email.trim(),
        rol: values.rol,
        telefono: values.telefono || null,
        genero: values.genero || null,
        fecha_nacimiento: values.fecha_nacimiento || null,
        estado_cuenta: values.estado_cuenta,
      };
      return user
        ? usersApi.update(user.id_usuario, base)
        : usersApi.create({ ...base, password: values.password as string });
    },
    onSuccess: () => {
      toast.success(user ? 'Usuario actualizado.' : 'Usuario creado.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: qk.roles() });
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {user ? 'Actualiza los datos y el rol del usuario.' : 'Crea una cuenta con rol asignado.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre" error={form.formState.errors.nombre?.message}>
              <Input {...form.register('nombre')} />
            </FormField>
            <FormField label="Apellido" error={form.formState.errors.apellido?.message}>
              <Input {...form.register('apellido')} />
            </FormField>
            <FormField label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </FormField>
            <FormField
              label={user ? 'Contrasena (no editable)' : 'Contrasena'}
              hint={user ? 'Usa la opcion de restablecer contrasena.' : 'Minimo 8 caracteres.'}
              error={form.formState.errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                disabled={Boolean(user)}
                placeholder={user ? '••••••••' : 'Minimo 8 caracteres'}
                {...form.register('password')}
              />
            </FormField>
            <FormField label="Rol" error={form.formState.errors.rol?.message}>
              <Select {...form.register('rol')}>
                {(Object.keys(ROL_LABEL) as RolNombre[]).map((role) => (
                  <option key={role} value={role}>
                    {ROL_LABEL[role]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Estado" error={form.formState.errors.estado_cuenta?.message}>
              <Select {...form.register('estado_cuenta')}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            </FormField>
            <FormField label="Telefono" error={form.formState.errors.telefono?.message}>
              <Input placeholder="+507 6000-0000" {...form.register('telefono')} />
            </FormField>
            <FormField label="Genero" error={form.formState.errors.genero?.message}>
              <Select {...form.register('genero')}>
                <option value="">Sin especificar</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </Select>
            </FormField>
            <FormField
              label="Fecha de nacimiento"
              className="sm:col-span-2"
              error={form.formState.errors.fecha_nacimiento?.message}
            >
              <Input type="date" {...form.register('fecha_nacimiento')} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {user ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: Usuario | null;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => usersApi.resetPassword(user!.id_usuario, password),
    onSuccess: () => {
      toast.success('Contrasena restablecida.');
      setPassword('');
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Restablecer contrasena</DialogTitle>
          <DialogDescription>
            {user?.nombre} {user?.apellido} · {user?.email}
          </DialogDescription>
        </DialogHeader>
        <FormField label="Nueva contrasena" hint="Minimo 8 caracteres con letras y numeros.">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={password.length < 8}
            onClick={() => mutation.mutate()}
          >
            <KeyRound className="h-4 w-4" /> Restablecer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManageUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [rol, setRol] = useState<'' | RolNombre>('');
  const [status, setStatus] = useState<'' | 'activo' | 'inactivo'>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [resetting, setResetting] = useState<Usuario | null>(null);
  const debounced = useDebouncedValue(search, 300);

  const query = useUsers({
    page,
    limit: 10,
    q: debounced || undefined,
    rol: rol || undefined,
    estado_cuenta: status || undefined,
  });
  const users = query.data?.items ?? [];
  const meta = query.data?.meta;

  useEffect(() => {
    setPage(1);
  }, [debounced, rol, status]);

  const statusMutation = useMutation({
    mutationFn: ({ user, next }: { user: Usuario; next: 'activo' | 'inactivo' }) =>
      usersApi.setStatus(user.id_usuario, next),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.next === 'activo' ? 'Cuenta activada.' : 'Cuenta desactivada.',
      );
      queryClient.invalidateQueries({ queryKey: ['users'] });
      void query.refetch();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Usuarios y roles"
        title="Control de accesos"
        description="Administra corredores, staff y administradores. Activa o desactiva cuentas y restablece contrasenas."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" /> Nuevo usuario
          </Button>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o email"
          className="flex-1"
        />
        <Select
          value={rol}
          onChange={(event) => setRol(event.target.value as '' | RolNombre)}
          className="lg:w-44"
        >
          <option value="">Todos los roles</option>
          {(Object.keys(ROL_LABEL) as RolNombre[]).map((role) => (
            <option key={role} value={role}>
              {ROL_LABEL[role]}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as '' | 'activo' | 'inactivo')}
          className="lg:w-40"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </Select>
        <span className="text-[11px] text-slate-400">
          {formatNumber(meta?.total ?? users.length)} usuarios
        </span>
      </div>

      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : users.length ? (
        <div className="space-y-3">
          <div className="space-y-2">
            {users.map((user) => {
              const name = `${user.nombre} ${user.apellido}`;
              const active = (user.estado_cuenta ?? 'activo') === 'activo';
              return (
                <div
                  key={user.id_usuario}
                  className={cn(
                    'surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
                    !active && 'opacity-70',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={name} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {name}
                        </p>
                        <Badge variant={roleVariant[user.rol?.nombre_rol ?? 'corredor']}>
                          {ROL_LABEL[user.rol?.nombre_rol ?? 'corredor']}
                        </Badge>
                        {!active && <Badge variant="neutral">Inactivo</Badge>}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email}
                        </span>
                        {user.telefono && <span>{user.telefono}</span>}
                        <span>Alta {formatDate(user.createdAt ?? user.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {active ? 'Activo' : 'Inactivo'}
                      </span>
                      <Switch
                        checked={active}
                        onCheckedChange={(checked) =>
                          statusMutation.mutate({
                            user,
                            next: checked ? 'activo' : 'inactivo',
                          })
                        }
                        aria-label={`Cambiar estado de ${name}`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetting(user)}
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Clave
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar usuario"
                      onClick={() => {
                        setEditing(user);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Sin usuarios"
          description="No encontramos usuarios con los filtros seleccionados."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Crear usuario
            </Button>
          }
        />
      )}

      <UserFormDialog
        key={editing?.id_usuario ?? 'new'}
        open={formOpen}
        user={editing}
        onOpenChange={(value) => {
          setFormOpen(value);
          if (!value) setEditing(null);
        }}
      />

      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />

      <div className="surface flex items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Politica de roles
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Los administradores gestionan eventos y reportes. El staff acredita kits y registra
            marcas. Los corredores acceden a su pase, inscripciones y resultados. Desactivar una
            cuenta bloquea el acceso sin eliminar su historial.
          </p>
        </div>
        <UserCog className="ml-auto hidden h-5 w-5 text-slate-300 sm:block dark:text-slate-600" />
      </div>
    </div>
  );
}

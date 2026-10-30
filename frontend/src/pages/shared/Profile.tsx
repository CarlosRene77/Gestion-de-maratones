import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  BadgeCheck,
  HeartPulse,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/services/auth';
import { errorMessage } from '@/services/api';
import { passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from '@/lib/schemas';
import { cn, ROL_LABEL } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField, Input, Select, Textarea } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Avatar, PageHeader } from '@/components/ui/misc';

function sectionTitle(icon: typeof UserRound, title: string, description?: string) {
  const Icon = icon;
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-brand-500/10 p-2.5 text-brand-600 dark:text-brand-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, role, setUser, isRunner } = useAuth();
  const [tab, setTab] = useState<'perfil' | 'seguridad'>('perfil');

  const defaults = useMemo<ProfileValues>(
    () => ({
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
      telefono: user?.telefono ?? '',
      contacto_emergencia: user?.contacto_emergencia ?? '',
      fecha_nacimiento: user?.fecha_nacimiento ? user.fecha_nacimiento.slice(0, 10) : '',
      genero: user?.genero ?? '',
      tipo_sangre: user?.ficha_medica_json?.tipo_sangre ?? '',
      alergias: user?.ficha_medica_json?.alergias ?? '',
      condiciones: user?.ficha_medica_json?.condiciones ?? '',
    }),
    [user],
  );

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    values: defaults,
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onBlur',
    defaultValues: {
      password_actual: '',
      password_nueva: '',
      confirmar: '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const response = await authApi.updateProfile({
        nombre: values.nombre,
        apellido: values.apellido,
        telefono: values.telefono || null,
        contacto_emergencia: values.contacto_emergencia || null,
        fecha_nacimiento: values.fecha_nacimiento || null,
        genero: values.genero || null,
        ficha_medica_json: {
          tipo_sangre: values.tipo_sangre || undefined,
          alergias: values.alergias || undefined,
          condiciones: values.condiciones || undefined,
        },
      });
      return response.data;
    },
    onSuccess: (updated) => {
      setUser(updated);
      toast.success('Perfil actualizado correctamente.');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordValues) =>
      authApi.changePassword(values.password_actual, values.password_nueva),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Contrasena actualizada.');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const onSubmitProfile = profileForm.handleSubmit((values) => profileMutation.mutate(values));
  const onSubmitPassword = passwordForm.handleSubmit((values) => passwordMutation.mutate(values));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cuenta"
        title="Mi perfil"
        description="Administra tus datos personales, informacion medica y seguridad de la cuenta."
      />

      <div className="surface flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={`${user?.nombre ?? ''} ${user?.apellido ?? ''}`}
            className="h-16 w-16 text-lg"
          />
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white">
              {user?.nombre} {user?.apellido}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={role === 'admin' ? 'danger' : role === 'staff' ? 'info' : 'default'}>
                <BadgeCheck className="h-3 w-3" /> {role ? ROL_LABEL[role] : 'Corredor'}
              </Badge>
              <Badge variant={user?.estado_cuenta === 'inactivo' ? 'neutral' : 'success'}>
                {user?.estado_cuenta === 'inactivo' ? 'Inactivo' : 'Cuenta activa'}
              </Badge>
              {user?.fecha_nacimiento && (
                <span className="text-[11px] text-slate-400">
                  Nacimiento {new Date(user.fecha_nacimiento).toLocaleDateString('es-PA')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-3 text-[11px] text-brand-700 dark:text-brand-300">
          <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" /> Cuenta verificada
          </p>
          <p className="mt-1 font-normal text-slate-500 dark:text-slate-400">
            Tu informacion se usa para acreditacion y asistencia medica del evento.
          </p>
        </div>
      </div>

      <div className="inline-flex rounded-xl border bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: 'perfil' as const, label: 'Datos personales', icon: UserRound },
          { id: 'seguridad' as const, label: 'Seguridad', icon: KeyRound },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
              tab === item.id
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}
      </div>

      {tab === 'perfil' ? (
        <form onSubmit={onSubmitProfile} className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="surface space-y-5 p-5 sm:p-6">
            {sectionTitle(UserRound, 'Datos personales', 'Como apareceras en results oficiales.')}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nombre" error={profileForm.formState.errors.nombre?.message}>
                <Input {...profileForm.register('nombre')} />
              </FormField>
              <FormField label="Apellido" error={profileForm.formState.errors.apellido?.message}>
                <Input {...profileForm.register('apellido')} />
              </FormField>
              <FormField label="Email" hint="El email de acceso no se puede modificar aqui.">
                <Input value={user?.email ?? ''} disabled readOnly />
              </FormField>
              <FormField label="Telefono" error={profileForm.formState.errors.telefono?.message}>
                <Input placeholder="+507 6000-0000" {...profileForm.register('telefono')} />
              </FormField>
              <FormField
                label="Fecha de nacimiento"
                error={profileForm.formState.errors.fecha_nacimiento?.message}
              >
                <Input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  {...profileForm.register('fecha_nacimiento')}
                />
              </FormField>
              <FormField label="Genero" error={profileForm.formState.errors.genero?.message}>
                <Select {...profileForm.register('genero')}>
                  <option value="">Sin especificar</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </Select>
              </FormField>
              <FormField
                label="Contacto de emergencia"
                className="sm:col-span-2"
                hint={isRunner ? 'Se muestra al equipo medico durante la carrera.' : undefined}
                error={profileForm.formState.errors.contacto_emergencia?.message}
              >
                <Input
                  placeholder="Nombre completo y telefono"
                  {...profileForm.register('contacto_emergencia')}
                />
              </FormField>
            </div>
          </div>

          <div className="space-y-5">
            <div className="surface space-y-4 p-5 sm:p-6">
              {sectionTitle(HeartPulse, 'Ficha medica', 'Datos utiles en caso de emergencia.')}
              <FormField label="Tipo de sangre" error={profileForm.formState.errors.tipo_sangre?.message}>
                <Select {...profileForm.register('tipo_sangre')}>
                  <option value="">No especificado</option>
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Alergias" error={profileForm.formState.errors.alergias?.message}>
                <Input placeholder="Medicamentos, alimentos..." {...profileForm.register('alergias')} />
              </FormField>
              <FormField label="Condiciones" error={profileForm.formState.errors.condiciones?.message}>
                <Textarea
                  placeholder="Asma, lesiones, medicacion..."
                  {...profileForm.register('condiciones')}
                />
              </FormField>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={profileMutation.isPending}>
              <Save className="h-4 w-4" /> Guardar cambios
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmitPassword} className="mx-auto max-w-lg">
          <div className="surface space-y-5 p-5 sm:p-6">
            {sectionTitle(KeyRound, 'Cambiar contrasena', 'Usa al menos 8 caracteres con letras y numeros.')}
            <FormField
              label="Contrasena actual"
              error={passwordForm.formState.errors.password_actual?.message}
            >
              <Input type="password" autoComplete="current-password" {...passwordForm.register('password_actual')} />
            </FormField>
            <FormField
              label="Nueva contrasena"
              error={passwordForm.formState.errors.password_nueva?.message}
            >
              <Input type="password" autoComplete="new-password" {...passwordForm.register('password_nueva')} />
            </FormField>
            <FormField
              label="Confirmar nueva contrasena"
              error={passwordForm.formState.errors.confirmar?.message}
            >
              <Input type="password" autoComplete="new-password" {...passwordForm.register('confirmar')} />
            </FormField>
            <Button type="submit" className="w-full" loading={passwordMutation.isPending}>
              <KeyRound className="h-4 w-4" /> Actualizar contrasena
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

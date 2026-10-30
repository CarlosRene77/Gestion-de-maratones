import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Eye, EyeOff, HeartPulse, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/auth';
import { errorMessage } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { registerSchema, type RegisterValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Checkbox, FormField, Input, Select } from '@/components/ui/form';

export function RegisterPage() {
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { setTheme } = useTheme();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmar: '',
      fecha_nacimiento: '',
      genero: undefined,
      telefono: '',
      contacto_emergencia: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      authApi.register({
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        fecha_nacimiento: values.fecha_nacimiento,
        genero: values.genero,
        telefono: values.telefono || undefined,
        contacto_emergencia: values.contacto_emergencia || undefined,
      }),
    onSuccess: (data) => {
      setSession(data.token, data.usuario);
      setTheme(data.usuario.modo_oscuro_pref ? 'dark' : 'light', { sync: false });
      toast.success('Tu cuenta fue creada. Ya puedes inscribirte.');
      navigate('/app', { replace: true });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      form.setError('email', { message: errorMessage(error) });
    },
  });

  const submit = (values: RegisterValues) => {
    if (!accepted) {
      toast.warning('Debes aceptar el reglamento y la politica de privacidad.');
      return;
    }
    mutation.mutate(values);
  };

  const errors = form.formState.errors;

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          <ShieldCheck className="h-3 w-3" /> Registro de corredor
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white">
          Crea tu cuenta
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Un solo perfil para inscribirte, recibir tu pase digital y descargar certificados.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" htmlFor="nombre" error={errors.nombre?.message}>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="nombre" placeholder="Ana" className="pl-10" {...form.register('nombre')} />
            </div>
          </FormField>
          <FormField label="Apellido" htmlFor="apellido" error={errors.apellido?.message}>
            <Input id="apellido" placeholder="Martinez" {...form.register('apellido')} />
          </FormField>
        </div>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              className="pl-10"
              {...form.register('email')}
            />
          </div>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Contrasena" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimo 8 caracteres"
                className="pl-10 pr-10"
                {...form.register('password')}
              />
              <button
                type="button"
                onClick={() => setShow((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label="Mostrar contrasena"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          <FormField label="Confirmar contrasena" htmlFor="confirmar" error={errors.confirmar?.message}>
            <Input
              id="confirmar"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repite tu contrasena"
              {...form.register('confirmar')}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Fecha de nacimiento"
            htmlFor="fecha_nacimiento"
            error={errors.fecha_nacimiento?.message}
            hint="Se usa para validar la edad de tu categoria."
          >
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="fecha_nacimiento"
                type="date"
                className="pl-10"
                max={new Date().toISOString().slice(0, 10)}
                {...form.register('fecha_nacimiento')}
              />
            </div>
          </FormField>
          <FormField label="Genero" htmlFor="genero" error={errors.genero?.message}>
            <Select id="genero" defaultValue="" {...form.register('genero')}>
              <option value="" disabled>
                Selecciona
              </option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Telefono (opcional)" htmlFor="telefono" error={errors.telefono?.message}>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="telefono" placeholder="+507 6000-0000" className="pl-10" {...form.register('telefono')} />
            </div>
          </FormField>
          <FormField
            label="Contacto de emergencia (opcional)"
            htmlFor="contacto_emergencia"
            error={errors.contacto_emergencia?.message}
          >
            <div className="relative">
              <HeartPulse className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="contacto_emergencia"
                placeholder="Nombre y telefono"
                className="pl-10"
                {...form.register('contacto_emergencia')}
              />
            </div>
          </FormField>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border bg-white p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          <Checkbox
            className="mt-0.5"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            Acepto el reglamento de la carrera, la politica de privacidad y el tratamiento de
            datos personales para fines deportivos.
          </span>
        </label>

        <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
          Crear mi cuenta
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Ya tienes cuenta?{' '}
        <Link to="/login" className="link">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}

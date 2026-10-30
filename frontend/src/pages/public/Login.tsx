import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/auth';
import { errorMessage } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { loginSchema, type LoginValues } from '@/lib/schemas';
import { getRole } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form';

const demoAccounts = [
  { rol: 'Corredor', email: 'corredor@marathonhub.com', password: 'Corredor123!', accent: 'brand' as const },
  { rol: 'Staff', email: 'staff@marathonhub.com', password: 'Staff123!', accent: 'electric' as const },
  { rol: 'Admin', email: 'admin@marathonhub.com', password: 'Admin123!', accent: 'sky' as const },
];

export function LoginPage() {
  const [show, setShow] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, homeForRole } = useAuth();
  const { setTheme } = useTheme();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => authApi.login(values.email.trim(), values.password),
    onSuccess: (data) => {
      setSession(data.token, data.usuario);
      setTheme(data.usuario.modo_oscuro_pref ? 'dark' : 'light', { sync: false });
      toast.success(`Bienvenido de vuelta, ${data.usuario.nombre}.`);
      const redirect = params.get('redirect');
      navigate(redirect && redirect.startsWith('/') ? redirect : homeForRole(getRole(data.usuario)), {
        replace: true,
      });
    },
    onError: (error) => {
      const message = errorMessage(error);
      toast.error(message);
      form.setError('password', { message });
    },
  });

  const fill = (email: string, password: string) => {
    form.setValue('email', email, { shouldValidate: true });
    form.setValue('password', password, { shouldValidate: true });
  };

  return (
    <div>
      <div className="mb-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          <Sparkles className="h-3 w-3" /> Acceso seguro
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white">
          Inicia sesion
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Entra a tu panel para gestionar inscripciones, pases y resultados.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
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

        <FormField label="Contrasena" htmlFor="password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-10 pr-10"
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
              aria-label={show ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
          Entrar a MarathonHub
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        No tienes cuenta?{' '}
        <Link to="/registro" className="link">
          Registrate como corredor
        </Link>
      </p>

      <div className="mt-7 rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Cuentas de demostracion
        </p>
        <div className="mt-3 grid gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.rol}
              type="button"
              onClick={() => fill(account.email, account.password)}
              className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-2 text-left transition hover:border-brand-500/50 hover:bg-brand-500/5 dark:bg-slate-950/40"
            >
              <span>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  {account.rol}
                </span>
                <span className="block text-[11px] text-slate-400">{account.email}</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Usar
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
          Las cuentas demo son parte del entorno de desarrollo. No uses contrasenas reales.
        </p>
      </div>
    </div>
  );
}

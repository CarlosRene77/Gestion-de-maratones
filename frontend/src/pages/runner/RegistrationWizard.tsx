import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  HeartPulse,
  Info,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  Shirt,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEvent, useEvents } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { registrationsApi } from '@/services/registrations';
import { authApi } from '@/services/auth';
import { errorMessage } from '@/services/api';
import { qk } from '@/hooks/queries';
import { downloadReceiptPdf } from '@/lib/pdf';
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  GENERO_LABEL,
  TALLAS,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, FormField, Checkbox } from '@/components/ui/form';
import { Progress, ErrorState } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import type { Inscripcion } from '@/types';

const tallaEnum = z.enum(TALLAS);

const healthSchema = z.object({
  talla_camiseta: tallaEnum,
  fecha_nacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es obligatoria.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Fecha invalida.')
    .refine((value) => new Date(value) < new Date(), 'La fecha no puede ser futura.'),
  genero: z.enum(['M', 'F'], { required_error: 'Selecciona tu genero.' }),
  contacto_emergencia: z
    .string()
    .min(5, 'Indica nombre y telefono de emergencia.')
    .max(150, 'Maximo 150 caracteres.'),
  tipo_sangre: z.string().max(10).optional().or(z.literal('')),
  alergias: z.string().max(300).optional().or(z.literal('')),
  condiciones: z.string().max(300).optional().or(z.literal('')),
  acepta_salud: z.boolean().refine((value) => value === true, {
    message: 'Debes declarar que la informacion es correcta.',
  }),
});
type HealthValues = z.infer<typeof healthSchema>;

const paymentSchema = z
  .object({
    metodo_pago: z.enum(['tarjeta_simulada', 'comprobante']),
    titular: z.string().optional().or(z.literal('')),
    numero_tarjeta: z.string().optional().or(z.literal('')),
    vencimiento: z.string().optional().or(z.literal('')),
    cvv: z.string().optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (values.metodo_pago !== 'tarjeta_simulada') return;
    if (!values.titular || values.titular.trim().length < 3) {
      ctx.addIssue({ code: 'custom', path: ['titular'], message: 'Nombre del titular requerido.' });
    }
    if (!/^\d{16}$/.test((values.numero_tarjeta || '').replace(/\s/g, ''))) {
      ctx.addIssue({ code: 'custom', path: ['numero_tarjeta'], message: 'Ingresa 16 digitos.' });
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.vencimiento || '')) {
      ctx.addIssue({ code: 'custom', path: ['vencimiento'], message: 'Formato MM/AA.' });
    }
    if (!/^\d{3,4}$/.test(values.cvv || '')) {
      ctx.addIssue({ code: 'custom', path: ['cvv'], message: 'CVV de 3 o 4 digitos.' });
    }
  });
type PaymentValues = z.infer<typeof paymentSchema>;

const steps = [
  { title: 'Categoria', icon: Users },
  { title: 'Salud y talla', icon: HeartPulse },
  { title: 'Pago', icon: CreditCard },
  { title: 'Confirmacion', icon: BadgeCheck },
];

function ageAt(birthDate: string | null | undefined, reference: string) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const ref = new Date(reference);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) return null;
  let age = ref.getFullYear() - birth.getFullYear();
  const month = ref.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && ref.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function RegistrationWizardPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState(params.get('evento') || '');
  const [categoryId, setCategoryId] = useState(params.get('categoria') || '');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [result, setResult] = useState<Inscripcion | null>(null);

  const eventsQuery = useEvents({ estado: 'publicado', limit: 100, sort: 'fecha_evento', order: 'asc' });
  const events = eventsQuery.data?.items ?? [];
  const selectedEvent = useMemo(
    () => events.find((event) => String(event.id_evento) === String(eventId)),
    [events, eventId],
  );
  const detailQuery = useEvent(eventId || undefined);
  const event = detailQuery.data ?? selectedEvent;
  const categories = event?.categorias ?? [];
  const category = categories.find((item) => String(item.id_categoria) === String(categoryId));

  useEffect(() => {
    if (!eventId && events.length) {
      setEventId(String(events[0].id_evento));
    }
  }, [events, eventId]);

  useEffect(() => {
    if (categoryId && categories.length && !category) setCategoryId('');
  }, [categories, category, categoryId]);

  const healthForm = useForm<HealthValues>({
    resolver: zodResolver(healthSchema),
    mode: 'onBlur',
    defaultValues: {
      talla_camiseta: 'M',
      fecha_nacimiento: user?.fecha_nacimiento?.slice(0, 10) ?? '',
      genero: user?.genero ?? undefined,
      contacto_emergencia: user?.contacto_emergencia ?? '',
      tipo_sangre: user?.ficha_medica_json?.tipo_sangre ?? '',
      alergias: user?.ficha_medica_json?.alergias ?? '',
      condiciones: user?.ficha_medica_json?.condiciones ?? '',
      acepta_salud: false,
    },
  });

  const paymentForm = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    mode: 'onBlur',
    defaultValues: {
      metodo_pago: 'tarjeta_simulada',
      titular: '',
      numero_tarjeta: '',
      vencimiento: '',
      cvv: '',
    },
  });

  const method = paymentForm.watch('metodo_pago');

  const healthValues = healthForm.watch();
  const eligibility = useMemo(() => {
    if (!category || !event) return null;
    const age = ageAt(healthValues.fecha_nacimiento, event.fecha_evento);
    if (age === null) return null;
    if (category.edad_minima !== null && age < Number(category.edad_minima)) {
      return `La categoria requiere edad minima de ${category.edad_minima} anos (tendrias ${age}).`;
    }
    if (category.edad_maxima !== null && age > Number(category.edad_maxima)) {
      return `La categoria permite edad maxima de ${category.edad_maxima} anos (tendrias ${age}).`;
    }
    if (category.genero !== 'Mixto' && healthValues.genero && healthValues.genero !== category.genero) {
      return `Esta categoria es exclusiva para genero ${GENERO_LABEL[category.genero]}.`;
    }
    return null;
  }, [category, event, healthValues.fecha_nacimiento, healthValues.genero]);

  const mutation = useMutation({
    mutationFn: async (values: PaymentValues) => {
      if (!category || !event) throw new Error('Selecciona una categoria.');
      const health = healthForm.getValues();

      await authApi.updateProfile({
        fecha_nacimiento: health.fecha_nacimiento,
        genero: health.genero,
        contacto_emergencia: health.contacto_emergencia,
        ficha_medica_json: {
          tipo_sangre: health.tipo_sangre || undefined,
          alergias: health.alergias || undefined,
          condiciones: health.condiciones || undefined,
        },
      });

      const codigoTransaccion =
        values.metodo_pago === 'tarjeta_simulada'
          ? `CARD-${String(values.numero_tarjeta).replace(/\s/g, '').slice(-4)}-${Date.now().toString(36).toUpperCase()}`
          : `COMP-${(comprobante?.name || 'recibo').slice(0, 32).replace(/\s+/g, '-')}-${Date.now()
              .toString(36)
              .toUpperCase()}`;

      const created = await registrationsApi.create({
        id_categoria: category.id_categoria,
        talla_camiseta: health.talla_camiseta,
        codigo_transaccion: codigoTransaccion,
      });

      const paid = await registrationsApi.paySimulated(created.id_inscripcion, {
        metodo_pago: values.metodo_pago,
        codigo_transaccion: codigoTransaccion,
        titular: values.titular || undefined,
        ultimos_digitos:
          values.metodo_pago === 'tarjeta_simulada'
            ? String(values.numero_tarjeta).replace(/\s/g, '').slice(-4)
            : undefined,
      });

      return paid;
    },
    onSuccess: (data) => {
      setResult(data);
      setStep(4);
      queryClient.invalidateQueries({ queryKey: qk.myRegistrations() });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: qk.event(data.categoria?.id_evento) });
      toast.success(`Inscripcion confirmada. Tu dorsal es #${data.numero_dorsal}.`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const goNext = async () => {
    if (step === 1) {
      if (!category) {
        toast.warning('Selecciona una categoria para continuar.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const valid = await healthForm.trigger();
      if (!valid) return;
      if (eligibility) {
        toast.error(eligibility);
        return;
      }
      setStep(3);
    }
  };

  const progress = ((step - 1) / 3) * 100;

  if (!eventsQuery.isLoading && !events.length) {
    return (
      <div className="space-y-4">
        <ErrorState
          message="No hay carreras con inscripciones abiertas en este momento."
          onRetry={() => void eventsQuery.refetch()}
        />
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/eventos">Ver calendario</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Wizard de inscripcion</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Asegura tu lugar
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Cuatro pasos y listo: categoria, datos de salud, pago simulado y confirmacion.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app">
            <ArrowLeft className="h-4 w-4" /> Volver al panel
          </Link>
        </Button>
      </div>

      <div className="surface p-4 sm:p-5">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((item, index) => {
            const number = index + 1;
            const active = step === number;
            const done = step > number || (step === 4 && number === 4);
            return (
              <div key={item.title} className="flex flex-col items-center gap-2 text-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl border-2 transition',
                    active
                      ? 'border-brand-500 bg-brand-500 text-slate-950'
                      : done
                        ? 'border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'border-slate-200 text-slate-400 dark:border-slate-700',
                  )}
                >
                  {done && !active ? <Check className="h-5 w-5" /> : <item.icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider sm:text-[11px]',
                    active || done ? 'text-slate-900 dark:text-white' : 'text-slate-400',
                  )}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={step === 4 ? 100 : progress} className="mt-4" />
      </div>

      {step === 1 && (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <div className="surface p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                1. Elige tu carrera
              </h2>
              <div className="mt-4">
                <FormField label="Carrera disponible">
                  <Select
                    value={eventId}
                    onChange={(event) => {
                      setEventId(event.target.value);
                      setCategoryId('');
                    }}
                  >
                    {events.map((item) => (
                      <option key={item.id_evento} value={item.id_evento}>
                        {item.nombre_evento} · {formatDate(item.fecha_evento, 'dd/MM/yyyy')}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              {event && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
                    {formatDate(event.fecha_evento, "EEE d 'de' MMM yyyy")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" />
                    {[event.ciudad, event.lugar_salida].filter(Boolean).join(' · ') || 'Sede por confirmar'}
                  </span>
                </div>
              )}
            </div>

            <div className="surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  2. Selecciona categoria
                </h2>
                {event && (
                  <span className="text-[11px] text-slate-400">
                    {formatNumber(
                      event.categorias.reduce(
                        (acc, item) => acc + Number(item.cupos_disponibles ?? 0),
                        0,
                      ),
                    )}{' '}
                    cupos
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2.5">
                {detailQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))
                ) : categories.length ? (
                  categories.map((item) => {
                    const available = Number(item.cupos_disponibles ?? item.cupo_maximo);
                    const full = available <= 0;
                    const selected = String(item.id_categoria) === String(categoryId);
                    return (
                      <button
                        key={item.id_categoria}
                        type="button"
                        disabled={full}
                        onClick={() => setCategoryId(String(item.id_categoria))}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition',
                          selected
                            ? 'border-brand-500 bg-brand-500/5 shadow-[0_0_0_1px_rgba(34,197,94,.35)]'
                            : 'hover:border-slate-300 dark:hover:border-slate-700',
                          full && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                              {item.nombre_cat}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              {Number(item.distancia_km)}K
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {GENERO_LABEL[item.genero]}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.edad_minima !== null || item.edad_maxima !== null
                              ? `Edad ${item.edad_minima ?? 0}-${item.edad_maxima ?? '+'} anos`
                              : 'Todas las edades'}{' '}
                            · {available} cupos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-extrabold text-slate-950 dark:text-white">
                            {formatCurrency(item.precio)}
                          </p>
                          {selected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                              <CheckCircle2 className="h-3 w-3" /> Elegida
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">
                    Esta carrera aun no tiene categorias disponibles.
                  </p>
                )}
              </div>

              {categoryId && !category && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Info className="h-3.5 w-3.5" /> La categoria seleccionada no esta disponible.
                </p>
              )}
              {eligibility && (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {eligibility}
                </p>
              )}
            </div>

            <Button onClick={() => void goNext()} disabled={!category} size="lg" className="w-full sm:w-auto">
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <aside className="surface h-fit p-5 lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Resumen de inscripcion
            </p>
            {category && event ? (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carrera</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{event.nombre_evento}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Categoria</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {category.nombre_cat}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Distancia</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {Number(category.distancia_km)} km
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Fecha</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(event.fecha_evento)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
                  <span className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                    {formatCurrency(category.precio)}
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-brand-500/5 p-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  Cupo reservado al confirmar el pago simulado. Dorsal asignado automaticamente.
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Selecciona una categoria para ver el resumen.
              </p>
            )}
          </aside>
        </div>
      )}

      {step === 2 && (
        <form
          onSubmit={healthForm.handleSubmit(() => void goNext())}
          className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"
        >
          <div className="space-y-5">
            <div className="surface p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                Datos de salud y emergencia
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Esta informacion se comparte con el equipo medico del evento.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Fecha de nacimiento" error={healthForm.formState.errors.fecha_nacimiento?.message}>
                  <Input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    {...healthForm.register('fecha_nacimiento')}
                  />
                </FormField>
                <FormField label="Genero" error={healthForm.formState.errors.genero?.message}>
                  <Select defaultValue="" {...healthForm.register('genero')}>
                    <option value="" disabled>
                      Selecciona
                    </option>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                  </Select>
                </FormField>
                <FormField
                  label="Contacto de emergencia"
                  className="sm:col-span-2"
                  error={healthForm.formState.errors.contacto_emergencia?.message}
                  hint="Nombre completo y telefono de una persona a contactar."
                >
                  <Input placeholder="Maria Perez · +507 6000-0000" {...healthForm.register('contacto_emergencia')} />
                </FormField>
                <FormField label="Tipo de sangre" error={healthForm.formState.errors.tipo_sangre?.message}>
                  <Select defaultValue="" {...healthForm.register('tipo_sangre')}>
                    <option value="">No especificado</option>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Alergias" error={healthForm.formState.errors.alergias?.message}>
                  <Input placeholder="Medicamentos, alimentos..." {...healthForm.register('alergias')} />
                </FormField>
                <FormField
                  label="Condiciones medicas"
                  className="sm:col-span-2"
                  error={healthForm.formState.errors.condiciones?.message}
                >
                  <Textarea
                    placeholder="Asma, lesiones previas, medicacion actual..."
                    {...healthForm.register('condiciones')}
                  />
                </FormField>
              </div>
            </div>

            <div className="surface p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                Talla de playera oficial
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Recibirás esta talla en tu kit. No se garantizan cambios el dia del evento.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {TALLAS.map((talla) => {
                  const selected = healthForm.watch('talla_camiseta') === talla;
                  return (
                    <button
                      key={talla}
                      type="button"
                      onClick={() =>
                        healthForm.setValue('talla_camiseta', talla, { shouldValidate: true })
                      }
                      className={cn(
                        'flex h-14 flex-col items-center justify-center rounded-xl border-2 transition',
                        selected
                          ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                      )}
                    >
                      <Shirt className="h-4 w-4" />
                      <span className="mt-1 text-xs font-bold">{talla}</span>
                    </button>
                  );
                })}
              </div>
              {healthForm.formState.errors.talla_camiseta && (
                <p className="error-text">{healthForm.formState.errors.talla_camiseta.message}</p>
              )}

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                <Checkbox className="mt-0.5" {...healthForm.register('acepta_salud')} />
                <span>
                  Declaro que la informacion de salud es veridica y autorizo al equipo medico a
                  brindar atencion de emergencia si es necesario.
                </span>
              </label>
              {healthForm.formState.errors.acepta_salud && (
                <p className="error-text">{healthForm.formState.errors.acepta_salud.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Atras
              </Button>
              <Button type="submit" size="lg">
                Continuar al pago <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <aside className="surface h-fit p-5 lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Tu seleccion
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carrera</p>
                <p className="font-semibold text-slate-900 dark:text-white">{event?.nombre_evento}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Categoria</span>
                <span className="font-semibold text-slate-900 dark:text-white">{category?.nombre_cat}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Talla</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {healthValues.talla_camiseta}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
                <span className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                  {formatCurrency(category?.precio)}
                </span>
              </div>
            </div>
          </aside>
        </form>
      )}

      {step === 3 && (
        <form
          onSubmit={paymentForm.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"
        >
          <div className="space-y-5">
            <div className="surface p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                Metodo de pago
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Entorno de demostracion: no se realizan cargos reales.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { value: 'tarjeta_simulada' as const, label: 'Tarjeta simulada', icon: CreditCard },
                  { value: 'comprobante' as const, label: 'Subir comprobante', icon: Upload },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => paymentForm.setValue('metodo_pago', option.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition',
                      method === option.value
                        ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                        : 'text-slate-500 hover:border-slate-300 dark:text-slate-400',
                    )}
                  >
                    <option.icon className="h-4 w-4" /> {option.label}
                  </button>
                ))}
              </div>

              {method === 'tarjeta_simulada' ? (
                <div className="mt-5 space-y-4">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white">
                    <div className="absolute inset-0 bg-grid-dark bg-[size:26px_26px] opacity-30" />
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/30 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">
                          MarathonHub Pay
                        </p>
                        <CreditCard className="h-5 w-5 text-white/50" />
                      </div>
                      <p className="mt-6 font-mono text-lg tracking-[0.15em]">
                        {paymentForm.watch('numero_tarjeta') || '•••• •••• •••• ••••'}
                      </p>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-white/40">Titular</p>
                          <p className="text-xs font-semibold uppercase">
                            {paymentForm.watch('titular') || 'NOMBRE DEL TITULAR'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase tracking-wider text-white/40">Vence</p>
                          <p className="font-mono text-xs">{paymentForm.watch('vencimiento') || 'MM/AA'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormField label="Titular" error={paymentForm.formState.errors.titular?.message}>
                    <Input placeholder="Como aparece en la tarjeta" {...paymentForm.register('titular')} />
                  </FormField>
                  <FormField label="Numero de tarjeta" error={paymentForm.formState.errors.numero_tarjeta?.message}>
                    <Input
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      value={paymentForm.watch('numero_tarjeta')}
                      onChange={(event) =>
                        paymentForm.setValue('numero_tarjeta', formatCardNumber(event.target.value), {
                          shouldValidate: paymentForm.formState.isSubmitted,
                        })
                      }
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Vencimiento" error={paymentForm.formState.errors.vencimiento?.message}>
                      <Input
                        placeholder="MM/AA"
                        inputMode="numeric"
                        value={paymentForm.watch('vencimiento')}
                        onChange={(event) =>
                          paymentForm.setValue('vencimiento', formatExpiry(event.target.value), {
                            shouldValidate: paymentForm.formState.isSubmitted,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="CVV" error={paymentForm.formState.errors.cvv?.message}>
                      <Input
                        placeholder="123"
                        inputMode="numeric"
                        maxLength={4}
                        type="password"
                        {...paymentForm.register('cvv')}
                      />
                    </FormField>
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="h-3 w-3" /> Simulacion segura. Usa cualquier tarjeta de 16
                    digitos, por ejemplo 4242 4242 4242 4242.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 text-center transition hover:border-brand-500/60 dark:border-slate-700">
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {comprobante ? comprobante.name : 'Sube tu comprobante'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      JPG, PNG o PDF · maximo 5 MB (simulado)
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          toast.error('El archivo supera 5 MB.');
                          return;
                        }
                        setComprobante(file);
                      }}
                    />
                  </label>
                  <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                    <Info className="mr-1 inline h-3.5 w-3.5" />
                    En este entorno el comprobante no se almacena; se registra la referencia para
                    completar la inscripcion.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={mutation.isPending}>
                <ArrowLeft className="h-4 w-4" /> Atras
              </Button>
              <Button type="submit" size="lg" loading={mutation.isPending}>
                <Lock className="h-4 w-4" /> Pagar {formatCurrency(category?.precio)}
              </Button>
            </div>
          </div>

          <aside className="surface h-fit p-5 lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Resumen de pago
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Categoria</span>
                <span className="font-semibold text-slate-900 dark:text-white">{category?.nombre_cat}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Talla</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {healthForm.getValues('talla_camiseta')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Metodo</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {method === 'tarjeta_simulada' ? 'Tarjeta' : 'Comprobante'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Total a pagar</span>
                <span className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                  {formatCurrency(category?.precio)}
                </span>
              </div>
            </div>
          </aside>
        </form>
      )}

      {step === 4 && result && (
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="surface overflow-hidden">
            <div className="relative bg-gradient-to-br from-brand-500/20 via-slate-950 to-slate-950 p-8 text-center">
              <div className="absolute inset-0 bg-grid-dark bg-[size:28px_28px] opacity-20" />
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-slate-950 shadow-[0_0_50px_-10px_rgba(34,197,94,.8)]">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-white">
                  Inscripcion confirmada
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {result.categoria?.evento?.nombre_evento}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-sm font-bold text-white">
                  Dorsal oficial #{result.numero_dorsal ?? '—'}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Corredor', value: `${user?.nombre} ${user?.apellido}` },
                  { label: 'Categoria', value: result.categoria?.nombre_cat ?? '—' },
                  { label: 'Distancia', value: `${Number(result.categoria?.distancia_km)} km` },
                  { label: 'Talla', value: result.talla_camiseta ?? '—' },
                  { label: 'Pago', value: result.estado_pago === 'completado' ? 'Verificado' : result.estado_pago },
                  { label: 'Transaccion', value: result.codigo_transaccion ?? '—' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-slate-50 p-3 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" asChild>
                  <Link to={`/app/pase?inscripcion=${result.id_inscripcion}`}>
                    <QrCode className="h-4 w-4" /> Ver pase digital
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => user && downloadReceiptPdf(result, user)}
                >
                  <Download className="h-4 w-4" /> Descargar comprobante
                </Button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/app')}
                className="w-full text-center text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:text-brand-500"
              >
                Volver a mi panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Timer, Trophy } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const highlights = [
  { icon: Trophy, title: 'Eventos memorables', text: 'Carreras 5K, 10K, 21K y 42K con experiencia digital completa.' },
  { icon: Timer, title: 'Resultados en vivo', text: 'Cronometraje por checkpoints y certificados descargables al instante.' },
  { icon: ShieldCheck, title: 'Acreditacion segura', text: 'Pase digital con QR y entrega de kits verificada en segundos.' },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-[size:34px_34px] opacity-30" />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-electric-500/15 blur-3xl" />

        <div className="relative">
          <Logo className="[&_span]:text-white" />
        </div>

        <div className="relative max-w-lg">
          <p className="eyebrow">La carrera empieza aqui</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white">
            Corre, registra <span className="text-brand-400">y celebra</span> cada meta.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-slate-400">
            Inscripciones en linea, pase digital con QR, entrega de kits sin filas y
            resultados oficiales en tiempo real.
          </p>

          <div className="mt-10 space-y-4">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          MarathonHub · Plataforma de gestion de carreras y maratones
        </p>
      </div>

      <div className="flex flex-col bg-zinc-50 dark:bg-slate-950">
        <div className="flex items-center justify-between p-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-brand-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al sitio
          </Link>
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

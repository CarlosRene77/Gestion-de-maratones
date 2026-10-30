import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Trophy, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const links = [
  { to: '/eventos', label: 'Carreras' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/#como-funciona', label: 'Como funciona' },
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, role, homeForRole } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/85">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white',
                  location.pathname === link.to &&
                    'bg-slate-100 text-slate-950 dark:bg-slate-800/60 dark:text-white',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link to={homeForRole(role)}>
                  Mi panel <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/registro">Inscribirme</Link>
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Abrir menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="container-page flex flex-col gap-1 py-3">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {isAuthenticated ? (
                    <Button asChild className="col-span-2">
                      <Link to={homeForRole(role)}>Mi panel</Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link to="/login">Entrar</Link>
                      </Button>
                      <Button asChild>
                        <Link to="/registro">Registrarme</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
              La plataforma integral para organizar carreras, gestionar inscripciones,
              acreditaciones y resultados en tiempo real.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3 text-xs text-brand-700 dark:text-brand-300">
              <Trophy className="h-4 w-4 shrink-0" />
              <span>+120 eventos gestionados con exito</span>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Corredores
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link className="hover:text-brand-500" to="/eventos">Calendario de carreras</Link></li>
              <li><Link className="hover:text-brand-500" to="/resultados">Resultados oficiales</Link></li>
              <li><Link className="hover:text-brand-500" to="/registro">Crear cuenta</Link></li>
              <li><Link className="hover:text-brand-500" to="/login">Acceso a mi panel</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Organizadores
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link className="hover:text-brand-500" to="/login">Panel administrativo</Link></li>
              <li><Link className="hover:text-brand-500" to="/login">Acreditacion y kits</Link></li>
              <li><Link className="hover:text-brand-500" to="/login">Reportes y exportacion</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Contacto
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li>soporte@marathonhub.app</li>
              <li>+507 6000-0000</li>
              <li>Ciudad de Panama</li>
            </ul>
            <div className="mt-5 flex gap-2">
              <span className="rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Instagram
              </span>
              <span className="rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Strava
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 py-5 dark:border-slate-800">
          <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} MarathonHub. Todos los derechos reservados.</p>
            <p>Hecho para corredores, por corredores.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

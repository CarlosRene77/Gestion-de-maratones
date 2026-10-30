import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-[7rem] font-extrabold leading-none text-brand-500/20 dark:text-brand-500/15">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white">
        Te saliste del circuito
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
        La pagina que buscas no existe, cambio de nombre o ya no esta disponible.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4" /> Ir al inicio
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/eventos">
            <Compass className="h-4 w-4" /> Ver carreras
          </Link>
        </Button>
      </div>
    </div>
  );
}

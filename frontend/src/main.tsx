import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { App } from '@/App';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { TooltipProvider } from '@/components/ui/misc';
import { Logo } from '@/components/Logo';
import { authApi } from '@/services/auth';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import '@/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [400, 401, 403, 404, 422].includes(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

function ThemeToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: 'font-sans',
        duration: 4200,
      }}
    />
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-50 dark:bg-slate-950">
      <Logo />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Cargando plataforma
      </p>
    </div>
  );
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const [ready, setReady] = useState(!token);

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }

    let active = true;
    authApi
      .me()
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch(() => {
        // El interceptor de la API limpia la sesion si el token expiro.
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [token, setUser]);

  if (!ready) return <Splash />;
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <AuthBootstrap>
              <App />
            </AuthBootstrap>
          </BrowserRouter>
          <ThemeToaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

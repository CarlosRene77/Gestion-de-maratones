import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolved: 'dark' | 'light';
  setTheme: (theme: Theme, options?: { sync?: boolean }) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'mh-theme';

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Ignorar almacenamiento no disponible.
  }
  return 'dark';
}

function resolve(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolved, setResolved] = useState<'dark' | 'light'>(() => resolve(readStoredTheme()));

  const apply = useCallback((next: 'dark' | 'light') => {
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next === 'dark' ? '#020617' : '#fafafa');
    setResolved(next);
  }, []);

  const setTheme = useCallback(
    (next: Theme, options: { sync?: boolean } = {}) => {
      setThemeState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignorar almacenamiento no disponible.
      }
      const nextResolved = resolve(next);
      apply(nextResolved);

      if (options.sync !== false && useAuthStore.getState().token) {
        authApi.updateTheme(nextResolved === 'dark').catch(() => {
          // La preferencia local sigue siendo valida aunque falle la API.
        });
      }
    },
    [apply],
  );

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  useEffect(() => {
    apply(resolve(theme));
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => apply(media.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme, apply]);

  useEffect(() => {
    const onSessionExpired = () => {
      // El interceptor ya limpio la sesion; la UI reacciona al estado.
    };
    window.addEventListener('mh:session-expired', onSessionExpired);
    return () => window.removeEventListener('mh:session-expired', onSessionExpired);
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider.');
  return context;
}

import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  QrCode,
  ScanLine,
  Timer,
  Trophy,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar } from '@/components/ui/misc';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { useAuth } from '@/hooks/useAuth';
import { cn, ROL_LABEL } from '@/lib/utils';
import type { RolNombre } from '@/types';

interface NavItem {
  to: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  end?: boolean;
}

const navByRole: Record<RolNombre, NavItem[]> = {
  corredor: [
    { to: '/app', label: 'Mi panel', icon: LayoutDashboard, end: true },
    { to: '/app/inscribirse', label: 'Nueva inscripcion', shortLabel: 'Inscribirme', icon: CalendarPlus },
    { to: '/app/pase', label: 'Mi pase digital', shortLabel: 'Pase', icon: QrCode },
    { to: '/app/resultados', label: 'Mis resultados', shortLabel: 'Tiempos', icon: Trophy },
    { to: '/app/perfil', label: 'Mi perfil', shortLabel: 'Perfil', icon: User },
  ],
  staff: [
    { to: '/staff', label: 'Acreditacion de kits', shortLabel: 'Kits', icon: ScanLine, end: true },
    { to: '/staff/evento', label: 'Control de evento', shortLabel: 'Evento', icon: Timer },
    { to: '/staff/perfil', label: 'Mi perfil', shortLabel: 'Perfil', icon: User },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard ejecutivo', shortLabel: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/carreras', label: 'Gestion de carreras', shortLabel: 'Carreras', icon: CalendarDays },
    { to: '/admin/usuarios', label: 'Usuarios y roles', shortLabel: 'Usuarios', icon: Users },
    { to: '/admin/kits', label: 'Inventario de kits', shortLabel: 'Kits', icon: Package },
    { to: '/admin/reportes', label: 'Reportes y exportacion', shortLabel: 'Reportes', icon: FileSpreadsheet },
    { to: '/admin/perfil', label: 'Mi perfil', shortLabel: 'Perfil', icon: User },
  ],
};

function useSectionTitle(items: NavItem[]) {
  const location = useLocation();
  return useMemo(() => {
    const match = [...items]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) =>
        item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
      );
    return match?.label ?? 'MarathonHub';
  }, [items, location.pathname]);
}

export function DashboardLayout() {
  const { user, role, logout, isAdmin, homeForRole } = useAuth();
  const safeRole: RolNombre = role ?? 'corredor';
  const items = navByRole[safeRole] ?? navByRole.corredor;
  const title = useSectionTitle(items);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mh-sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem('mh-sidebar', collapsed ? 'collapsed' : 'open');
    } catch {
      // Preferencia local opcional.
    }
  }, [collapsed]);

  const displayName = user ? `${user.nombre} ${user.apellido}`.trim() : 'Usuario';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-2')}>
        <Logo compact={collapsed} to={homeForRole(role)} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-brand-500/10 text-brand-700 shadow-[inset_0_0_0_1px_rgba(34,197,94,.25)] dark:text-brand-300'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-transparent p-3">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              {isAdmin ? 'Modo administrador' : safeRole === 'staff' ? 'Personal operativo' : 'Corredor oficial'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {isAdmin
                ? 'Control total de eventos, inscripciones y reportes.'
                : safeRole === 'staff'
                  ? 'Acreditacion de kits y cronometraje en vivo.'
                  : 'Tu pase, inscripciones y resultados en un solo lugar.'}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            'hidden w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && 'Colapsar menu'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-slate-950">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-all duration-300 lg:block dark:border-slate-800 dark:bg-slate-900/70',
          collapsed ? 'w-20' : 'w-72',
        )}
      >
        {sidebar}
      </aside>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
            >
              <button
                type="button"
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setDrawer(false)}
                aria-label="Cerrar menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className={cn('flex min-h-screen flex-col transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 dark:border-slate-800 dark:bg-slate-950/85">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
              {ROL_LABEL[safeRole]}
            </p>
            <h1 className="truncate font-display text-lg font-extrabold uppercase tracking-tight text-slate-950 dark:text-white">
              {title}
            </h1>
          </div>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Avatar name={displayName} />
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[140px] truncate text-xs font-bold text-slate-900 dark:text-white">
                    {displayName}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                    {ROL_LABEL[safeRole]}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="normal-case tracking-normal text-sm text-slate-900 dark:text-white">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/${safeRole === 'corredor' ? 'app' : safeRole}/perfil`}>
                  <User className="h-4 w-4" /> Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">
                  <LayoutDashboard className="h-4 w-4" /> Ir al sitio publico
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => void logout()}>
                <LogOut className="h-4 w-4" /> Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        {safeRole !== 'admin' && (
          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
            <div className="grid grid-cols-5">
              {items.slice(0, 5).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-bold uppercase tracking-wide transition',
                      isActive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.shortLabel ?? item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

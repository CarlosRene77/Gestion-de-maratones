import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { GuestOnly, RequireAuth, RoleRoute } from '@/components/RouteGuards';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/store/auth';
import { getRole } from '@/lib/utils';

const HomePage = lazy(() => import('@/pages/public/Home').then((m) => ({ default: m.HomePage })));
const EventsPage = lazy(() =>
  import('@/pages/public/Events').then((m) => ({ default: m.EventsPage })),
);
const RaceDetailPage = lazy(() =>
  import('@/pages/public/RaceDetail').then((m) => ({ default: m.RaceDetailPage })),
);
const LeaderboardPage = lazy(() =>
  import('@/pages/public/Leaderboard').then((m) => ({ default: m.LeaderboardPage })),
);
const LoginPage = lazy(() =>
  import('@/pages/public/Login').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/pages/public/Register').then((m) => ({ default: m.RegisterPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/public/NotFound').then((m) => ({ default: m.NotFoundPage })),
);

const RunnerDashboardPage = lazy(() =>
  import('@/pages/runner/RunnerDashboard').then((m) => ({ default: m.RunnerDashboardPage })),
);
const RegistrationWizardPage = lazy(() =>
  import('@/pages/runner/RegistrationWizard').then((m) => ({
    default: m.RegistrationWizardPage,
  })),
);
const MyPassPage = lazy(() =>
  import('@/pages/runner/MyPass').then((m) => ({ default: m.MyPassPage })),
);
const MyResultsPage = lazy(() =>
  import('@/pages/runner/MyResults').then((m) => ({ default: m.MyResultsPage })),
);

const KitCheckinPage = lazy(() =>
  import('@/pages/staff/KitCheckin').then((m) => ({ default: m.KitCheckinPage })),
);
const EventControlPage = lazy(() =>
  import('@/pages/staff/EventControl').then((m) => ({ default: m.EventControlPage })),
);

const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboardPage })),
);
const ManageRacesPage = lazy(() =>
  import('@/pages/admin/ManageRaces').then((m) => ({ default: m.ManageRacesPage })),
);
const ManageUsersPage = lazy(() =>
  import('@/pages/admin/ManageUsers').then((m) => ({ default: m.ManageUsersPage })),
);
const AdminKitsPage = lazy(() =>
  import('@/pages/admin/AdminKits').then((m) => ({ default: m.AdminKitsPage })),
);
const ReportsPage = lazy(() =>
  import('@/pages/admin/Reports').then((m) => ({ default: m.ReportsPage })),
);

const ProfilePage = lazy(() =>
  import('@/pages/shared/Profile').then((m) => ({ default: m.ProfilePage })),
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

function HomeRedirect() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const role = getRole(user);

  if (!token || !user) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/app" replace />;
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-slate-950">
      <Logo />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Cargando modulo
      </p>
    </div>
  );
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="eventos" element={<EventsPage />} />
            <Route path="eventos/:id" element={<RaceDetailPage />} />
            <Route path="resultados" element={<LeaderboardPage />} />
          </Route>

          <Route element={<GuestOnly />}>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="registro" element={<RegisterPage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<RoleRoute roles={['corredor']} />}>
              <Route path="app" element={<DashboardLayout />}>
                <Route index element={<RunnerDashboardPage />} />
                <Route path="inscribirse" element={<RegistrationWizardPage />} />
                <Route path="pase" element={<MyPassPage />} />
                <Route path="resultados" element={<MyResultsPage />} />
                <Route path="perfil" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route element={<RoleRoute roles={['staff']} />}>
              <Route path="staff" element={<DashboardLayout />}>
                <Route index element={<KitCheckinPage />} />
                <Route path="evento" element={<EventControlPage />} />
                <Route path="perfil" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route element={<RoleRoute roles={['admin']} />}>
              <Route path="admin" element={<DashboardLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="carreras" element={<ManageRacesPage />} />
                <Route path="kits" element={<AdminKitsPage />} />
                <Route path="usuarios" element={<ManageUsersPage />} />
                <Route path="reportes" element={<ReportsPage />} />
                <Route path="perfil" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="dashboard" element={<HomeRedirect />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { eventsApi, type EventFilters } from '@/services/events';
import { registrationsApi, type RegistrationFilters } from '@/services/registrations';
import { kitsApi, type KitFilters } from '@/services/kits';
import { resultsApi } from '@/services/results';
import { usersApi, type UserFilters } from '@/services/users';
import { timingApi, type TimingFilters } from '@/services/timing';
import type { Genero } from '@/types';

export const qk = {
  events: (filters?: EventFilters) => ['events', filters] as const,
  event: (id: number | string | undefined) => ['event', String(id)] as const,
  stats: (id: number | string | undefined) => ['event-stats', String(id)] as const,
  categories: (id: number | string | undefined) => ['event-categories', String(id)] as const,
  myRegistrations: () => ['registrations', 'me'] as const,
  registrations: (filters?: RegistrationFilters) => ['registrations', filters] as const,
  registration: (id: number | string) => ['registration', String(id)] as const,
  kits: (filters?: KitFilters) => ['kits', filters] as const,
  kit: (id: number | string) => ['kit', String(id)] as const,
  results: (eventId: number | string | undefined, filters?: { genero?: Genero; id_categoria?: number }) =>
    ['results', String(eventId), filters] as const,
  dorsalResult: (bib: string) => ['dorsal-result', bib] as const,
  certificate: (bib: string) => ['certificate', bib] as const,
  users: (filters?: UserFilters) => ['users', filters] as const,
  roles: () => ['roles'] as const,
  timing: (eventId: number | string | undefined, filters?: TimingFilters) =>
    ['timing', String(eventId), filters] as const,
};

export function useEvents(
  filters: EventFilters = {},
  options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof eventsApi.list>>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: qk.events(filters),
    queryFn: () => eventsApi.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });
}

export function useEvent(id?: number | string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.event(id),
    queryFn: () => eventsApi.get(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useEventStats(id?: number | string, enabled = true) {
  return useQuery({
    queryKey: qk.stats(id),
    queryFn: () => eventsApi.stats(Number(id)),
    enabled: Boolean(id) && enabled,
    staleTime: 20_000,
  });
}

export function useEventCategories(id?: number | string) {
  return useQuery({
    queryKey: qk.categories(id),
    queryFn: () => eventsApi.categories(Number(id)),
    enabled: Boolean(id),
    staleTime: 20_000,
  });
}

export function useMyRegistrations() {
  return useQuery({
    queryKey: qk.myRegistrations(),
    queryFn: () => registrationsApi.list({ limit: 100 }),
    staleTime: 15_000,
  });
}

export function useRegistrations(filters: RegistrationFilters = {}, enabled = true) {
  return useQuery({
    queryKey: qk.registrations(filters),
    queryFn: () => registrationsApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useRegistration(id: number | string | undefined) {
  return useQuery({
    queryKey: qk.registration(id ?? ''),
    queryFn: () => registrationsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useKits(filters: KitFilters = {}, enabled = true) {
  return useQuery({
    queryKey: qk.kits(filters),
    queryFn: () => kitsApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export function useKitLookup(id?: number | string, enabled = false) {
  return useQuery({
    queryKey: qk.kit(id ?? ''),
    queryFn: () => kitsApi.get(id!),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useResults(
  eventId?: number | string,
  filters: { genero?: Genero; id_categoria?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: qk.results(eventId, filters),
    queryFn: () => resultsApi.byEvent(eventId!, filters),
    enabled: Boolean(eventId) && enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useDorsalResult(bib: string, enabled = false) {
  return useQuery({
    queryKey: qk.dorsalResult(bib),
    queryFn: () => resultsApi.byDorsal(bib),
    enabled: Boolean(bib) && enabled,
    retry: false,
  });
}

export function useCertificate(bib: string, enabled = false) {
  return useQuery({
    queryKey: qk.certificate(bib),
    queryFn: () => resultsApi.certificate(bib),
    enabled: Boolean(bib) && enabled,
    retry: false,
  });
}

export function useUsers(filters: UserFilters = {}, enabled = true) {
  return useQuery({
    queryKey: qk.users(filters),
    queryFn: () => usersApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: qk.roles(),
    queryFn: () => usersApi.roles(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useTimingFeed(eventId?: number | string, enabled = true) {
  return useQuery({
    queryKey: qk.timing(eventId, { limit: 100 }),
    queryFn: () => timingApi.byEvent(eventId!, { limit: 100 }),
    enabled: Boolean(eventId) && enabled,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

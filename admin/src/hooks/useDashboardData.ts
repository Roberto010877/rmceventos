import { useEffect, useMemo, useState } from 'react';
import {
  emptyDashboardStats,
  getDashboardPermissions,
  loadDashboardCounts,
  subscribeDashboardRealtime,
  subscribeDashboardRecentLists,
} from '../services/dashboardService';
import type {
  DashboardActivity,
  DashboardContact,
  DashboardData,
  DashboardEvent,
  DashboardPermissions,
  DashboardPhoto,
  DashboardRole,
  DashboardTestimonial,
} from '../types/dashboard';

export function useDashboardData(role?: DashboardRole | null) {
  const permissions = useMemo(() => getDashboardPermissions(role), [role]);
  const [data, setData] = useState<DashboardData>({
    stats: emptyDashboardStats,
    contactosPendientes: [],
    testimoniosPendientes: [],
    eventosRecientes: [],
    fotosRecientes: [],
    actividadReciente: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);
    setData({
      stats: emptyDashboardStats,
      contactosPendientes: [],
      testimoniosPendientes: [],
      eventosRecientes: [],
      fotosRecientes: [],
      actividadReciente: [],
    });

    loadDashboardCounts(permissions)
      .then((counts) => {
        if (!mounted) return;
        setData((current) => ({
          ...current,
          stats: { ...current.stats, ...counts },
        }));
      })
      .catch((countError) => {
        console.error('Error al cargar contadores del dashboard:', countError);
        if (mounted) setError('No se pudieron cargar algunos contadores del dashboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const unsubscribeRealtime = subscribeDashboardRealtime(permissions, {
      onContacts: (items) => updateContacts(items, permissions),
      onTestimonials: (items) => updateTestimonials(items, permissions),
      onError: (message) => setError(message),
    });

    const unsubscribeRecent = subscribeDashboardRecentLists(permissions, {
      onEvents: updateEvents,
      onPhotos: updatePhotos,
      onActivity: updateActivity,
      onError: (message) => setError(message),
    });

    function updateContacts(items: DashboardContact[], currentPermissions: DashboardPermissions) {
      if (!mounted || !currentPermissions.canReadContacts) return;
      setData((current) => ({
        ...current,
        contactosPendientes: items,
        stats: { ...current.stats, mensajesNoAtendidos: items.length },
      }));
    }

    function updateTestimonials(
      items: DashboardTestimonial[],
      currentPermissions: DashboardPermissions
    ) {
      if (!mounted || !currentPermissions.canReadTestimonials) return;
      setData((current) => ({
        ...current,
        testimoniosPendientes: items,
        stats: { ...current.stats, testimoniosPendientes: items.length },
      }));
    }

    function updateEvents(items: DashboardEvent[]) {
      if (!mounted) return;
      setData((current) => ({ ...current, eventosRecientes: items }));
    }

    function updatePhotos(items: DashboardPhoto[]) {
      if (!mounted) return;
      setData((current) => ({ ...current, fotosRecientes: items }));
    }

    function updateActivity(items: DashboardActivity[]) {
      if (!mounted) return;
      setData((current) => ({ ...current, actividadReciente: items }));
    }

    return () => {
      mounted = false;
      unsubscribeRealtime();
      unsubscribeRecent();
    };
  }, [permissions]);

  return {
    data,
    permissions,
    loading,
    error,
  };
}

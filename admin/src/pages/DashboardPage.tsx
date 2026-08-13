import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardStats from '../components/dashboard/DashboardStats';
import PhotoOverview from '../components/dashboard/PhotoOverview';
import PriorityPanel from '../components/dashboard/PriorityPanel';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import RecentContacts from '../components/dashboard/RecentContacts';
import RecentEvents from '../components/dashboard/RecentEvents';
import SystemStatus from '../components/dashboard/SystemStatus';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import type { DashboardRole } from '../types/dashboard';

export default function DashboardPage() {
  const { userData } = useAuth();
  const role = userData?.rol as DashboardRole | undefined;
  const { data, permissions, loading, error } = useDashboardData(role);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardHeader name={userData?.nombre} role={role} loading={loading} />

      <div className="flex justify-end">
        <SystemStatus loading={loading} error={error} />
      </div>

      <DashboardStats stats={data.stats} permissions={permissions} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <PriorityPanel
            contacts={data.contactosPendientes}
            testimonials={data.testimoniosPendientes}
            permissions={permissions}
          />

          <RecentEvents events={data.eventosRecientes} />
        </div>

        <div className="space-y-6">
          <PhotoOverview photos={data.fotosRecientes} />
          {permissions.canReadContacts && <RecentContacts contacts={data.contactosPendientes} />}
          {permissions.canReadAudit && <RecentActivity activity={data.actividadReciente} />}
        </div>
      </div>

      <QuickActions permissions={permissions} />
    </div>
  );
}

/**
 * Main Dashboard Page
 * Routes to role-specific dashboard
 */

'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuth } from '@/contexts/auth-context';
import HRDashboard from '@/components/dashboards/hr-dashboard';
import CandidateDashboard from '@/components/dashboards/candidate-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {user?.role === 'hr' ? <HRDashboard /> : <CandidateDashboard />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

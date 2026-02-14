/**
 * Main Dashboard Page
 * Routes to role-specific dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuth } from '@/contexts/auth-context';
import HRDashboard from '@/components/dashboards/hr-dashboard';
import CandidateDashboard from '@/components/dashboards/candidate-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if OAuth user needs to select role - redirect to register page
    if (session?.user?.needsRoleSelection) {
      router.push('/register?oauth=true');
    }
  }, [session, router]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {user?.role === 'hr' ? <HRDashboard /> : <CandidateDashboard />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

import DashboardProfilePage from '../dashboard/profile/page';

export default function ProfilePage() {
  // Render client-side profile page. Client will handle redirect to login
  // when the user is not authenticated (checks localStorage / client state).
  return <DashboardProfilePage />;
}

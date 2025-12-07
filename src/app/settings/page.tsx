import DashboardSettingsPage from '../dashboard/settings/page';

export default function SettingsPage() {
  // Render client-side settings page. Client will handle redirect to login
  // when the user is not authenticated (checks localStorage / client state).
  return <DashboardSettingsPage />;
}

// UNUSED COMPONENT - NOT ROUTED IN APP.JSX
// This is a generic dashboard that's not being used in the current routing structure
// The actual dashboards being used are:
// - SuperAdminDashboard (components/superadmin/Dashboard/Dashboard.jsx)
// - RestaurantDashboard (components/restaurant/Dashboard/Dashboard.jsx)

export default function Dashboard() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Generic Dashboard</h1>
      <p className="text-gray-600">This component is not currently used in the routing.</p>
      <p className="text-sm text-gray-500 mt-2">
        Use SuperAdminDashboard or RestaurantDashboard instead.
      </p>
    </div>
  );
}

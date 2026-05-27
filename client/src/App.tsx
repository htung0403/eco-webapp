import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import ModulePage from './pages/ModulePage';
import { moduleRoutes } from './data/moduleData';

const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const AdminHubsPage = lazy(() => import('./pages/admin/AdminHubsPage'));
const AdminTrucksPage = lazy(() => import('./pages/admin/AdminTrucksPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminVendorsPage = lazy(() => import('./pages/admin/AdminVendorsPage'));
const WarehouseOrderNewPage = lazy(() => import('./pages/WarehouseOrderNewPage'));
const WarehouseOrderReceivePage = lazy(() => import('./pages/WarehouseOrderReceivePage'));
const WarehouseInventoryPage = lazy(() => import('./pages/WarehouseInventoryPage'));
const WarehouseIncomingPage = lazy(() => import('./pages/WarehouseIncomingPage'));
const WarehousePriorityPage = lazy(() => import('./pages/WarehousePriorityPage'));
const WarehouseLoadPlanningPage = lazy(() => import('./pages/WarehouseLoadPlanningPage'));
const WarehouseManifestsPage = lazy(() => import('./pages/WarehouseManifestsPage'));
const WarehouseManifestDetailPage = lazy(() => import('./pages/WarehouseManifestDetailPage'));
const DeliveryRoutingPage = lazy(() => import('./pages/DeliveryRoutingPage'));
const DeliveryHandoverPage = lazy(() => import('./pages/DeliveryHandoverPage'));
const DeliveryEnRoutePage = lazy(() => import('./pages/DeliveryEnRoutePage'));
const DeliveryHubDropoffPage = lazy(() => import('./pages/DeliveryHubDropoffPage'));
const DeliveryLastMilePage = lazy(() => import('./pages/DeliveryLastMilePage'));
const DeliveryCodPage = lazy(() => import('./pages/DeliveryCodPage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));
const TripNewPage = lazy(() => import('./pages/TripNewPage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const TripExpensesPage = lazy(() => import('./pages/TripExpensesPage'));
const TripProfitPage = lazy(() => import('./pages/TripProfitPage'));
const TrucksPage = lazy(() => import('./pages/TrucksPage'));
const DriverPerformancePage = lazy(() => import('./pages/DriverPerformancePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SearchWaybillsPage = lazy(() => import('./pages/SearchWaybillsPage'));
const SearchTripsPage = lazy(() => import('./pages/SearchTripsPage'));
const FinanceCodReconciliationPage = lazy(() => import('./pages/FinanceCodReconciliationPage'));
const FinanceHubReconciliationPage = lazy(() => import('./pages/FinanceHubReconciliationPage'));
const FinanceApproveInternalPage = lazy(() => import('./pages/FinanceApproveInternalPage'));
const FinanceApproveVendorPage = lazy(() => import('./pages/FinanceApproveVendorPage'));
const DashboardKpiPage = lazy(() => import('./pages/DashboardKpiPage'));

const ecoRoutes = [
  '/warehouse/inventory',
  '/warehouse/orders/new',
  '/warehouse/orders/:id/receive',
  '/warehouse/incoming',
  '/warehouse/priority',
  '/warehouse/load-planning',
  '/warehouse/manifests',
  '/warehouse/manifests/:id',
  '/delivery/routing',
  '/delivery/handover',
  '/delivery/en-route',
  '/delivery/hub-dropoff',
  '/delivery/last-mile',
  '/delivery/cod',
  '/trips/list',
  '/trips/new',
  '/trips/:id',
  '/trips/:id/expenses',
  '/trips/:id/profit',
  '/trucks',
  '/drivers/performance',
  '/search/general',
  '/search/waybills',
  '/search/trips',
  '/finance/cod-reconciliation',
  '/finance/approve/internal',
  '/finance/approve/vendor',
  '/finance/hub-reconciliation',
  '/dashboard/kpi',
  '/dashboard/overdue',
  '/reports/revenue',
  '/admin/users',
  '/admin/hubs',
  '/admin/trucks',
  '/admin/vendors',
  '/print/waybill/:id',
  '/profile',
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          {moduleRoutes.map((path) => (
            <Route key={path} path={path} element={<ModulePage />} />
          ))}
          {ecoRoutes.map((path) => (
            <Route
              key={path}
              path={path}
              element={(
                <Suspense fallback={null}>
                  {path === '/admin/users' ? <AdminUsersPage /> : path === '/admin/hubs' ? <AdminHubsPage /> : path === '/admin/trucks' ? <AdminTrucksPage /> : path === '/admin/vendors' ? <AdminVendorsPage /> : path === '/warehouse/orders/new' ? <WarehouseOrderNewPage /> : path === '/warehouse/orders/:id/receive' ? <WarehouseOrderReceivePage /> : path === '/warehouse/inventory' ? <WarehouseInventoryPage /> : path === '/warehouse/incoming' ? <WarehouseIncomingPage /> : path === '/warehouse/priority' ? <WarehousePriorityPage /> : path === '/warehouse/load-planning' ? <WarehouseLoadPlanningPage /> : path === '/warehouse/manifests' ? <WarehouseManifestsPage /> : path === '/warehouse/manifests/:id' ? <WarehouseManifestDetailPage /> : path === '/delivery/routing' ? <DeliveryRoutingPage /> : path === '/delivery/handover' ? <DeliveryHandoverPage /> : path === '/delivery/en-route' ? <DeliveryEnRoutePage /> : path === '/delivery/hub-dropoff' ? <DeliveryHubDropoffPage /> : path === '/delivery/last-mile' ? <DeliveryLastMilePage /> : path === '/delivery/cod' ? <DeliveryCodPage /> : path === '/trips/list' ? <TripsPage /> : path === '/trips/new' ? <TripNewPage /> : path === '/trips/:id' ? <TripDetailPage /> : path === '/trips/:id/expenses' ? <TripExpensesPage /> : path === '/trips/:id/profit' ? <TripProfitPage /> : path === '/trucks' ? <TrucksPage /> : path === '/drivers/performance' ? <DriverPerformancePage /> : path === '/search/general' ? <SearchPage /> : path === '/search/waybills' ? <SearchWaybillsPage /> : path === '/search/trips' ? <SearchTripsPage /> : path === '/finance/cod-reconciliation' ? <FinanceCodReconciliationPage /> : path === '/finance/hub-reconciliation' ? <FinanceHubReconciliationPage /> : path === '/finance/approve/internal' ? <FinanceApproveInternalPage /> : path === '/finance/approve/vendor' ? <FinanceApproveVendorPage /> : path === '/dashboard/kpi' ? <DashboardKpiPage /> : <PlaceholderPage /> }
                </Suspense>
              )}
            />
          ))}
          <Route path="*" element={<Navigate to="/warehouse/inventory" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;






















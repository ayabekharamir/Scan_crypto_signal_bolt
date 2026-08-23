import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { NotFoundPage } from '@/pages/NotFoundPage';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ScannerPage = lazy(() =>
  import('@/pages/ScannerPage').then((m) => ({ default: m.ScannerPage }))
);
const AssetDetailPage = lazy(() =>
  import('@/pages/AssetDetailPage').then((m) => ({ default: m.AssetDetailPage }))
);
const WatchlistPage = lazy(() =>
  import('@/pages/WatchlistPage').then((m) => ({ default: m.WatchlistPage }))
);
const PortfolioPage = lazy(() =>
  import('@/pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage }))
);
const JournalPage = lazy(() =>
  import('@/pages/JournalPage').then((m) => ({ default: m.JournalPage }))
);
const AlertsPage = lazy(() =>
  import('@/pages/AlertsPage').then((m) => ({ default: m.AlertsPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const withSuspense = (el: React.ReactNode) => (
  <Suspense fallback={<LoadingScreen />}>{el}</Suspense>
);

const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: '/signin', element: <SignInPage /> },
      { path: '/signup', element: <SignUpPage /> },
    ],
  },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: withSuspense(<DashboardPage />) },
      { path: '/scanner', element: withSuspense(<ScannerPage />) },
      { path: '/assets', element: <Navigate to="/scanner" replace /> },
      { path: '/assets/:symbol', element: withSuspense(<AssetDetailPage />) },
      { path: '/portfolio', element: withSuspense(<PortfolioPage />) },
      { path: '/journal', element: withSuspense(<JournalPage />) },
      { path: '/watchlist', element: withSuspense(<WatchlistPage />) },
      { path: '/alerts', element: withSuspense(<AlertsPage />) },
      { path: '/settings', element: withSuspense(<SettingsPage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);

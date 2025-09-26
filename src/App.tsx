// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/Layout'
import Protected from './components/Protected'
import { ToastProvider } from './components/Toast'
import Spinner from './components/Spinner'

/**
 * Route-based code splitting:
 * These screens are relatively heavy; lazy-load them to reduce initial bundle size.
 */
const Venues = lazy(() => import('./pages/venues/Venues'))
const VenueDetail = lazy(() => import('./pages/venues/VenueDetail'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'))
const ManagerCreateVenue = lazy(() => import('./pages/manager/ManagerCreateVenue'))
// NOTE: the provided file is `ManagerEditVenue.tsx`, so import path reflects that:
const ManagerEditVenue = lazy(() => import('./pages/manager/ManagerEditVenueList'))
const ManagerVenueBookings = lazy(() => import('./pages/manager/ManagerVenueBookings'))

/**
 * App root:
 * - Wraps the app in ToastProvider (portal-based toasts).
 * - Provides top-level Layout (header/footer).
 * - Uses Suspense to show a lightweight loading state during lazy route loads.
 */
export default function App() {
  return (
    <ToastProvider>
      <Layout>
        <Suspense
          fallback={
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          }
        >
          <Routes>
            {/* Home → redirect to /venues */}
            <Route path="/" element={<Navigate to="/venues" replace />} />

            {/* Public routes */}
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Auth-protected profile */}
            <Route
              path="/profile/:name"
              element={
                <Protected>
                  <Profile />
                </Protected>
              }
            />

            {/* Manager-only area */}
            <Route
              path="/manager"
              element={
                <Protected requireManager>
                  <ManagerDashboard />
                </Protected>
              }
            />

            <Route
              path="/manager/venues/new"
              element={
                <Protected requireManager>
                  <ManagerCreateVenue />
                </Protected>
              }
            />

            <Route
              path="/manager/venues/:id/edit"
              element={
                <Protected requireManager>
                  <ManagerEditVenue />
                </Protected>
              }
            />

            <Route
              path="/manager/venues/:id/bookings"
              element={
                <Protected requireManager>
                  <ManagerVenueBookings />
                </Protected>
              }
            />

            {/* Fallback 404 → /venues */}
            <Route path="*" element={<Navigate to="/venues" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </ToastProvider>
  )
}

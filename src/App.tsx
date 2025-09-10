// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Venues from './pages/venues/Venues'
import VenueDetail from './pages/venues/VenueDetail'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Profile from './pages/profile/Profile'
import Protected from './components/Protected'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerCreateVenue from './pages/manager/ManagerCreateVenue'
import ManagerEditVenue from './pages/manager/ManagerEditVenue'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues/:id" element={<VenueDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/profile/:name"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

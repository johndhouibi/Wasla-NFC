import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CustomerTapPage from './pages/CustomerTapPage.jsx'

function NotFound() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center text-sm">
      Page not found.
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/t/:cardCode" element={<CustomerTapPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
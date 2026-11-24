import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CustomerTapPage from './pages/CustomerTapPage.jsx'

function NotFound() {
  return (
    <div className="min-h-screen bg-page text-mute flex items-center justify-center text-sm">
      Page not found.
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/t/:cardCode" element={<CustomerTapPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

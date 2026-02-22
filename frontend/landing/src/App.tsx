import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DementiaPage from './pages/DementiaPage'
import BetaPage from './BetaPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/beta" element={<BetaPage />} />
      <Route path="/dementia" element={<DementiaPage />} />
    </Routes>
  )
}

export default App

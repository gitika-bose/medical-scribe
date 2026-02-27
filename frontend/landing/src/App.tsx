import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DementiaPage from './pages/DementiaPage'
import TryPage from './pages/TryPage'
import BetaPage from './BetaPage'
import AboutUsPage from './pages/AboutUsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/try" element={<TryPage />} />
      <Route path="/beta" element={<BetaPage />} />
      <Route path="/dementia" element={<DementiaPage />} />
      <Route path="/aboutus" element={<AboutUsPage />} />
    </Routes>
  )
}

export default App

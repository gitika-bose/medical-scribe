import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DementiaPage from './pages/DementiaPage'
import ExplainAppRecPage from './pages/ExplainAppRec'
import BetaPage from './BetaPage'
import AboutUsPage from './pages/AboutUsPage'
import ExplainAppPage from './pages/ExplainApp'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/try" element={<ExplainAppRecPage />} />
      <Route path="/try-new" element={<ExplainAppPage />} />
      <Route path="/beta" element={<BetaPage />} />
      <Route path="/dementia" element={<DementiaPage />} />
      <Route path="/aboutus" element={<AboutUsPage />} />
    </Routes>
  )
}

export default App

import { Routes, Route } from 'react-router-dom'
import NewLandingPage from './pages/NewLandingPage'
import DementiaPage from './pages/DementiaPage'
import BetaPage from './BetaPage'
import AboutUsPage from './pages/AboutUsPage'
import ExplainAppPage from './pages/ExplainApp'
import ContactPage from './pages/ContactPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<NewLandingPage />} />
      <Route path="/explain-my-appointment" element={<ExplainAppPage />} />
      <Route path="/beta" element={<BetaPage />} />
      <Route path="/dementia" element={<DementiaPage />} />
      <Route path="/aboutus" element={<AboutUsPage />} />
      <Route path="/contact" element={<ContactPage />} />
    </Routes>
  )
}

export default App

import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DementiaPage from './pages/DementiaPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dementia" element={<DementiaPage />} />
    </Routes>
  )
}

export default App

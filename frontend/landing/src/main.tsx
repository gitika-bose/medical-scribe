import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import TryPage from './pages/TryPage.tsx'
import BetaPage from './BetaPage.tsx'
import DementiaPage from './pages/DementiaPage.tsx'
import AboutUsPage from './pages/AboutUsPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/try" element={<TryPage />} />
        <Route path="/beta" element={<BetaPage />} />
        <Route path="/dementia" element={<DementiaPage />} />
        <Route path="/aboutus" element={<AboutUsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

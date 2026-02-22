import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import BetaPage from './BetaPage.tsx'
import DementiaPage from './pages/DementiaPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/beta" element={<BetaPage />} />
        <Route path="/dementia" element={<DementiaPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

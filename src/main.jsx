import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { normalizePathname } from './seoConfig.js'
import '@fontsource-variable/manrope'
import './index.css'

const root = document.getElementById('root')
const application = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// A shared 404 document may be served at any unknown URL. Only hydrate when
// server and browser rendered the same route; development has no static markup.
if (root.dataset.ssgPath === normalizePathname(window.location.pathname)) {
  hydrateRoot(root, application)
} else {
  createRoot(root).render(application)
}

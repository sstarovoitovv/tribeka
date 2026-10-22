import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import SeoMetadata from './components/SeoMetadata.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ContactsPage from './pages/ContactsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ServicesPage from './pages/ServicesPage.jsx'
import ServiceDetailPage from './pages/ServiceDetailPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import ConsentPage from './pages/ConsentPage.jsx'
import RequestForm from './components/RequestForm.jsx'
import FormStatesPreview from './pages/FormStatesPreview.jsx'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <SeoMetadata />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:serviceSlug" element={<ServiceDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/consent" element={<ConsentPage />} />
          {import.meta.env.DEV && <Route path="/__preview/form-error" element={<section className="bg-mist px-5 py-16"><div className="mx-auto max-w-2xl"><h1 className="text-3xl font-semibold text-ink">Ошибка отправки заявки</h1><RequestForm previewState="error" /></div></section>} />}
          {import.meta.env.DEV && <Route path="/__preview/form-success" element={<section className="bg-mist px-5 py-16"><div className="mx-auto max-w-2xl"><RequestForm previewState="sent" /></div></section>} />}
          {import.meta.env.DEV && <Route path="/__preview/form" element={<FormStatesPreview />} />}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}

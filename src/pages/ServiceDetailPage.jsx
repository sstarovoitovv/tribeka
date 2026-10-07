import { FiArrowLeft } from 'react-icons/fi'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import ContactBand from '../components/ContactBand.jsx'
import PageHero from '../components/PageHero.jsx'
import { findService, getServicePath } from '../serviceRoutes.js'
import NotFoundPage from './NotFoundPage.jsx'

export default function ServiceDetailPage() {
  const { serviceSlug } = useParams()
  const { search, hash } = useLocation()
  const service = findService(serviceSlug)

  if (!service) return <NotFoundPage />
  if (serviceSlug !== service.slug) return <Navigate to={`${getServicePath(service)}${search}${hash}`} replace />

  const photo = service.image

  return (
    <>
      <PageHero
        eyebrow={`Услуга /${service.number}`}
        title={service.title}
        description={service.short}
      />

      <section className="bg-[#f7f7f5] py-16 sm:py-20">
        <div className="container-page">
          <Link to="/services/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-signal transition-colors hover:text-ink">
            <FiArrowLeft size={14} /> Все услуги
          </Link>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <figure>
              <div className="relative overflow-hidden">
                <img
                  src={photo.src}
                  srcSet={`${photo.small} 480w, ${photo.src} 960w`}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  alt={photo.alt}
                  width="960"
                  height="600"
                  decoding="async"
                  className="aspect-[8/5] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-ink/15" aria-hidden="true" />
              </div>
              {photo.license && (
                <figcaption className="mt-3 text-xs leading-5 text-ink/65">
                  <a href={photo.source} target="_blank" rel="noreferrer" className="underline underline-offset-4">{photo.author}</a>
                  {' — '}
                  {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">{photo.license}</a> : photo.license}
                  {'. Изображение уменьшено, переведено в WebP и кадрируется при отображении.'}
                </figcaption>
              )}
            </figure>
            <div className="relative overflow-hidden bg-gradient-to-br from-graphite to-ink p-7 text-white sm:p-9 lg:border-l-2 lg:border-signal/70">
              <div className="absolute -right-24 -top-24 size-64 rounded-full bg-signal/10 blur-3xl" aria-hidden="true" />
              <p className="relative text-[10px] font-black uppercase tracking-[0.22em] text-[#77a7e6]">Возможности производства</p>
              <h2 className="relative mt-4 text-2xl font-black leading-tight tracking-[-0.025em] sm:text-3xl">Описание услуги</h2>
              <p className="relative mt-5 max-w-md text-base leading-7 text-white/80">{service.short}</p>
              {service.details.length > 0 && (
                <ul className="relative mt-8 space-y-3 border-t border-white/15 pt-7 text-sm leading-6 text-white/85">
                  {service.details.map((detail) => <li key={detail} className="ml-4 list-disc marker:text-signal">{detail}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

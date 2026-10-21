import { FiArrowLeft } from 'react-icons/fi'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import ContactBand from '../components/ContactBand.jsx'
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
      <section className="bg-mist pt-6 pb-12 sm:pt-8 sm:pb-16">
        <div className="container-page">
          <Link to="/services/" state={{ restoreCatalog: true, focusService: service.id }} className="inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-widest text-signal transition-colors hover:text-ink">
            <FiArrowLeft size={16} aria-hidden="true" /> Все услуги
          </Link>
          <header className="mt-3 max-w-5xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">Услуга /{service.number}</p>
            <h1 className="mt-3 text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.15] tracking-[-0.035em]">{service.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">{service.short}</p>
          </header>

          <div className="mt-7 rounded-[12px] bg-white p-2 shadow-[0_8px_32px_rgba(7,24,46,0.04)] sm:mt-8 sm:p-3">
            <div className="grid gap-2 sm:gap-3 lg:grid-cols-2">
              <figure className="relative min-w-0 overflow-hidden rounded-[8px] bg-ink/5 lg:min-h-[410px]">
                <img
                  src={photo.src}
                  srcSet={`${photo.small} 480w, ${photo.src} 960w`}
                  sizes="(min-width: 1440px) 656px, (min-width: 1024px) 50vw, 100vw"
                  alt={photo.alt}
                  width="960"
                  height="600"
                  decoding="async"
                  className="block aspect-[8/5] w-full object-cover lg:absolute lg:inset-0 lg:h-full lg:aspect-auto"
                />
              </figure>
              <div className="flex min-w-0 flex-col justify-center rounded-[8px] bg-graphite px-6 py-8 text-white sm:p-8 lg:p-10">
                <h2 className="text-2xl font-bold leading-tight tracking-tight">Описание услуги</h2>
                <div className="mt-5 space-y-4 text-base leading-7 text-white/80">
                  {(service.description ?? [service.short]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </div>
            </div>
          </div>
          {photo.license && (
            <p className="mt-3 text-xs leading-5 text-ink/65">
              <a href={photo.source} target="_blank" rel="noreferrer" className="underline underline-offset-4">{photo.author}</a>
              {' — '}
              {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">{photo.license}</a> : photo.license}
              {'. Изображение уменьшено, переведено в WebP и кадрируется при отображении.'}
            </p>
          )}
        </div>
      </section>

      <ContactBand />
    </>
  )
}

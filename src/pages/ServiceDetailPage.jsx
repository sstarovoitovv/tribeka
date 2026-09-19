import { FiArrowLeft } from 'react-icons/fi'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import ContactBand from '../components/ContactBand.jsx'
import MediaPlaceholder from '../components/MediaPlaceholder.jsx'
import PageHero from '../components/PageHero.jsx'
import { findService, getServicePath } from '../serviceRoutes.js'
import NotFoundPage from './NotFoundPage.jsx'

const workExamples = ['01', '02', '03']

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
              {photo.license && (
                <figcaption className="mt-3 text-xs leading-5 text-ink/65">
                  <a href={photo.source} target="_blank" rel="noreferrer" className="underline underline-offset-4">{photo.author}</a>
                  {' — '}
                  {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">{photo.license}</a> : photo.license}
                  {'. Изображение уменьшено, переведено в WebP и кадрируется при отображении.'}
                </figcaption>
              )}
            </figure>
            <div className="bg-graphite p-7 text-white sm:p-9">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-signal">Возможности производства</p>
              <h2 className="mt-4 text-2xl font-black uppercase leading-tight tracking-tight">Описание услуги</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/80">{service.short}</p>
              {service.details.length > 0 && (
                <ul className="mt-7 space-y-3 border-t border-white/15 pt-6 text-sm leading-6 text-white/85">
                  {service.details.map((detail) => <li key={detail} className="ml-4 list-disc">{detail}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <p className="eyebrow">Портфолио услуги</p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl">Примеры работ</h2>
          <div className="mt-9 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {workExamples.map((number) => (
              <article key={number} className="overflow-hidden border border-ink/10 bg-white">
                <MediaPlaceholder label={`Фото примера ${number}`} compact />
                <div className="p-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-signal">Пример /{number}</p>
                  <h3 className="mt-4 text-xl font-black uppercase tracking-tight">Название работы</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/50">Краткий комментарий о задаче, процессе изготовления и полученном результате.</p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-5">
                    {['Материал', 'Размер', 'Срок'].map((item) => (
                      <span key={item} className="w-fit bg-[#e3e8ef] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-ink/60">{item}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

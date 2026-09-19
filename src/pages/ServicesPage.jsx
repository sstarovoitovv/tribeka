import { Link } from 'react-router-dom'
import { getServicePath } from '../serviceRoutes.js'
import ContactBand from '../components/ContactBand.jsx'
import PageHero from '../components/PageHero.jsx'
import { serviceGroups } from '../data/company.js'

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Услуги"
        title="Каталог услуг"
        description="Основные виды производимых работ и возможности оборудования ТРИБЕКА"
      />

      <section className="bg-[#f7f7f5] py-16 sm:py-20">
        <div className="container-page">
          <div className="mb-9 max-w-2xl">
            <p className="eyebrow">Производственные возможности</p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">Основные виды работ</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {serviceGroups.map(({ id, slug, number, title, short, image }, index) => (
              <Link
                to={getServicePath({ slug })}
                id={id}
                key={number}
                className="group flex scroll-mt-28 flex-col overflow-hidden border border-ink/10 bg-mist transition-colors duration-150 hover:border-signal [&>div]:shrink-0"
                aria-label={`${title}: подробнее об услуге`}
              >
                <img
                  src={image.src}
                  srcSet={`${image.small} 480w, ${image.src} 960w`}
                  sizes="(min-width: 1280px) 420px, (min-width: 768px) 50vw, 100vw"
                  alt={image.alt}
                  width="960"
                  height="600"
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="aspect-[8/5] w-full shrink-0 object-cover"
                />
                <article className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-5">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-ink/70">Услуга /{number}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold leading-tight tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/75">{short}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-signal">
                    Подробнее об услуге
                  </span>
                </article>
              </Link>
            ))}
          </div>
          <details className="mt-8 text-xs leading-6 text-ink/65">
            <summary className="w-fit cursor-pointer underline underline-offset-4">Источники фотографий</summary>
            <p className="mt-3">Фотографии иллюстрируют виды обработки. Изображения уменьшены и переведены в WebP; при отображении кадрируются.</p>
            <ul className="mt-2 space-y-1">
              {serviceGroups.map(({ image }) => image).filter(({ license }) => license).map(({ src, author, source, license, licenseUrl }) => (
                <li key={src}>
                  <a href={source} target="_blank" rel="noreferrer" className="underline underline-offset-4">{author}</a>
                  {' — '}
                  {licenseUrl ? <a href={licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">{license}</a> : license}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

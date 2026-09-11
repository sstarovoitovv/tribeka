import { FiArrowUpRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getServicePath } from '../serviceRoutes.js'
import ContactBand from '../components/ContactBand.jsx'
import MediaPlaceholder from '../components/MediaPlaceholder.jsx'
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
            {serviceGroups.map(({ id, slug, number, title, short, details }) => (
              <Link
                to={getServicePath({ slug })}
                id={id}
                key={number}
                className="group flex scroll-mt-28 flex-col overflow-hidden border border-ink/10 bg-mist transition-colors duration-150 hover:border-signal [&>div]:shrink-0"
                aria-label={`${title}: подробнее об услуге`}
              >
                <MediaPlaceholder label="Фото услуги" compact />
                <article className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-5">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-ink/70">Услуга /{number}</span>
                    <span className="hidden">{number}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold leading-tight tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/75">{short}</p>
                  {details.length > 0 && (
                    <ul className="mt-5 space-y-2 border-t border-ink/10 pt-5 text-sm leading-6 text-ink/75">
                      {details.map((detail) => <li key={detail} className="ml-4 list-disc marker:text-signal">{detail}</li>)}
                    </ul>
                  )}
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-signal">
                    Подробнее об услуге <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" size={14} />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

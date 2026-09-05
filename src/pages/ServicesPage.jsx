import { FiArrowUpRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
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
        description="Шаблон раздела: добавьте фотографии, названия, комментарии и характеристики для каждого направления"
      />

      <section className="bg-[#f7f7f5] py-16 sm:py-20">
        <div className="container-page">
          <div className="mb-9 max-w-2xl">
            <p className="eyebrow">Шаблоны карточек</p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">Заполните своими материалами</h2>
          </div>
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {serviceGroups.map(({ id, number, title, short, details }) => (
              <Link
                to={`/services/${id}/`}
                id={id}
                key={number}
                className="group scroll-mt-28 overflow-hidden border border-ink/10 bg-mist transition-[border-color,transform] duration-500 ease-out hover:-translate-y-1 hover:border-signal/45"
                aria-label={`${title}: открыть примеры работ`}
              >
                <MediaPlaceholder label="Фото услуги" compact />
                <article className="p-6">
                  <div className="flex items-center justify-between gap-5">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ink/35">Услуга /{number}</span>
                    <span className="text-2xl font-black text-signal/25">{number}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-black uppercase leading-tight tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/55">{short}</p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-5">
                    {details.map((detail) => (
                      <span key={detail} className="w-fit max-w-full bg-[#e3e8ef] px-3 py-2 text-[9px] font-bold uppercase leading-4 tracking-wide text-ink/60">
                        {detail}
                      </span>
                    ))}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-signal">
                    Смотреть примеры <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" size={14} />
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

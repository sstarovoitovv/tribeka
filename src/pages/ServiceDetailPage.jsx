import { FiArrowLeft } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import ContactBand from '../components/ContactBand.jsx'
import MediaPlaceholder from '../components/MediaPlaceholder.jsx'
import PageHero from '../components/PageHero.jsx'
import { serviceGroups } from '../data/company.js'
import NotFoundPage from './NotFoundPage.jsx'

const workExamples = ['01', '02', '03']

export default function ServiceDetailPage() {
  const { serviceId } = useParams()
  const service = serviceGroups.find(({ id }) => id === serviceId)

  if (!service) return <NotFoundPage />

  return (
    <>
      <PageHero
        eyebrow={`Услуга /${service.number}`}
        title={service.title}
        description={service.short}
      />

      <section className="bg-[#f7f7f5] py-16 sm:py-20">
        <div className="container-page">
          <Link to="/services" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-signal transition-colors hover:text-ink">
            <FiArrowLeft size={14} /> Все услуги
          </Link>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <MediaPlaceholder label="Основное фото услуги" />
            <div className="bg-graphite p-7 text-white sm:p-9">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-signal">Комментарий</p>
              <h2 className="mt-4 text-2xl font-black uppercase leading-tight tracking-tight">Описание услуги</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/55">Здесь будет подробное описание услуги, производственного процесса и результата, который получает заказчик.</p>
              <div className="mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-6">
                {service.details.map((detail) => (
                  <span key={detail} className="w-fit max-w-full bg-white/10 px-3 py-2 text-[9px] font-bold uppercase leading-4 tracking-wide text-white/70">
                    {detail}
                  </span>
                ))}
              </div>
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

import { Link } from 'react-router-dom'
import { getServicePath } from '../serviceRoutes.js'
import ContactBand from '../components/ContactBand.jsx'
import { advantages, serviceGroups } from '../data/company.js'

export default function HomePage() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-[1600px] lg:min-h-[640px] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="px-5 py-8 sm:px-8 sm:py-16 lg:flex lg:flex-col lg:justify-center lg:py-16 lg:pl-12 xl:pl-16">
            <p className="eyebrow text-white/80">Металлообработка · Санкт-Петербург</p>
            <h1 className="mt-5 max-w-[760px] text-[clamp(2.35rem,5.5vw,5.5rem)] font-black leading-[1.06] tracking-[-0.045em]">
              От идеи<br />до готового изделия<span className="text-signal">.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Изготовим деталь или серийную партию по вашим чертежам. Берём на себя весь цикл — от производства до контроля качества.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/contacts/#request" className="shape-button flex min-h-12 items-center justify-center bg-signal px-6 py-3 text-sm font-bold text-white hover:bg-[#28548f]">
                Рассчитать стоимость
              </Link>
              <Link to="/services/" className="shape-button flex min-h-12 items-center justify-center border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10">
                Наши возможности
              </Link>
            </div>
            <p className="mt-5 border-t border-white/20 pt-4 text-xs leading-6 text-white/75">С 2012 года <span aria-hidden="true" className="mx-2">/</span> Собственное оборудование</p>
          </div>
          <figure className="hero-photo relative min-h-[160px] overflow-hidden sm:min-h-[320px] lg:min-h-full">
            <img src="/hero-cnc.jpg" alt="Обработка металлической детали на станке ЧПУ" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />

          </figure>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow">Основные направления</p>
              <h2 className="mt-5 max-w-4xl text-3xl font-black leading-[1.1] tracking-[-0.035em] sm:text-5xl">Производство<br />полного цикла</h2>
            </div>
            <div className="max-w-md">
              <p className="text-sm leading-6 text-ink/70">Собственный парк оборудования позволяет выполнять заказы разной сложности без привлечения субподрядчиков</p>
              <Link to="/services/" className="mt-5 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-signal">Все услуги <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <ol className="mt-10 grid border-t border-ink/20 md:grid-cols-2 md:gap-x-12">
            {serviceGroups.slice(0, 4).map(({ slug, number, title, short }) => (
              <li key={number} className="border-b border-ink/20">
                <Link to={getServicePath({ slug })} className="service-index group grid grid-cols-[2rem_1fr] gap-4 py-7">
                  <span className="pt-1 text-sm font-semibold tabular-nums text-signal">{number}</span>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight group-hover:text-signal">{title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-6 text-ink/75">{short}</p>
                    <span className="mt-4 inline-block text-sm font-semibold text-signal underline underline-offset-4">Подробнее</span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-graphite py-14 text-white sm:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow text-white/80">Производственная база</p>
            <h2 className="section-title mt-5">Свой парк станков.<br />Полный цикл работ.</h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/80">Токарная, фрезерная, электроэрозионная и шлифовальная обработка, прессовое оборудование — на одной производственной площадке.</p>
            <figure className="mt-8 overflow-hidden bg-white">
              <img src="/brand/equipment-turning.png" alt="Токарный станок производственной площадки ТРИБЕКА" loading="lazy" className="aspect-[4/3] w-full object-contain p-6" />
            </figure>
          </div>
          <div className="lg:pt-10">
            <dl className="divide-y divide-white/20 border-y border-white/20">
              {advantages.map(({ title, text }) => (
                <div key={title} className="py-7 sm:py-9">
                  <dt className="text-xl font-bold tracking-tight">{title}</dt><dd className="mt-3 text-sm leading-7 text-white/80">{text}</dd>
                </div>
              ))}
            </dl>
            <Link to="/about/" className="shape-button mt-7 inline-flex min-h-12 items-center border border-white/35 px-6 py-3 text-sm font-semibold hover:bg-white/10">О компании</Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20" aria-labelledby="order-process-title">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div><p className="eyebrow">Порядок работы</p><h2 id="order-process-title" className="section-title mt-5">Как начинается заказ</h2></div>
            <p className="max-w-lg text-base leading-7 text-ink/75">Для первого обращения достаточно чертежа или описания задачи. Остальные детали уточним вместе.</p>
          </div>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ['Задача', 'Пришлите чертёж или описание. Укажите материал, размеры и количество изделий.'],
              ['Расчёт', 'Уточним требования, подберём технологию и рассчитаем стоимость под ваш проект.'],
              ['Производство', 'Берём на себя изготовление и контроль качества на каждом этапе.'],
            ].map(([title, text], index) => (
              <li key={title} className="border-t-2 border-signal pt-5">
                <span className="text-sm font-semibold tabular-nums text-signal">0{index + 1}</span>
                <h3 className="mt-5 text-2xl font-bold tracking-tight">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-ink/75">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

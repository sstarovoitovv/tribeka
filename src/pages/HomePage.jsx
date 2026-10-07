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
            <p className="eyebrow text-white/80">Комплексная металлообработка с 2012 года</p>
            <h1 className="mt-5 max-w-[760px] text-[clamp(2.35rem,5.5vw,5.5rem)] font-black leading-[1.06] tracking-[-0.045em]">
              От идеи<br />до готового изделия
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Работаем по принципу «одного окна»: берём на себя весь цикл, контролируем качество на каждом этапе и выдаём готовое изделие под ключ
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/contacts/#request" className="shape-button flex min-h-12 items-center justify-center bg-signal px-6 py-3 text-sm font-bold text-white hover:bg-[#28548f]">
                Рассчитать стоимость
              </Link>
              <Link to="/services/" className="shape-button flex min-h-12 items-center justify-center border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10">
                Наши возможности
              </Link>
            </div>
          </div>
          <figure className="hero-photo relative min-h-[160px] overflow-hidden sm:min-h-[320px] lg:min-h-full">
            <img src="/hero-cnc.jpg" alt="Обработка металлической детали на станке ЧПУ" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />

          </figure>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-x-12">
            <div>
              <p className="eyebrow">Основные направления</p>
              <h2 className="mt-5 max-w-4xl text-3xl font-black leading-[1.1] tracking-[-0.035em] sm:text-5xl">Производство<br />полного цикла</h2>
            </div>
            <div className="max-w-lg lg:mt-[37px] lg:pl-12">
              <p className="text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">Собственный парк оборудования позволяет выполнять заказы разной сложности без привлечения субподрядчиков</p>
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

      <section id="technology-partner" className="scroll-mt-24 bg-graphite py-12 text-white sm:py-14">
        <div className="container-page">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-12">
            <div>
              <p className="eyebrow text-white/80">О компании</p>
              <h2 className="section-title mt-5">Технологический<br />партнёр бизнеса</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/80">ТРИБЕКА берёт полную ответственность за производственный результат и работает с чертежами любой сложности, чтобы заказчику не приходилось контролировать разных исполнителей</p>
          </div>
          <div className="mt-7 grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
            <figure className="flex min-w-0 flex-col">
              <div className="partner-equipment">
                <img src="/brand/equipment-turning-cutout.webp" alt="Токарный станок производственной площадки ТРИБЕКА" loading="lazy" className="relative block h-auto max-h-[360px] max-w-full object-contain lg:justify-self-start lg:-translate-x-[16%]" />
              </div>
              <figcaption className="mt-4"><p className="text-xs font-semibold text-white/80">Собственное оборудование</p><p className="mt-2 text-xl font-bold">Без лишних посредников</p></figcaption>
            </figure>
            <div>
              <ul className="divide-y divide-white/20 border-y border-white/20">
                {advantages.map(({ title }) => (
                  <li key={title} className="py-6 sm:py-7 text-xl font-bold tracking-tight">{title}</li>
                ))}
              </ul>
              <Link to="/about/" className="shape-button mt-6 inline-flex min-h-12 items-center border border-white/35 px-6 py-3 text-sm font-semibold hover:bg-white/10">Подробнее о компании</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20" aria-labelledby="advantages-title">
        <div className="container-page">
          <p className="eyebrow">Почему ТРИБЕКА</p>
          <h2 id="advantages-title" className="section-title mt-5">Один партнёр<br />Весь результат</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {advantages.map(({ title, text }, index) => (
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

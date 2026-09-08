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
                Рассчитать стоимость <span aria-hidden="true" className="ml-5">↗</span>
              </Link>
              <Link to="/services/" className="shape-button flex min-h-12 items-center justify-center border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10">
                Наши возможности
              </Link>
            </div>
            <p className="mt-5 border-t border-white/20 pt-4 text-xs leading-6 text-white/75">С 2012 года <span aria-hidden="true" className="mx-2">/</span> Собственное оборудование</p>
          </div>
          <figure className="relative min-h-[160px] overflow-hidden sm:min-h-[320px] lg:min-h-full">
            <img src="/hero-cnc.jpg" alt="Обработка металлической детали на станке ЧПУ" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-ink/90 px-5 py-3 text-xs text-white/90 sm:px-8">ТРИБЕКА / Комплексная металлообработка</figcaption>
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

          <div className="mt-12 grid border-l border-t border-ink/15 md:grid-cols-2 xl:grid-cols-4">
            {serviceGroups.slice(0, 4).map(({ slug, number, title, short }) => (
              <Link to={getServicePath({ slug })} key={number} className="group relative overflow-hidden border-b border-r border-ink/15 bg-mist p-7 transition duration-500 hover:bg-graphite hover:text-white sm:p-8">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-ink/35 group-hover:text-white/35">/{number}</span>
                  <span className="text-4xl font-black text-signal/25">{number}</span>
                </div>
                <div className="mt-8">
                  <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-ink/70 group-hover:text-white/75">{short}</p>
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-signal">Подробнее <span aria-hidden="true">→</span></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-graphite py-16 text-white sm:py-20">
        <div className="container-page grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">О компании</p>
            <h2 className="mt-5 text-3xl font-black leading-[1.1] tracking-[-0.035em] sm:text-5xl">Технологический<br />партнёр бизнеса</h2>
            <p className="mt-7 max-w-lg text-sm leading-7 text-white/75">ТРИБЕКА берёт полную ответственность за производственный результат и работает с чертежами любой сложности, чтобы заказчику не приходилось контролировать разных исполнителей</p>
            <div className="mt-8 grid gap-3">
              {advantages.map(({ title }, index) => (
                <div key={title} className="flex items-center gap-3 border border-white/10 p-4 text-xs font-bold uppercase tracking-wide">
                  <span className="text-signal">0{index + 1}</span> {title}
                </div>
              ))}
            </div>
            <Link to="/about/" className="shape-button mt-8 inline-flex items-center gap-4 border border-white/25 px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:border-white hover:bg-white/5">Подробнее о компании <span aria-hidden="true">→</span></Link>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-white">
              <img src="/brand/equipment-turning.png" alt="Токарный станок производственной площадки ТРИБЕКА" className="h-full w-full object-contain p-4" />
              <div className="absolute bottom-0 left-0 right-0 bg-ink/95 px-6 py-6">
                <div className="flex items-end justify-between border-t border-white/20 pt-5">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">Собственное оборудование</p><p className="mt-2 text-xl font-black uppercase">Без лишних посредников</p></div>
                  <span className="hidden text-3xl font-black text-white/20 sm:block">ЧПУ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f5] py-14 sm:py-20">
        <div className="container-page">
          <p className="eyebrow">Почему ТРИБЕКА</p>
          <h2 className="mt-5 max-w-4xl text-3xl font-black leading-[1.1] tracking-[-0.035em] sm:text-5xl">Один партнёр<br />Весь результат</h2>
          <div className="mt-12 grid gap-px bg-ink/10 lg:grid-cols-3">
            {advantages.map(({ title, text }, index) => (
              <article key={title} className="bg-[#f7f7f5] p-7 sm:p-9">
                <span className="text-5xl font-black text-ink/[0.07]">0{index + 1}</span>
                <h3 className="mt-7 text-lg font-black uppercase">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/70">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

import { Link } from 'react-router-dom'
import ContactBand from '../components/ContactBand.jsx'
import { advantages, serviceGroups } from '../data/company.js'

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[720px] overflow-hidden bg-ink text-white lg:min-h-[calc(100vh-72px)]">
        <img src="/hero-cnc.jpg" alt="Обработка металлической детали на станке ЧПУ" className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="absolute inset-y-0 left-0 w-[58%] bg-[#04101f]/75" />
        <div className="absolute inset-y-0 left-[36%] hidden w-px bg-white/10 lg:block" />
        <div className="container-page relative flex min-h-[720px] items-center py-20 lg:min-h-[calc(100vh-72px)]">
          <div className="max-w-[790px]">
            <p className="eyebrow">Комплексная металлообработка с 2012 года</p>
            <h1 className="mt-7 text-[clamp(2.8rem,7vw,6.6rem)] font-black uppercase leading-[0.88] tracking-[-0.055em]">
              От идеи<br />до готового <span className="text-signal">изделия</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Работаем по принципу «одного окна»: берём на себя весь цикл, контролируем качество на каждом этапе и выдаём готовое изделие под ключ
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/contacts#request" className="shape-button flex items-center justify-center bg-signal px-7 py-5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#28548f]">
                Рассчитать стоимость
              </Link>
              <Link to="/services" className="shape-button flex items-center justify-center gap-4 border border-white/25 px-7 py-5 text-xs font-bold uppercase tracking-[0.15em] hover:border-white hover:bg-white/5">
                Наши возможности
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow">Основные направления</p>
              <h2 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl">Производство<br />полного цикла</h2>
            </div>
            <div className="max-w-md">
              <p className="text-sm leading-6 text-ink/55">Собственный парк оборудования позволяет выполнять заказы разной сложности без привлечения субподрядчиков</p>
              <Link to="/services" className="mt-5 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-signal">Все услуги <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <div className="mt-12 grid border-l border-t border-ink/15 md:grid-cols-2 xl:grid-cols-4">
            {serviceGroups.slice(0, 4).map(({ id, number, title, short }) => (
              <Link to={`/services/${id}`} key={number} className="group relative overflow-hidden border-b border-r border-ink/15 bg-mist p-7 transition duration-500 hover:bg-graphite hover:text-white sm:p-8">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-ink/35 group-hover:text-white/35">/{number}</span>
                  <span className="text-4xl font-black text-signal/25">{number}</span>
                </div>
                <div className="mt-14">
                  <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-ink/55 group-hover:text-white/55">{short}</p>
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
            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl">Технологический<br />партнёр бизнеса</h2>
            <p className="mt-7 max-w-lg text-sm leading-7 text-white/55">ТРИБЕКА берёт полную ответственность за производственный результат и работает с чертежами любой сложности, чтобы заказчику не приходилось контролировать разных исполнителей</p>
            <div className="mt-8 grid gap-3">
              {advantages.map(({ title }, index) => (
                <div key={title} className="flex items-center gap-3 border border-white/10 p-4 text-xs font-bold uppercase tracking-wide">
                  <span className="text-signal">0{index + 1}</span> {title}
                </div>
              ))}
            </div>
            <Link to="/about" className="shape-button mt-8 inline-flex items-center gap-4 border border-white/25 px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:border-white hover:bg-white/5">Подробнее о компании <span aria-hidden="true">→</span></Link>
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

      <section className="bg-[#f7f7f5] py-20 sm:py-28">
        <div className="container-page">
          <p className="eyebrow">Почему ТРИБЕКА</p>
          <h2 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl">Один партнёр<br />Весь результат</h2>
          <div className="mt-12 grid gap-px bg-ink/10 lg:grid-cols-3">
            {advantages.map(({ title, text }, index) => (
              <article key={title} className="bg-[#f7f7f5] p-7 sm:p-9">
                <span className="text-5xl font-black text-ink/[0.07]">0{index + 1}</span>
                <h3 className="mt-12 text-lg font-black uppercase">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/50">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

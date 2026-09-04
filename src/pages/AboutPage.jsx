import ContactBand from '../components/ContactBand.jsx'
import PageHero from '../components/PageHero.jsx'
import { advantages } from '../data/company.js'
import { siteConfig } from '../siteConfig.js'

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="О компании"
        title="Берём ответственность за результат"
        description="С 2012 года ТРИБЕКА оказывает услуги комплексной металлообработки и выпускает готовые изделия по принципу одного окна"
      />

      <section className="bg-[#f7f7f5] py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="eyebrow">Технологический партнёр</p>
            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-5xl">Производство под ключ</h2>
          </div>
          <div className="max-w-3xl">
            <p className="text-xl font-bold leading-8 text-ink sm:text-2xl">Вы получаете готовое изделие под ключ, а мы берём на себя контроль качества на каждом этапе</p>
            <p className="mt-6 text-base leading-8 text-ink/55">Работаем с чертежами любой сложности. Результат соответствует техническому заданию заказчика — без необходимости самостоятельно координировать разных исполнителей и контролировать каждую промежуточную операцию</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page">
          <p className="eyebrow">Наши преимущества</p>
          <h2 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl">Один подрядчик<br />на весь цикл</h2>
          <div className="mt-12 grid gap-px bg-ink/10 lg:grid-cols-3">
            {advantages.map(({ title, text }, index) => (
                <article key={title} className="bg-white p-8 sm:p-10">
                  <div className="flex items-start justify-between"><span className="text-[10px] font-black tracking-[0.2em] text-ink/25">/0{index + 1}</span><span className="text-4xl font-black text-signal/25">0{index + 1}</span></div>
                  <h3 className="mt-24 text-xl font-black uppercase">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-ink/50">{text}</p>
                </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f5] py-20 sm:py-28">
        <div className="container-page">
          <div className="relative min-h-[520px] overflow-hidden bg-white bg-contain bg-center bg-no-repeat px-7 py-10 sm:px-12 sm:py-14 lg:aspect-video lg:min-h-0 lg:px-16" style={{ backgroundImage: "url('/brand/tribeka-background.jpg')" }}>
            <div className="relative mt-24 max-w-xl border border-ink/10 bg-white p-7 sm:mt-28 sm:p-10">
              <span className="text-4xl font-black text-signal/25">01</span>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-signal">Главный принцип</p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">Честность в сроках и цене</h2>
              <p className="mt-5 text-sm leading-7 text-ink/55">Каждый проект рассчитывается индивидуально с учётом материала, геометрии и необходимых операций. Заказчик заранее понимает состав работ и получает честную стоимость без скрытых наценок</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-graphite py-14 text-white sm:py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">Реквизиты</p>
            <h2 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-5xl">{siteConfig.legalName}</h2>
          </div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {[
              ['Год основания', siteConfig.founded],
              ['ОГРН', siteConfig.ogrn],
              ['ИНН', siteConfig.inn],
              ['Город', 'Санкт-Петербург'],
            ].map(([label, value]) => (
              <div key={label} className="bg-graphite p-6"><p className="text-[9px] font-bold uppercase tracking-widest text-white/35">{label}</p><p className="mt-3 text-lg font-black">{value}</p></div>
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

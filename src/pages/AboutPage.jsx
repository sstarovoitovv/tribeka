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

      <section className="bg-[#f7f7f5] py-12 sm:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-y-5">
          <div className="lg:contents">
            <p className="eyebrow lg:col-start-1 lg:row-start-1">Технологический партнёр</p>
            <h2 className="mt-5 section-title lg:col-start-1 lg:row-start-2 lg:mt-0">Производство под ключ</h2>
          </div>
          <div className="max-w-3xl lg:col-start-2 lg:row-start-2">
            <p className="text-xl font-bold leading-8 text-ink sm:text-2xl">Вы получаете готовое изделие под ключ, а мы берём на себя контроль качества на каждом этапе</p>
            <p className="mt-4 text-base leading-7 text-ink/70">Работаем с чертежами любой сложности. Результат соответствует техническому заданию заказчика — без необходимости самостоятельно координировать разных исполнителей и контролировать каждую промежуточную операцию</p>
          </div>
        </div>
      </section>

      <section className="bg-mist py-6 sm:py-8" aria-labelledby="principle-title">
        <div className="container-page">
          <div className="relative isolate overflow-hidden rounded-[10px] bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <img src="/brand/tribeka-mark.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 -z-10 hidden w-[460px] max-w-none opacity-[0.06] sm:block" />
            <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute bottom-px right-0 top-[25.25px] hidden w-px bg-ink/10 lg:block" />
            <div className="flex items-center gap-8 sm:gap-12">
              <img src={siteConfig.logoSrc} width="267" height="71" alt="ТРИБЕКА" className="h-auto w-[190px] shrink-0" />
              <div aria-hidden="true" className="h-px flex-1 bg-ink/10" />
            </div>
            <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:pr-8">
              <div>
                <p className="eyebrow">Главный принцип</p>
                <h2 id="principle-title" className="mt-5 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-[2.75rem]">Честность в сроках и цене</h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-ink/75 sm:text-lg sm:leading-8">Каждый проект рассчитывается индивидуально с учётом материала, геометрии и необходимых операций. Заказчик заранее понимает состав работ и получает честную стоимость без скрытых наценок</p>
            </div>
            <div aria-hidden="true" className="mt-10 flex items-center gap-2 lg:mt-14">
              <span className="h-[2px] w-16 bg-signal" /><span className="h-px flex-1 bg-ink/10" />
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div className="container-page">
          <p className="eyebrow">Наши преимущества</p>
          <h2 className="mt-5 max-w-4xl section-title">Один подрядчик<br />на весь цикл</h2>
          <dl className="mt-7 divide-y divide-ink/20 border-y border-ink/20">
            {advantages.map(({ title, text }) => (
              <div key={title} className="grid gap-4 py-6 md:grid-cols-[0.8fr_1.2fr]">
                <dt className="text-xl font-bold">{title}</dt>
                <dd className="max-w-2xl text-base leading-7 text-ink/75">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-graphite py-12 text-white sm:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow text-white/85 before:bg-[#7faee9]">Реквизиты</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{siteConfig.legalName}</h2>
          </div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {[
              ['Год основания', siteConfig.founded],
              ['ОГРН', siteConfig.ogrn],
              ['ИНН', siteConfig.inn],
              ['Город', 'Санкт-Петербург'],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 bg-graphite p-6"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/85 sm:text-[13px]">{label}</p><p className="mt-3 font-display text-lg font-medium tabular-nums leading-7">{value}</p></div>
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  )
}

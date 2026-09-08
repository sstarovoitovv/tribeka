import { FiArrowUpRight, FiBriefcase, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import PageHero from '../components/PageHero.jsx'
import RequestForm from '../components/RequestForm.jsx'
import ContactLinks from '../components/ContactLinks.jsx'
import { siteConfig } from '../siteConfig.js'

export default function ContactsPage() {
  return (
    <>
      <PageHero
        eyebrow="Контакты"
        title="Обсудим ваш проект"
        description="Пришлите чертёж или опишите задачу. Уточним требования, подберём технологию и подготовим индивидуальный расчёт"
      />

      <section className="bg-[#f7f7f5] py-10 sm:py-14">
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow">Связаться с нами</p>
            <h2 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-5xl">ТРИБЕКА</h2>
            <div className="mt-10 grid gap-px bg-ink/10">
              <a href={`tel:${siteConfig.phoneHref}`} className="group flex items-center justify-between gap-5 border border-transparent bg-mist p-6 transition-[background-color,border-color] duration-500 ease-in-out hover:border-signal/25 hover:bg-[#e3e7ed]">
                <span className="flex items-center gap-4"><FiPhone className="text-signal" size={22} /><span><span className="block text-[11px] font-bold uppercase tracking-widest text-ink/70">Телефон</span><span className="mt-1 block text-base font-black">{siteConfig.phone}</span></span></span><FiArrowUpRight className="transition-transform duration-500 ease-in-out group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </a>
              <a href={`mailto:${siteConfig.email}`} className="group flex items-center justify-between gap-5 border border-transparent bg-mist p-6 transition-[background-color,border-color] duration-500 ease-in-out hover:border-signal/25 hover:bg-[#e3e7ed]">
                <span className="flex items-center gap-4"><FiMail className="text-signal" size={22} /><span><span className="block text-[11px] font-bold uppercase tracking-widest text-ink/70">Электронная почта</span><span className="mt-1 block text-base font-black">{siteConfig.email}</span></span></span><FiArrowUpRight className="transition-transform duration-500 ease-in-out group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </a>
              <a href="https://yandex.ru/maps/?text=Санкт-Петербург%2C%20улица%20Возрождения%2C%2024" target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-5 border border-transparent bg-mist p-6 transition-[background-color,border-color] duration-500 ease-in-out hover:border-signal/25 hover:bg-[#e3e7ed]">
                <span className="flex items-center gap-4"><FiMapPin className="shrink-0 text-signal" size={22} /><span><span className="block text-[11px] font-bold uppercase tracking-widest text-ink/70">Адрес</span><span className="mt-1 block text-sm font-black leading-6">{siteConfig.address}</span></span></span><FiArrowUpRight className="shrink-0 transition-transform duration-500 ease-in-out group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </a>
            </div>
            <div className="mt-7 flex flex-col items-center text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/70">Написать удобным способом</p>
              <ContactLinks className="mt-4" />
            </div>
          </div>

          <div id="request" className="order-first min-w-0 scroll-mt-24 lg:order-none">
            <div className="border-t-4 border-signal bg-white p-6 pb-0 sm:p-9 sm:pb-0">
              <p className="eyebrow">Заявка на расчёт</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">Расскажите о задаче</h2>
              <p className="mt-3 text-sm leading-6 text-ink/70">Укажите материал, количество и основные размеры. При необходимости сразу приложите чертёж или фотографии</p>
            </div>
            <RequestForm />
          </div>
        </div>
      </section>

      <section className="border-t border-ink/15 bg-mist py-8">
        <div className="container-page flex flex-wrap items-center gap-x-10 gap-y-4 text-sm leading-6 text-ink/70">
          <p className="w-full text-xs font-semibold uppercase tracking-wider">Юридическая информация</p>
          <p className="flex items-center gap-3 font-bold text-ink"><FiBriefcase className="text-signal" aria-hidden="true" /> {siteConfig.legalName}</p>
          <p>ОГРН {siteConfig.ogrn}</p><p>ИНН {siteConfig.inn}</p>
        </div>
      </section>
    </>
  )
}

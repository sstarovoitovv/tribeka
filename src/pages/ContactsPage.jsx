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

      <section className="bg-[#f7f7f5] py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Связаться с нами</p>
            <h2 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-5xl">ТРИБЕКА</h2>
            <div className="mt-10 grid gap-px bg-ink/10">
              <a href={`tel:${siteConfig.phoneHref}`} className="group flex items-center justify-between gap-5 border border-transparent bg-mist p-6 transition-[background-color,border-color] duration-500 ease-in-out hover:border-signal/25 hover:bg-[#e3e7ed]">
                <span className="flex items-center gap-4"><FiPhone className="text-signal" size={22} /><span><span className="block text-[9px] font-bold uppercase tracking-widest text-ink/35">Телефон</span><span className="mt-1 block text-base font-black">{siteConfig.phone}</span></span></span><FiArrowUpRight className="transition-transform duration-500 ease-in-out group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </a>
              <a href={`mailto:${siteConfig.email}`} className="group flex items-center justify-between gap-5 border border-transparent bg-mist p-6 transition-[background-color,border-color] duration-500 ease-in-out hover:border-signal/25 hover:bg-[#e3e7ed]">
                <span className="flex items-center gap-4"><FiMail className="text-signal" size={22} /><span><span className="block text-[9px] font-bold uppercase tracking-widest text-ink/35">Электронная почта</span><span className="mt-1 block text-base font-black">{siteConfig.email}</span></span></span><FiArrowUpRight className="transition-transform duration-500 ease-in-out group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </a>
              <a href="https://yandex.ru/maps/?text=Санкт-Петербург%2C%20улица%20Возрождения%2C%2024" target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-5 border border-transparent bg-mist p-6 transition-[background-color,border-color] duration-500 ease-in-out hover:border-signal/25 hover:bg-[#e3e7ed]">
                <span className="flex items-center gap-4"><FiMapPin className="shrink-0 text-signal" size={22} /><span><span className="block text-[9px] font-bold uppercase tracking-widest text-ink/35">Адрес</span><span className="mt-1 block text-sm font-black leading-6">{siteConfig.address}</span></span></span><FiArrowUpRight className="shrink-0 transition-transform duration-500 ease-in-out group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </a>
            </div>
            <div className="mt-7 flex flex-col items-center text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink/35">Написать удобным способом</p>
              <ContactLinks className="mt-4" />
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/brand/tribeka-mark.jpg')" }}>
            <div className="absolute inset-0 bg-ink/20" />
            <div className="absolute bottom-6 left-6 right-6 border border-ink/10 bg-white p-6 sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-sm">
              <FiBriefcase size={25} className="text-signal" />
              <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-ink/35">Юридическая информация</p>
              <p className="mt-2 font-black">{siteConfig.legalName}</p>
              <p className="mt-2 text-xs leading-5 text-ink/50">ОГРН {siteConfig.ogrn}<br />ИНН {siteConfig.inn}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="request" className="relative overflow-hidden bg-ink py-12 text-white sm:py-14">
        <div className="container-page relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-center text-center">
            <p className="eyebrow justify-center">Заявка на расчёт</p>
            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl">Расскажите<br />о задаче</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/50">Укажите материал, количество и основные размеры. При необходимости сразу приложите чертёж или фотографии</p>
          </div>
          <div className="w-full">
            <RequestForm />
          </div>
        </div>
      </section>
    </>
  )
}

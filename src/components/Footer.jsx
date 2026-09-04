import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import ContactLinks from './ContactLinks.jsx'
import { siteConfig } from '../siteConfig.js'

export default function Footer() {
  const mapLink = 'https://yandex.ru/maps/?ll=30.274608%2C59.881932&z=17&pt=30.274608%2C59.881932%2Cpm2rdm'
  const mapEmbed = 'https://yandex.ru/map-widget/v1/?ll=30.274608%2C59.881932&z=17&pt=30.274608%2C59.881932%2Cpm2rdm'

  return (
    <footer className="bg-[#04101f] py-10 text-white">
      <div className="container-page">
        {/* На xl пять равных колонок: логотип, разделы, связь, адрес, карта. */}
        <div className="grid gap-9 border-b border-white/10 pb-9 lg:grid-cols-2 lg:items-start lg:gap-7 xl:grid-cols-5 xl:gap-7">
          <div>
            <span className="inline-block bg-white px-3 py-2"><Logo compact /></span>
            <p className="mt-5 max-w-xs text-xs leading-5 text-white/40">Комплексная металлообработка под ключ: от идеи и чертежа до готового изделия</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Разделы</p>
            <div className="mt-4 grid gap-3 text-xs font-bold text-white/65">
              <Link to="/about" className="hover:text-white">О компании</Link>
              <Link to="/services" className="hover:text-white">Услуги</Link>
              <Link to="/contacts" className="hover:text-white">Контакты</Link>
              <Link to="/privacy" className="hover:text-white">Обработка данных</Link>
              <Link to="/consent" className="hover:text-white">Согласие</Link>
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Связаться</p>
            <a href={`tel:${siteConfig.phoneHref}`} className="mt-4 flex items-center justify-center gap-3 text-sm font-bold hover:text-signal"><FiPhone size={15} /> {siteConfig.phone}</a>
            <a href={`mailto:${siteConfig.email}`} className="mt-3 flex items-center justify-center gap-3 text-sm font-bold hover:text-signal"><FiMail size={15} /> {siteConfig.email}</a>
            <ContactLinks dark className="mt-5" />
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Адрес</p>
            <p className="mt-4 flex items-start justify-center gap-3 text-sm leading-6 text-white/65">
              <FiMapPin size={18} className="mt-0.5 shrink-0 text-signal" />
              <span className="text-left">{siteConfig.address}</span>
            </p>
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className="shape-button mt-3 inline-flex w-[216px] items-center justify-center border border-white/15 bg-white/10 px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white hover:border-signal hover:bg-signal"
            >
              Открыть карту
            </a>
          </div>
          {/* xl:h-[149px] + рамка 2px совмещают низ карты с низом иконок связи. */}
          <div className="overflow-hidden rounded-[5px] border border-white/15 bg-white">
            <iframe
              title="ТРИБЕКА на Яндекс Картах"
              src={mapEmbed}
              className="block h-[220px] w-full border-0 lg:h-[180px] xl:h-[149px]"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-[10px] uppercase tracking-widest text-white/25 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.legalName}. Все права защищены.</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1"><span>ОГРН {siteConfig.ogrn}</span><span>ИНН {siteConfig.inn}</span></p>
        </div>
      </div>
    </footer>
  )
}

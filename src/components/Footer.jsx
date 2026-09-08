import { Link } from 'react-router-dom'
import { FiMapPin } from 'react-icons/fi'
import Logo from './Logo.jsx'
import ContactLinks from './ContactLinks.jsx'
import { siteConfig } from '../siteConfig.js'

export default function Footer() {
  const mapLink = 'https://yandex.ru/maps/?ll=30.274608%2C59.881932&z=17&pt=30.274608%2C59.881932%2Cpm2rdm'
  const mapEmbed = 'https://yandex.ru/map-widget/v1/?ll=30.274608%2C59.881932&z=17&pt=30.274608%2C59.881932%2Cpm2rdm'

  return (
    <footer className="bg-ink py-10 text-white sm:py-12">
      <div className="container-page">
        <div className="flex flex-col gap-8 border-b border-white/20 pb-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <span className="w-fit shrink-0 bg-white px-3 py-2"><Logo compact /></span>
            <p className="max-w-sm text-sm leading-6 text-white/80">Комплексная металлообработка под ключ: от идеи и чертежа до готового изделия</p>
          </div>
          <a href={`tel:${siteConfig.phoneHref}`} className="w-fit text-xl font-bold tracking-tight transition-colors hover:text-white/80 sm:text-2xl">{siteConfig.phone}</a>
        </div>
        <div className="grid gap-8 border-b border-white/20 py-9 sm:grid-cols-2 xl:grid-cols-[0.8fr_1.2fr_1fr_1fr]">
          <nav aria-label="Разделы в подвале">
            <p className="footer-label">Разделы</p>
            <div className="mt-3 flex flex-col items-start text-sm">
              {[['О компании', '/about/'], ['Услуги', '/services/'], ['Контакты', '/contacts/'], ['Обработка данных', '/privacy/'], ['Согласие', '/consent/']].map(([label, to]) => (
                <Link key={to} to={to} className="inline-flex min-h-7 items-center text-white/90 underline-offset-4 hover:underline">{label}</Link>
              ))}
            </div>
          </nav>
          <div>
            <p className="footer-label">Связаться</p>
            <a href={`mailto:${siteConfig.email}`} className="mt-3 inline-flex min-h-11 items-center text-base font-semibold underline-offset-4 hover:underline">{siteConfig.email}</a>
            <ContactLinks dark includeEmail={false} className="mt-4" />
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="footer-label">Адрес</p>
            <address className="mt-4 flex w-full max-w-[240px] items-start gap-3 text-left text-sm not-italic leading-6 text-white/85">
              <FiMapPin size={18} className="mt-1 shrink-0 text-signal" aria-hidden="true" />
              <span>{siteConfig.address.replace('корп. ', 'корп.\u00a0')}</span>
            </address>
            <a href={mapLink} target="_blank" rel="noreferrer" className="shape-button mt-4 inline-flex min-h-11 w-full max-w-[216px] items-center justify-center border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:border-signal hover:bg-signal">Открыть карту</a>
          </div>
          <div className="overflow-hidden self-start rounded-[5px] border border-white/15 bg-white">
            <iframe
              title="ТРИБЕКА на Яндекс Картах"
              src={mapEmbed}
              className="block h-[220px] w-full border-0 lg:h-[180px] xl:h-[149px]"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs leading-6 text-white/75 sm:flex-row sm:flex-wrap sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.legalName}. Все права защищены.</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1"><span>ОГРН {siteConfig.ogrn}</span><span>ИНН {siteConfig.inn}</span></p>
        </div>
      </div>
    </footer>
  )
}

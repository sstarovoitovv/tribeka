import { FiPhone } from 'react-icons/fi'
import { MdEmail } from 'react-icons/md'
import { SiTelegram, SiWhatsapp } from 'react-icons/si'
import { siteConfig } from '../siteConfig.js'

const contacts = [
  { label: 'Почта', href: `mailto:${siteConfig.email}`, icon: MdEmail, iconClass: 'text-[#3976c4]' },
  { label: 'WhatsApp', href: siteConfig.whatsappUrl, icon: SiWhatsapp, iconClass: 'text-[#25d366]' },
  { label: 'Telegram', href: siteConfig.telegramUrl, icon: SiTelegram, iconClass: 'text-[#26a5e4]' },
  { label: 'MAX', href: siteConfig.maxUrl, image: '/brand/max-messenger.svg' },
]

export default function ContactLinks({ dark = false, header = false, labeled = false, includeEmail = true, includePhone = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Каналы связи">
      {includePhone && (
        <a href={`tel:${siteConfig.phoneHref}`} aria-label={`Позвонить: ${siteConfig.phone}`} className="group inline-flex min-h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[5px] text-sm font-semibold text-signal transition-[width,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-[184px] hover:bg-signal/10 focus-visible:w-[184px] focus-visible:bg-signal/10">
          <FiPhone size={20} className="shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-2 group-focus-visible:-translate-x-2" aria-hidden="true" />
          <span className="max-w-0 -translate-x-2 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,transform,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1 group-hover:max-w-36 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:ml-1 group-focus-visible:max-w-36 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">{siteConfig.phone}</span>
        </a>
      )}
      {contacts.filter(contact => includeEmail || contact.label !== 'Почта').map(({ label, href, icon: Icon, image, iconClass }) => {
        const style = `inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[5px] text-sm font-semibold transition-colors duration-150 ${labeled ? 'px-3' : 'w-11'} ${dark ? 'border border-white/25 text-white/90 hover:bg-white/10' : header ? 'text-signal hover:bg-signal/10' : 'border border-ink/20 text-signal hover:bg-signal/10'}`
        const content = <>{Icon ? <Icon size={20} className={iconClass} aria-hidden="true" /> : <img src={image} alt="" className="size-5" />}{labeled && <span>{label}</span>}</>
        return href ? (
          <a key={label} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" className={style} title={label} aria-label={`Написать: ${label}`}>{content}</a>
        ) : (
          <span key={label} className={`${style} cursor-not-allowed opacity-60`} aria-disabled="true" aria-label={`${label}: ссылка пока не указана`}>{content}</span>
        )
      })}
    </div>
  )
}

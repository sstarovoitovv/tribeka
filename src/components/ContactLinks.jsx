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
    <div className={`relative flex items-center gap-2 ${className}`} aria-label="Каналы связи">
      {includePhone && (
        <a href={`tel:${siteConfig.phoneHref}`} aria-label={`Позвонить: ${siteConfig.phone}`} className="group absolute right-[calc(100%+0.5rem)] top-1/2 z-10 inline-flex min-h-11 w-11 -translate-y-1/2 items-center justify-end gap-0 overflow-hidden rounded-[5px] pr-3 text-sm font-semibold text-signal transition-[width,gap] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-[184px] hover:gap-2 focus-visible:w-[184px] focus-visible:gap-2 focus-visible:outline-none focus-visible:shadow-none">
          <span className="grid size-5 shrink-0 place-items-center rounded-[3px] transition-shadow duration-200 group-focus-visible:ring-2 group-focus-visible:ring-signal/60 group-focus-visible:ring-offset-2"><FiPhone size={20} aria-hidden="true" /></span>
          <span className="max-w-0 shrink-0 overflow-hidden whitespace-nowrap text-[13px] font-bold text-ink/85 opacity-0 transition-[max-width,opacity,color] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:max-w-[132px] hover:text-signal hover:underline hover:decoration-signal hover:underline-offset-4 group-hover:max-w-[132px] group-hover:opacity-100 group-focus-visible:max-w-[132px] group-focus-visible:opacity-100">{siteConfig.phone}</span>
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

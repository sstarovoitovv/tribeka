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
        <a href={`tel:${siteConfig.phoneHref}`} aria-label={`Позвонить: ${siteConfig.phone}`} className="group absolute right-[calc(100%+0.5rem)] top-1/2 z-10 inline-flex min-h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[5px] text-sm font-semibold text-signal transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-signal/10 focus-visible:bg-signal/10">
          <FiPhone size={20} className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-[126px] group-focus-visible:-translate-x-[126px]" aria-hidden="true" />
          <span className="pointer-events-none absolute right-0 top-1/2 flex h-11 w-[138px] -translate-y-1/2 translate-x-2 items-center justify-end whitespace-nowrap text-[13px] font-bold text-ink opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">{siteConfig.phone}</span>
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

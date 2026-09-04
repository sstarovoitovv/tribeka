import { MdEmail } from 'react-icons/md'
import { SiTelegram, SiWhatsapp } from 'react-icons/si'
import { siteConfig } from '../siteConfig.js'

const contacts = [
  {
    label: 'Почта',
    href: `mailto:${siteConfig.email}`,
    icon: MdEmail,
    iconClass: 'text-[#3976c4]',
  },
  {
    label: 'WhatsApp',
    href: siteConfig.whatsappUrl,
    icon: SiWhatsapp,
    iconClass: 'text-[#25d366]',
  },
  {
    label: 'Telegram',
    href: siteConfig.telegramUrl,
    icon: SiTelegram,
    iconClass: 'text-[#26a5e4]',
  },
  {
    label: 'MAX',
    href: siteConfig.maxUrl,
    image: '/brand/max-messenger.svg',
  },
]

export default function ContactLinks({ dark = false, header = false, labeled = false, className = '' }) {
  const dimensions = header ? 'size-12' : labeled ? 'h-[72px] w-full' : 'size-12'
  const surface = labeled
    ? ''
    : dark
      ? 'border border-white/15 bg-white/10 hover:border-signal hover:bg-signal'
      : 'border border-ink/10 bg-[#e3e7ed] hover:border-signal hover:bg-signal'
  const shape = labeled
    ? ''
    : 'rounded-[5px] transition-[border-radius,background-color,border-color] duration-500 ease-in-out hover:rounded-[50%]'
  const baseClass = `group flex shrink-0 flex-col items-center justify-center gap-1.5 ${dimensions} ${surface} ${shape}`

  return (
    <div className={`${labeled ? 'grid w-full grid-cols-4 gap-2' : 'flex items-center justify-center gap-2'} ${className}`} aria-label="Каналы связи">
      {contacts.map(({ label, href, icon: Icon, image, iconClass = '' }) => {
        const content = (
          <>
            <span className={`grid place-items-center ${labeled ? `size-10 rounded-[5px] border transition-[border-radius,background-color,border-color] duration-500 ease-in-out group-hover:rounded-[50%] group-hover:border-signal group-hover:bg-signal ${dark ? 'border-white/15 bg-white/10' : 'border-ink/10 bg-[#e3e7ed]'}` : 'size-6'} ${iconClass} transition-colors duration-500 ease-in-out group-hover:text-white [&>svg]:size-6`}>
              {Icon && <Icon aria-hidden="true" />}
              {image && <img src={image} alt="" className={`${labeled ? 'size-6' : 'size-full'} transition-[filter] duration-500 ease-in-out group-hover:brightness-0 group-hover:invert`} />}
            </span>
            {labeled && <span className={`text-[8px] font-black uppercase tracking-wider ${dark ? 'text-white/70' : 'text-ink/60'}`}>{label}</span>}
          </>
        )

        if (!href) {
          return (
            <span key={label} className={`${baseClass} cursor-not-allowed opacity-65`} title={`${label}: добавьте ссылку профиля в siteConfig.js`} aria-label={`${label}: ссылка пока не указана`}>
              {content}
            </span>
          )
        }

        return (
          <a key={label} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" className={baseClass} title={label} aria-label={`Написать: ${label}`}>
            {content}
          </a>
        )
      })}
    </div>
  )
}

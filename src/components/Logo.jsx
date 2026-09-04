import { siteConfig } from '../siteConfig.js'
import { Link } from 'react-router-dom'

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="inline-flex items-center" aria-label={`${siteConfig.companyName} — на главную`}>
      <img
        src={siteConfig.logoSrc}
        alt={`${siteConfig.companyName} — комплексная металлообработка`}
        className={`block h-auto object-contain ${compact ? 'w-[164px] max-w-full' : 'w-[190px] max-w-full'}`}
      />
    </Link>
  )
}

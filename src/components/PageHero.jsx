import { Link } from 'react-router-dom'

export default function PageHero({ eyebrow, title, description }) {
  return (
    <section className="border-b border-white/10 bg-ink py-10 text-white sm:py-12">
      <div className="container-page">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
          <Link to="/" className="hover:text-white">Главная</Link><span className="text-white/20">/</span><span className="text-white/90">{eyebrow}</span>
        </div>
        <h1 className="mt-8 max-w-5xl text-[clamp(1.65rem,7vw,3.5rem)] font-black leading-[1.1] tracking-[-0.05em] [hyphens:none] [overflow-wrap:normal] [word-break:normal]">{title}</h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">{description}</p>
      </div>
    </section>
  )
}

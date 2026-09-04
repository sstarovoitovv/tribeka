import { Link } from 'react-router-dom'

export default function PageHero({ eyebrow, title, description }) {
  return (
    <section className="border-b border-white/10 bg-ink py-14 text-white sm:py-16">
      <div className="container-page">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
          <Link to="/" className="hover:text-white">Главная</Link><span className="text-white/20">/</span><span className="text-signal">{eyebrow}</span>
        </div>
        <h1 className="mt-8 max-w-5xl text-[clamp(1.45rem,8.1vw,4.25rem)] font-black uppercase leading-[0.94] tracking-[-0.05em] [hyphens:none] [overflow-wrap:normal] [word-break:normal]">{title}</h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">{description}</p>
      </div>
    </section>
  )
}

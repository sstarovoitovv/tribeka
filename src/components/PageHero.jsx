import { Link } from 'react-router-dom'

export default function PageHero({ eyebrow, title, description }) {
  return (
    <section className="border-b border-white/10 bg-ink py-8 text-white sm:py-10">
      <div className="container-page">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
          <Link to="/" className="hover:text-white">Главная</Link><span className="text-white/20">/</span><span className="text-white/90">{eyebrow}</span>
        </div>
        <h1 className="mt-6 max-w-5xl text-[clamp(1.65rem,6vw,3rem)] font-semibold leading-[1.14] tracking-[-0.025em] [hyphens:none] [overflow-wrap:normal] [word-break:normal]">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">{description}</p>
      </div>
    </section>
  )
}

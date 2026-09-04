import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="grid min-h-[65vh] place-items-center bg-mist px-5 py-20 text-center">
      <div><p className="text-8xl font-black text-signal">404</p><h1 className="mt-4 text-3xl font-black uppercase">Страница не найдена</h1><Link to="/" className="shape-button mt-8 inline-flex items-center gap-3 bg-ink px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-signal"><span aria-hidden="true">←</span> На главную</Link></div>
    </section>
  )
}

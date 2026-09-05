import { Link } from 'react-router-dom'

export default function ContactBand() {
  return (
    <section className="bg-signal py-9 text-white sm:py-10">
      <div className="container-page flex flex-col justify-between gap-7 md:flex-row md:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Есть чертёж или техническое задание?</p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight sm:text-4xl">Рассчитаем стоимость вашего проекта</h2>
        </div>
        <Link to="/contacts/#request" className="shape-button flex shrink-0 items-center justify-center bg-white px-7 py-5 text-[11px] font-bold uppercase tracking-[0.15em] text-signal hover:bg-ink hover:text-white">
          Отправить заявку
        </Link>
      </div>
    </section>
  )
}

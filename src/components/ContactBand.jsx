import { Link } from 'react-router-dom'

export default function ContactBand() {
  return (
    <section className="bg-signal py-12 text-white sm:py-16">
      <div className="container-page flex flex-col justify-between gap-7 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-white/85">Есть чертёж или техническое задание?</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Рассчитаем стоимость вашего проекта</h2>
        </div>
        <Link to="/contacts/#request" className="shape-button flex shrink-0 items-center justify-center bg-white px-7 py-5 text-sm font-semibold text-signal hover:bg-ink hover:text-white">
          Отправить заявку
        </Link>
      </div>
    </section>
  )
}

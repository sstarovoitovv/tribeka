import { FiAlertCircle, FiArrowUpRight } from 'react-icons/fi'
import { siteConfig } from '../siteConfig.js'

export default function SubmissionError({ detail, onRetry }) {
  return (
    <section className="mt-5 rounded-lg border border-red-200 bg-red-50/60 p-5 sm:p-7" role="alert">
      <FiAlertCircle aria-hidden="true" className="mb-4 size-7 text-red-700" />
      <h3 className="text-xl font-semibold text-ink">Не удалось подтвердить отправку</h3>
      <p className="mt-3 text-sm leading-6 text-ink/75">Данные и выбранные файлы остались в форме. Повторите попытку или свяжитесь с нами напрямую.</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">Если связь прервалась после отправки, заявка могла сохраниться. Повторная попытка может создать ещё одну заявку.</p>
      {detail && <p className="mt-4 border-l-2 border-red-300 pl-3 text-sm leading-6 text-red-800">{detail}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={onRetry} className="shape-button min-h-11 bg-signal px-5 py-3 text-sm font-semibold text-white hover:bg-signal-hover disabled:opacity-60">Повторить отправку</button>
        <a href={`tel:${siteConfig.phoneHref}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-signal">Позвонить <FiArrowUpRight aria-hidden="true" /></a>
        <a href={`mailto:${siteConfig.email}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-signal">Написать на почту <FiArrowUpRight aria-hidden="true" /></a>
      </div>
    </section>
  )
}

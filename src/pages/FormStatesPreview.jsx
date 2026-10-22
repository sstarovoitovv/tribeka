import { useState } from 'react'
import RequestForm from '../components/RequestForm.jsx'

export default function FormStatesPreview() {
  const [outcome, setOutcome] = useState('demo-success')
  return <section className="bg-mist px-5 py-12 sm:py-16"><div className="mx-auto max-w-2xl">
    <p className="text-xs font-semibold uppercase tracking-widest text-signal">Локальный просмотр</p>
    <h1 className="mt-3 text-3xl font-semibold text-ink">Отправка заявки</h1>
    <p className="mt-4 text-sm leading-6 text-ink/70">Выберите результат, заполните форму и нажмите «Обсудить проект». Анимация длится 2,4 секунды только в этом примере. Письма не отправляются, записи в БД не создаются.</p>
    <div className="my-6 flex flex-wrap gap-3">{[['demo-success', 'Успешная отправка'], ['demo-error', 'Ошибка отправки']].map(([value,label]) => <button key={value} type="button" aria-pressed={outcome === value} onClick={() => setOutcome(value)} className={`min-h-11 rounded border px-4 py-3 text-sm font-semibold ${outcome === value ? 'border-signal bg-signal text-white' : 'border-ink/20 bg-white text-ink'}`}>{label}</button>)}</div>
    <RequestForm key={outcome} previewState={outcome} />
  </div></section>
}

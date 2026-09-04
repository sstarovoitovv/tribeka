import { useRef, useState } from 'react'
import { FiFileText, FiPaperclip, FiX } from 'react-icons/fi'
import { parsePhoneNumberWithError } from 'libphonenumber-js/max'
import { Link } from 'react-router-dom'
import { siteConfig } from '../siteConfig.js'

const MAX_FILES = 5
const MAX_TOTAL_SIZE = 15 * 1024 * 1024
const acceptedFiles = '.pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.zip,.rar,.7z,.jpg,.jpeg,.png,.webp'

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function resizeMessageField(event) {
  const field = event.currentTarget
  const maxHeight = 112

  field.style.height = 'auto'
  field.style.height = `${Math.min(field.scrollHeight, maxHeight)}px`
  field.style.overflowY = field.scrollHeight > maxHeight ? 'auto' : 'hidden'
}

export default function RequestForm() {
  const fileInput = useRef(null)
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [files, setFiles] = useState([])
  const [phoneError, setPhoneError] = useState('')

  function validatePhoneField(field, formatNumber = false) {
    const value = field.value.trim()
    const isRussianNationalNumber = value.startsWith('8')
    let errorMessage = ''
    let phoneNumber

    if (value && !value.startsWith('+') && !isRussianNationalNumber) {
      errorMessage = 'Начните номер с +кода страны или с 8 для России.'
    } else if (value) {
      try {
        phoneNumber = parsePhoneNumberWithError(value, {
          defaultCountry: isRussianNationalNumber ? 'RU' : undefined,
          extract: false,
        })
        if (!phoneNumber.isValid()) errorMessage = 'Проверьте номер и код страны.'
      } catch {
        errorMessage = 'Проверьте номер и код страны.'
      }
    }

    field.setCustomValidity(errorMessage)
    setPhoneError(errorMessage)

    if (!errorMessage && phoneNumber && formatNumber) {
      field.value = phoneNumber.formatInternational()
    }

    return !errorMessage
  }

  function updatePhoneValidation(event) {
    event.currentTarget.setCustomValidity('')
    if (phoneError) validatePhoneField(event.currentTarget)
  }

  function selectFiles(event) {
    const selected = [...files, ...Array.from(event.target.files)].filter((file, index, allFiles) => (
      allFiles.findIndex((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified) === index
    ))
    const totalSize = selected.reduce((sum, file) => sum + file.size, 0)

    event.target.value = ''

    if (selected.length > MAX_FILES) {
      setStatusMessage(`Можно прикрепить не более ${MAX_FILES} файлов.`)
      setStatus('error')
      return
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      setStatusMessage('Общий размер файлов не должен превышать 15 МБ.')
      setStatus('error')
      return
    }

    setFiles(selected)
    setStatusMessage('')
    setStatus('idle')
  }

  function clearFiles() {
    if (fileInput.current) fileInput.current.value = ''
    setFiles([])
    setStatusMessage('')
    setStatus('idle')
  }

  function removeFile(fileIndex) {
    setFiles((currentFiles) => currentFiles.filter((_, index) => index !== fileIndex))
    setStatusMessage('')
    setStatus('idle')
  }

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const phoneField = form.elements.phone

    validatePhoneField(phoneField, true)
    if (!form.reportValidity()) return

    if (!siteConfig.formEndpoint) {
      setStatus('error')
      setStatusMessage(`Отправка пока не подключена. Добавьте VITE_FORM_ENDPOINT или напишите на ${siteConfig.email}.`)
      return
    }

    setStatus('submitting')
    setStatusMessage('')

    try {
      const formData = new FormData(form)
      formData.delete('attachments')
      files.forEach((file) => formData.append('attachments', file, file.name))

      const response = await fetch(siteConfig.formEndpoint, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) throw new Error('Request failed')

      form.reset()
      setFiles([])
      setStatus('sent')
    } catch {
      setStatus('error')
      setStatusMessage(`Не удалось отправить заявку. Попробуйте ещё раз или напишите на ${siteConfig.email}.`)
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex min-h-[284px] flex-col items-center justify-center bg-white p-7 text-center sm:p-9" role="status">
        <span className="mb-5 grid size-10 place-items-center border border-signal text-xl font-black text-signal">✓</span>
        <h3 className="text-2xl font-black uppercase text-ink">Заявка принята</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-ink/60">Инженер свяжется с вами в рабочее время и уточнит детали проекта</p>
        <button onClick={() => setStatus('idle')} className="shape-button mt-6 border border-ink/10 bg-[#e3e7ed] px-5 py-3 text-xs font-bold uppercase tracking-widest text-signal hover:border-signal hover:bg-signal hover:text-white">Отправить ещё одну</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} encType="multipart/form-data" className="bg-white p-7 sm:p-9">
      <label className="absolute -left-[10000px]" aria-hidden="true">
        Не заполняйте это поле
        <input name="website" tabIndex="-1" autoComplete="off" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-ink/45">
          Ваше имя
          <input required name="name" placeholder="Александр" className="border-b border-ink/20 bg-transparent pb-1 pt-2 text-sm font-medium normal-case tracking-normal text-ink outline-none transition-colors duration-500 ease-in-out placeholder:text-ink/25 focus:border-signal" />
        </label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-ink/45">
          Телефон
          <input
            required
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? 'request-phone-error' : undefined}
            onInput={updatePhoneValidation}
            onBlur={(event) => validatePhoneField(event.currentTarget, true)}
            className={`border-b bg-transparent pb-1 pt-2 text-sm font-medium normal-case tracking-normal text-ink outline-none transition-colors duration-500 ease-in-out placeholder:text-ink/25 ${phoneError ? 'border-red-600' : 'border-ink/20 focus:border-signal'}`}
          />
          {phoneError && <span id="request-phone-error" className="normal-case tracking-normal text-red-700" aria-live="polite">{phoneError}</span>}
        </label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-ink/45 sm:col-span-2">
          Кратко о задаче
          <textarea
            name="message"
            rows="1"
            placeholder="Что нужно изготовить, материал, объём партии"
            onInput={resizeMessageField}
            className="min-h-[33px] max-h-[112px] resize-none overflow-y-hidden border-b border-ink/20 bg-transparent pb-1 pt-2 text-sm font-medium leading-5 normal-case tracking-normal text-ink outline-none transition-[border-color,height] duration-300 ease-out placeholder:text-ink/25 focus:border-signal"
          />
        </label>
        <div className="sm:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/45">Чертежи и файлы</p>
          <input
            ref={fileInput}
            id="request-files"
            name="attachments"
            type="file"
            multiple
            accept={acceptedFiles}
            onChange={selectFiles}
            className="sr-only"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor="request-files" className="shape-button inline-flex cursor-pointer items-center gap-2 border border-ink/10 bg-[#e3e7ed] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-signal hover:border-signal hover:bg-signal hover:text-white">
              <FiPaperclip size={15} /> Прикрепить файлы
            </label>
            <span className="text-[10px] leading-4 text-ink/40">До 5 файлов, общий размер до 15 МБ</span>
          </div>
          {files.length > 0 && (
            <div className="mt-3 text-left">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => {
                  const extension = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'ФАЙЛ'

                  return (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex max-w-full items-center gap-3 rounded-[10px] border border-ink/10 bg-[#f1f4f8] px-3 py-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-[7px] bg-signal/10 text-signal"><FiFileText size={17} /></span>
                      <span className="min-w-0">
                        <span className="block max-w-[220px] truncate text-[11px] font-bold normal-case tracking-normal text-ink" title={file.name}>{file.name}</span>
                        <span className="mt-0.5 block text-[9px] font-medium normal-case tracking-normal text-ink/40">{extension} / {formatSize(file.size)}</span>
                      </span>
                      <button type="button" onClick={() => removeFile(index)} className="grid size-7 shrink-0 place-items-center rounded-[5px] text-ink/35 transition-[border-radius,background-color,color] duration-500 ease-in-out hover:rounded-full hover:bg-ink/10 hover:text-ink" aria-label={`Удалить файл ${file.name}`} title="Удалить файл">
                        <FiX size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <button type="button" onClick={clearFiles} className="mt-2 text-[9px] font-bold uppercase tracking-widest text-signal transition-colors duration-500 ease-in-out hover:text-ink">Удалить все файлы</button>
            </div>
          )}
        </div>
      </div>
      <label className="mt-6 flex max-w-lg items-start gap-3 text-[10px] leading-4 text-ink/50">
        <input required aria-required="true" type="checkbox" name="privacy" className="mt-0.5 size-4 shrink-0 accent-signal" />
        <span>Я согласен на обработку персональных данных и принимаю <Link to="/privacy" className="text-signal underline underline-offset-2">политику конфиденциальности</Link></span>
      </label>
      {statusMessage && <p className={`mt-4 text-xs leading-5 ${status === 'error' ? 'text-red-700' : 'text-ink/55'}`} role="alert" aria-live="polite">{statusMessage}</p>}
      <div className="mt-7 flex justify-end">
        <button type="submit" disabled={status === 'submitting'} className="shape-button flex items-center justify-center bg-signal px-6 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#28548f] disabled:cursor-wait disabled:opacity-60">
          {status === 'submitting' ? 'Отправляем…' : 'Обсудить проект'}
        </button>
      </div>
    </form>
  )
}

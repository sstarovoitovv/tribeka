import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { siteConfig } from '../siteConfig.js'
import RequestForm from './RequestForm.jsx'

function renderForm() {
  return render(
    <MemoryRouter>
      <RequestForm />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RequestForm', () => {
  it('sends validated fields, document versions and an attachment', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    await user.type(screen.getByLabelText(/ваше имя/i), 'Александр')
    await user.type(screen.getByLabelText(/^телефон/i), '+79062603060')
    await user.type(screen.getByLabelText(/кратко о задаче/i), 'Нужна партия деталей')
    await user.upload(screen.getByLabelText(/прикрепить файлы/i), new File(['drawing'], 'drawing.pdf', { type: 'application/pdf' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /обсудить проект/i }))

    await screen.findByRole('heading', { name: /заявка принята/i })
    expect(fetchMock).toHaveBeenCalledOnce()

    const [endpoint, options] = fetchMock.mock.calls[0]
    expect(endpoint).toBe(siteConfig.formEndpoint)
    expect(options.method).toBe('POST')
    expect(options.body.get('name')).toBe('Александр')
    expect(options.body.get('phone')).toBe('+7 906 260 30 60')
    expect(options.body.get('message')).toBe('Нужна партия деталей')
    expect(options.body.get('consent_version')).toBe(siteConfig.personalData.consentVersion)
    expect(options.body.get('policy_version')).toBe(siteConfig.personalData.policyVersion)
    expect(options.body.get('attachments')).toBeInstanceOf(File)
  })

  it('keeps the form visible and explains a server failure', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    renderForm()

    await user.type(screen.getByLabelText(/ваше имя/i), 'Мария')
    await user.type(screen.getByLabelText(/^телефон/i), '+79062603060')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /обсудить проект/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не удалось отправить заявку'))
    expect(screen.getByLabelText(/ваше имя/i)).toHaveValue('Мария')
  })
})

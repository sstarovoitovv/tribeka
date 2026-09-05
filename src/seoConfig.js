import { serviceGroups } from './data/company.js'

export const SITE_URL = 'https://xn--80abmkm6an.xn--p1ai'
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/brand/tribeka-social.jpg`

const staticSeoEntries = [
  {
    path: '/',
    title: 'ТРИБЕКА — комплексная металлообработка в Санкт-Петербурге',
    description: 'Комплексная металлообработка под ключ в Санкт-Петербурге: изготовление деталей по чертежам, от опытного образца до серийной партии.',
    robots: 'index,follow',
  },
  {
    path: '/about/',
    title: 'О компании ТРИБЕКА — металлообработка полного цикла',
    description: 'Производственная компания ТРИБЕКА: металлообработка полного цикла, собственное оборудование и работа с проектами с 2012 года.',
    robots: 'index,follow',
  },
  {
    path: '/services/',
    title: 'Услуги металлообработки — ТРИБЕКА',
    description: 'Направления металлообработки ТРИБЕКА: изготовление деталей и серийных партий по чертежам заказчика в Санкт-Петербурге.',
    robots: 'index,follow',
  },
  {
    path: '/contacts/',
    title: 'Контакты и заявка на расчёт — ТРИБЕКА',
    description: 'Контакты ООО «ТРИБЕКА» в Санкт-Петербурге. Отправьте чертёж или техническое задание для расчёта стоимости и сроков производства.',
    robots: 'index,follow',
  },
  {
    path: '/privacy/',
    title: 'Политика обработки персональных данных — ТРИБЕКА',
    description: 'Порядок сбора, использования, хранения, защиты и удаления персональных данных посетителей сайта ООО «ТРИБЕКА».',
    robots: 'noindex,follow',
  },
  {
    path: '/consent/',
    title: 'Согласие на обработку персональных данных — ТРИБЕКА',
    description: 'Условия согласия на обработку персональных данных, передаваемых через форму заявки на сайте ООО «ТРИБЕКА».',
    robots: 'noindex,follow',
  },
]

export function normalizePathname(pathname = '/') {
  const cleanPath = pathname.split(/[?#]/u)[0]
  const segments = cleanPath.split('/').filter(Boolean)
  return segments.length === 0 ? '/' : `/${segments.join('/')}/`
}

function completeMetadata(entry) {
  return {
    ...entry,
    canonical: `${SITE_URL}${entry.path}`,
    image: DEFAULT_SOCIAL_IMAGE,
  }
}

function getServiceMetadata(pathname) {
  const match = pathname.match(/^\/services\/([^/]+)\/$/u)
  if (!match) return null

  const service = serviceGroups.find(({ id }) => id === match[1])
  if (!service) return null

  return completeMetadata({
    path: pathname,
    title: `${service.title} — услуги ТРИБЕКА`,
    description: `${service.title}: ${service.short} Производство по чертежам заказчика в Санкт-Петербурге.`,
    // Карточки услуг пока содержат шаблонный контент. После наполнения их можно индексировать.
    robots: 'noindex,follow',
  })
}

export function getSeoMetadata(pathname) {
  const normalizedPath = normalizePathname(pathname)
  const staticEntry = staticSeoEntries.find(({ path }) => path === normalizedPath)

  if (staticEntry) return completeMetadata(staticEntry)

  return getServiceMetadata(normalizedPath) || completeMetadata({
    path: normalizedPath,
    title: 'Страница не найдена — ТРИБЕКА',
    description: 'Запрошенная страница сайта ТРИБЕКА не найдена.',
    robots: 'noindex,nofollow',
  })
}

export function getPrerenderSeoEntries() {
  const serviceEntries = serviceGroups.map(({ id }) => getServiceMetadata(`/services/${id}/`))
  return [...staticSeoEntries.map(completeMetadata), ...serviceEntries]
}

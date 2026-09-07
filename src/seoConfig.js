import { serviceGroups } from './data/company.js'
import { siteConfig } from './siteConfig.js'
import { findService, getServicePath } from './serviceRoutes.js'

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

  const service = findService(match[1])
  if (!service) return null

  return completeMetadata({
    path: getServicePath(service),
    title: `${service.title} — услуги ТРИБЕКА`,
    description: `${service.title}: ${service.short} Производство по чертежам заказчика в Санкт-Петербурге.`,
    // Карточки услуг пока содержат шаблонный контент. После наполнения их можно индексировать.
    robots: service.placeholder ? 'noindex,follow' : 'index,follow',
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
  const serviceEntries = serviceGroups.map((service) => getServiceMetadata(getServicePath(service)))
  return [...staticSeoEntries.map(completeMetadata), ...serviceEntries]
}


const pageLabels = {
  '/': 'Главная',
  '/about/': 'О компании',
  '/services/': 'Услуги',
  '/contacts/': 'Контакты',
  '/privacy/': 'Политика обработки персональных данных',
  '/consent/': 'Согласие на обработку персональных данных',
}

export function getStructuredData(pathname) {
  const metadata = getSeoMetadata(pathname)
  const serviceSlug = metadata.path.match(/^\/services\/([^/]+)\/$/u)?.[1]
  const service = serviceSlug ? findService(serviceSlug) : null
  const organizationId = `${SITE_URL}/#organization`
  const websiteId = `${SITE_URL}/#website`
  const pageId = `${metadata.canonical}#webpage`
  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: siteConfig.companyName,
    legalName: siteConfig.legalName,
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}${siteConfig.logoSrc}` },
    telephone: siteConfig.phoneHref,
    email: siteConfig.email,
    foundingDate: String(siteConfig.founded),
    taxID: siteConfig.inn,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ул. Возрождения, 24, корп. 2Е',
      addressLocality: 'Санкт-Петербург',
      addressCountry: 'RU',
    },
  }
  const graph = [organization, {
    '@type': 'WebSite',
    '@id': websiteId,
    url: `${SITE_URL}/`,
    name: siteConfig.companyName,
    publisher: { '@id': organizationId },
    inLanguage: 'ru-RU',
  }, {
    '@type': metadata.path === '/contacts/' ? 'ContactPage' : metadata.path === '/about/' ? 'AboutPage' : 'WebPage',
    '@id': pageId,
    url: metadata.canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: { '@id': websiteId },
    about: { '@id': organizationId },
    inLanguage: 'ru-RU',
  }]

  const label = pageLabels[metadata.path] || service?.title
  if (metadata.path !== '/' && label) {
    const crumbs = [{ name: pageLabels['/'], item: `${SITE_URL}/` }]
    if (service) crumbs.push({ name: pageLabels['/services/'], item: `${SITE_URL}/services/` })
    crumbs.push({ name: label, item: metadata.canonical })
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${metadata.canonical}#breadcrumbs`,
      itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
    })
    graph[2].breadcrumb = { '@id': `${metadata.canonical}#breadcrumbs` }
  }
  // Placeholder text must not be presented to search engines as a real offer.
  if (service && !service.placeholder) {
    graph.push({
      '@type': 'Service',
      '@id': `${metadata.canonical}#service`,
      name: service.title,
      description: service.short,
      url: metadata.canonical,
      provider: { '@id': organizationId },
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

export function serializeStructuredData(value) {
  // Prevent a title or description containing </script> from ending the block.
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026')
}

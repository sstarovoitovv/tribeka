import { serviceGroups } from './data/company.js'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export function getServicePath(service) {
  return `/services/${service.slug}/`
}

export function getServiceAliases(service) {
  return [...new Set([service.id, ...(service.aliases || [])])].filter((alias) => alias !== service.slug)
}

export function findService(slug, services = serviceGroups) {
  return services.find((service) => service.slug === slug || getServiceAliases(service).includes(slug))
}

// Stable slugs are editorial data. When a real service name is approved, change
// slug and retain every previous slug in aliases; id remains a permanent key.
export function getServiceRedirects(services = serviceGroups) {
  const usedPaths = new Set()
  for (const service of services) {
    for (const slug of [service.slug, ...getServiceAliases(service)]) {
      if (!slugPattern.test(slug)) throw new Error(`Invalid service slug: ${slug}`)
      if (usedPaths.has(slug)) throw new Error(`Duplicate service route: ${slug}`)
      usedPaths.add(slug)
    }
  }
  return services.flatMap((service) => getServiceAliases(service).map((alias) => ({
    from: `/services/${alias}/`,
    to: getServicePath(service),
    status: 301,
  })))
}

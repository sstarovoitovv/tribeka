import { describe, expect, it } from 'vitest'
import { findService, getServicePath, getServiceRedirects } from './serviceRoutes.js'

const approvedService = {
  id: 'service-01',
  slug: 'tokarnaya-obrabotka',
  aliases: ['tokarnye-raboty'],
}

describe('service URL migrations', () => {
  it('keeps both the permanent id and previous descriptive slug working after a rename', () => {
    for (const slug of ['service-01', 'tokarnye-raboty', 'tokarnaya-obrabotka']) {
      expect(findService(slug, [approvedService])).toBe(approvedService)
    }
    expect(getServicePath(approvedService)).toBe('/services/tokarnaya-obrabotka/')
    expect(getServiceRedirects([approvedService])).toEqual([
      { from: '/services/service-01/', to: '/services/tokarnaya-obrabotka/', status: 301 },
      { from: '/services/tokarnye-raboty/', to: '/services/tokarnaya-obrabotka/', status: 301 },
    ])
  })

  it('rejects collisions between a legacy alias and another canonical URL', () => {
    expect(() => getServiceRedirects([approvedService, { id: 'service-02', slug: 'tokarnye-raboty' }])).toThrow('Duplicate service route')
  })

  it('rejects unsafe slugs before they reach HTML or rewrite configuration', () => {
    expect(() => getServiceRedirects([{ id: 'service-01', slug: '../api' }])).toThrow('Invalid service slug')
  })

  it('keeps placeholder URLs stable until their names are approved', () => {
    expect(getServiceRedirects()).toEqual([])
    expect(findService('unknown-service')).toBeUndefined()
  })
})

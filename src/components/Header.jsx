import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiMenu, FiPhone, FiX } from 'react-icons/fi'
import Logo from './Logo.jsx'
import ContactLinks from './ContactLinks.jsx'
import { siteConfig } from '../siteConfig.js'

const links = [
  ['Главная', '/'],
  ['Услуги', '/services'],
  ['О компании', '/about'],
  ['Контакты', '/contacts'],
]

function NavItem({ label, to, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) => `relative inline-flex h-full items-center px-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-500 ease-in-out after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-center after:bg-signal after:transition-transform after:duration-500 after:ease-in-out ${isActive ? 'text-signal after:scale-x-100' : 'text-ink/55 after:scale-x-0 hover:text-signal hover:after:scale-x-100'}`}
    >
      {label}
    </NavLink>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1280px)')
    const closeOnDesktop = (event) => {
      if (event.matches) setOpen(false)
    }

    desktopQuery.addEventListener('change', closeOnDesktop)
    return () => desktopQuery.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-[#f7f8fa]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-stretch xl:grid xl:grid-cols-[248px_minmax(400px,1fr)_204px_216px] xl:pr-[42px]">
        <div className="flex min-w-0 items-center px-5 sm:px-7 xl:justify-center xl:px-8">
          <Logo compact />
        </div>
        <nav className="hidden h-full min-w-0 items-stretch justify-center gap-8 px-6 xl:flex" aria-label="Основная навигация">
          {links.map(([label, to]) => <NavItem key={to} label={label} to={to} />)}
        </nav>
        <div className="hidden h-full items-stretch xl:contents">
          <a href={`tel:${siteConfig.phoneHref}`} className="group flex h-full items-center justify-center gap-2.5 px-2 text-[13px] font-black leading-none text-ink transition-colors duration-500 ease-in-out hover:text-signal">
            <span className="grid size-12 shrink-0 place-items-center rounded-[5px] border border-ink/10 bg-[#e3e7ed] text-signal transition-[border-radius,background-color,border-color,color] duration-500 ease-in-out group-hover:rounded-[50%] group-hover:border-signal group-hover:bg-signal group-hover:text-white"><FiPhone size={21} /></span>
            <span className="whitespace-nowrap">{siteConfig.phone}</span>
          </a>
          <ContactLinks header className="h-full" />
        </div>
        <button onClick={() => setOpen((current) => !current)} className="ml-auto mr-4 grid size-11 place-items-center self-center rounded-[9px] bg-[#e3e7ed] text-ink transition-[border-radius,background-color] duration-500 ease-in-out hover:rounded-full hover:bg-[#d7dde6] xl:hidden" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} aria-controls="mobile-navigation">
          <span className="relative size-6">
            <FiMenu className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} size={24} />
            <FiX className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} size={24} />
          </span>
        </button>
      </div>
      <div className={`fixed inset-x-0 bottom-0 top-[72px] z-40 xl:hidden ${open ? 'visible delay-0' : 'invisible delay-500'} transition-[visibility] duration-0`} aria-hidden={!open}>
        <button type="button" onClick={() => setOpen(false)} className={`absolute inset-0 bg-ink/25 transition-opacity duration-500 ease-in-out ${open ? 'opacity-100' : 'opacity-0'}`} aria-label="Закрыть меню" tabIndex={open ? 0 : -1} />
        <nav id="mobile-navigation" className={`relative max-h-full overflow-y-auto bg-[#f7f8fa] px-5 pb-6 pt-2 shadow-[0_18px_40px_rgba(7,24,46,0.16)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`} aria-label="Мобильная навигация">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className={({ isActive }) => `block py-3.5 text-xs font-black uppercase tracking-wider transition-[color,transform] duration-500 ease-in-out ${isActive ? 'translate-x-1 text-signal' : 'text-ink hover:translate-x-1 hover:text-signal'}`}>
              {label}
            </NavLink>
          ))}
          <a href={`tel:${siteConfig.phoneHref}`} tabIndex={open ? 0 : -1} className="group mt-5 flex items-center gap-2.5 text-sm font-black text-ink">
            <span className="grid size-12 shrink-0 place-items-center rounded-[5px] border border-ink/10 bg-[#e3e7ed] text-signal transition-[border-radius,background-color,border-color,color] duration-500 ease-in-out group-hover:rounded-[50%] group-hover:border-signal group-hover:bg-signal group-hover:text-white"><FiPhone size={21} /></span>
            {siteConfig.phone}
          </a>
          <ContactLinks labeled className="mt-5" />
        </nav>
      </div>
    </header>
  )
}

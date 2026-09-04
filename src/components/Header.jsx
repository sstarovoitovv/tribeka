import { useState } from 'react'
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
        <button onClick={() => setOpen(!open)} className="ml-auto mr-4 grid size-11 place-items-center self-center rounded-[9px] bg-[#e3e7ed] text-ink transition-[border-radius,background-color] duration-500 ease-in-out hover:rounded-full hover:bg-[#d7dde6] xl:hidden" aria-label="Открыть меню" aria-expanded={open}>
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      {open && (
        <nav className="bg-[#f7f8fa] px-5 pb-6 pt-2 xl:hidden" aria-label="Мобильная навигация">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `block py-3.5 text-xs font-black uppercase tracking-wider transition-[color,transform] duration-500 ease-in-out ${isActive ? 'translate-x-1 text-signal' : 'text-ink hover:translate-x-1 hover:text-signal'}`}>
              {label}
            </NavLink>
          ))}
          <a href={`tel:${siteConfig.phoneHref}`} className="group mt-5 flex items-center gap-2.5 text-sm font-black text-ink">
            <span className="grid size-12 shrink-0 place-items-center rounded-[5px] border border-ink/10 bg-[#e3e7ed] text-signal transition-[border-radius,background-color,border-color,color] duration-500 ease-in-out group-hover:rounded-[50%] group-hover:border-signal group-hover:bg-signal group-hover:text-white"><FiPhone size={21} /></span>
            {siteConfig.phone}
          </a>
          <ContactLinks labeled className="mt-5" />
        </nav>
      )}
    </header>
  )
}

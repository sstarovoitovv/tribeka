import { FiGrid, FiHome, FiInfo, FiMapPin } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'

const dashboardItems = [
  { label: 'Главная', to: '/', icon: FiHome },
  { label: 'Услуги', to: '/services', icon: FiGrid },
  { label: 'О компании', to: '/about', icon: FiInfo },
  { label: 'Контакты', to: '/contacts', icon: FiMapPin },
]

export default function MobileDashboard() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-[#f7f8fa] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(7,24,46,0.08)] min-[1000px]:hidden" aria-label="Мобильная навигация по разделам">
      <div className="mx-auto grid h-[62px] max-w-xl grid-cols-4">
        {dashboardItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `group relative flex min-w-0 flex-col items-center justify-center gap-0.5 text-[8px] font-black uppercase tracking-[0.08em] transition-colors duration-500 ease-in-out ${isActive ? 'text-signal' : 'text-ink/50 hover:text-signal'}`}
          >
            {({ isActive }) => (
              <>
                <span className={`grid size-6 place-items-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive ? '-translate-y-0.5' : 'translate-y-0 group-hover:-translate-y-0.5'}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                </span>
                <span className="max-w-full truncate px-1">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

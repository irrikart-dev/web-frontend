import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../lib/auth';
import { IconClose, IconLogout } from './icons';
import { NAV_GROUPS, NAV_ITEMS } from './nav-items';

export function AdminLayout() {
  const { user, logOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((i) => pathname.startsWith(i.to));

  return (
    <div className="min-h-screen lg:flex">
      {/* Backdrop for the drawer on small screens. */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-ink-100 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
          <img src="/irrikart_logo_mark.png" alt="" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <p className="text-base font-extrabold tracking-tight text-ink-900">IrriKart</p>
            <p className="text-[11px] font-semibold tracking-widest text-brand-600 uppercase">
              Admin
            </p>
          </div>
          <button
            className="ml-auto text-ink-300 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <IconClose />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-ink-300 uppercase">
                {group}
              </p>
              <ul className="space-y-0.5">
                {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900'
                        }`
                      }
                    >
                      <item.icon />
                      <span className="flex-1">{item.label}</span>
                      {item.wip && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-amber-700 uppercase">
                          Soon
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-ink-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
            <button
              onClick={logOut}
              className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600"
              title="Log out"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-ink-100 bg-white/85 px-5 py-3.5 backdrop-blur">
          <button
            className="-ml-1 rounded-lg p-2 text-ink-700 hover:bg-ink-50 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-5 bg-current shadow-[0_6px_0_currentColor,0_-6px_0_currentColor]" />
          </button>
          <h1 className="text-lg font-bold text-ink-900">{current?.label ?? 'Admin'}</h1>
        
        </header>

        <main className="flex-1 px-5 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './BlendRings';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import Button from './ui/Button';
import { ChevronDown, Close, Search } from './ui/icons';

function BlendLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 2 L2 14 L14 14 Z" className="fill-blue dark:fill-blue-dark" />
      <path d="M14 14 L26 14 L14 26 Z" className="fill-green dark:fill-green-dark" />
      <path d="M14 2 L26 14 L14 14 Z" className="fill-ink/15 dark:fill-ink-dark/10" />
      <path d="M2 14 L14 14 L14 26 Z" className="fill-ink/15 dark:fill-ink-dark/10" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20.8 15.4A8.5 8.5 0 0 1 8.6 3.2 8.5 8.5 0 1 0 20.8 15.4Z" />
    </svg>
  );
}

const MENU_ITEMS = [
  { to: '/explore', label: 'Discover' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/my-projects', label: 'My Projects' },
  { to: '/my-applications', label: 'Applications' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('ib_theme', isDark ? 'dark' : 'light');
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  }

  const items = user?.isAdmin ? [...MENU_ITEMS, { to: '/admin', label: 'Admin' }] : MENU_ITEMS;

  return (
    <header className="sticky top-0 z-40 border-b border-ui-line/10 bg-ui-canvas/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-shell items-center gap-4 px-5 md:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <BlendLogo />
          <span className="hidden font-display text-[15px] font-bold tracking-tight transition-opacity group-hover:opacity-75 sm:inline">
            Idea Blend
          </span>
        </Link>

        <div className="mx-auto hidden max-w-xl flex-1 md:block">
          <GlobalSearch />
        </div>
        <div className="flex-1 md:hidden" />

        <div className="flex shrink-0 items-center gap-1.5">
          {user && (
            <>
              <Link
                to="/explore"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ui-muted transition-colors hover:bg-ui-line/5 hover:text-ui-fg lg:inline-flex"
              >
                Discover
              </Link>
              <Button to="/create" size="sm" className="hidden h-9 px-3.5 sm:inline-flex">
                Create project
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileSearchOpen(open => !open)}
            aria-label="Search"
            aria-expanded={mobileSearchOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ui-muted transition-colors hover:bg-ui-line/5 hover:text-ui-fg md:hidden"
          >
            <Search className="h-[17px] w-[17px]" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-ui-muted transition-colors hover:bg-ui-line/5 hover:text-ui-fg sm:flex"
          >
            <ThemeIcon />
          </button>

          {user && (
            <div className="ml-1 hidden sm:block">
              <NotificationBell />
            </div>
          )}

          {user ? (
            <div className="relative ml-1 hidden sm:block">
              <button
                type="button"
                onClick={() => setMenuOpen(open => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-ui-line/5"
              >
                <Avatar user={user} size={30} />
                <ChevronDown className="h-3.5 w-3.5 text-ui-muted" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-ui-line/10 bg-ui-surface py-2 shadow-card-hover dark:shadow-card-dark"
                  >
                    <div className="border-b border-ui-line/10 px-4 py-3">
                      <div className="truncate text-sm font-semibold">{user.name || user.email}</div>
                      <div className="mt-0.5 truncate text-xs text-ui-subtle">Your Idea Blend</div>
                    </div>
                    {items.map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-ui-muted transition-colors hover:bg-ui-line/5 hover:text-ui-fg"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-ui-line/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-500/5"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Button to="/login" variant="ghost" size="sm" className="h-9 px-3.5">
                Sign in
              </Button>
              <Button to="/register" size="sm" className="h-9 px-3.5">
                Join Idea Blend
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ui-muted transition-colors hover:bg-ui-line/5 hover:text-ui-fg sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {mobileSearchOpen && (
        <div className="px-5 pb-3 md:hidden">
          <GlobalSearch />
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] isolate sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute right-0 top-0 flex h-[100dvh] w-[min(22rem,88vw)] flex-col overflow-y-auto bg-ui-surface px-6 py-6 shadow-panel"
          >
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <BlendLogo />
                <span className="font-display text-base font-bold">Idea Blend</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ui-muted transition-colors hover:bg-ui-line/5 hover:text-ui-fg"
              >
                <Close className="h-4 w-4" />
              </button>
            </div>

            {user ? (
              <div className="flex flex-col">
                <div className="mb-4 flex items-center gap-3 border-b border-ui-line/10 pb-5">
                  <Avatar user={user} size={42} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{user.name || user.email}</div>
                    <div className="mt-0.5 text-xs text-ui-subtle">Your workspace</div>
                  </div>
                </div>
                {items.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button to="/explore" variant="secondary" onClick={() => setMobileOpen(false)}>
                    Discover
                  </Button>
                  <Button to="/create" onClick={() => setMobileOpen(false)}>
                    Create
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Button to="/register" fullWidth onClick={() => setMobileOpen(false)}>
                  Join Idea Blend
                </Button>
                <Button to="/login" variant="secondary" fullWidth onClick={() => setMobileOpen(false)}>
                  Sign in
                </Button>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between border-t border-ui-line/10 pt-5">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm font-medium text-ui-muted"
              >
                <ThemeIcon />
                Toggle theme
              </button>
              {user && (
                <button type="button" onClick={handleLogout} className="text-sm text-red-500">
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

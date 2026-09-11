import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './BlendRings';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';

function BlendLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      {/* top-left blue quadrant */}
      <path d="M14 2 L2 14 L14 14 Z" className="fill-blue dark:fill-blue-dark" />
      {/* bottom-right green quadrant */}
      <path d="M14 14 L26 14 L14 26 Z" className="fill-green dark:fill-green-dark" />
      {/* top-right ink (light) / slightly lighter dark */}
      <path d="M14 2 L26 14 L14 14 Z" className="fill-ink/15 dark:fill-ink-dark/10" />
      {/* bottom-left ink */}
      <path d="M2 14 L14 14 L14 26 Z" className="fill-ink/15 dark:fill-ink-dark/10" />
    </svg>
  );
}

const MENU_ITEMS = [
  { to: '/explore', label: 'Discover' },
  { to: '/my-projects', label: 'My Projects' },
  { to: '/my-applications', label: 'My Applications' },
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
    <div className="relative border-b border-ink/10 dark:border-ink-dark/10">
      <nav className="max-w-6xl mx-auto flex items-center gap-4 py-3 px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <BlendLogo />
          <span className="font-display font-bold text-lg hidden sm:inline">Idea Blend</span>
        </Link>

        {/* desktop search - full component with dropdown results */}
        <div className="hidden sm:block flex-1">
          <GlobalSearch />
        </div>
        <div className="sm:hidden flex-1" />

        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <>
              <Link to="/explore" className="hidden sm:inline-block px-3.5 py-2 rounded-lg border border-ink/20 dark:border-ink-dark/20 text-sm font-semibold whitespace-nowrap">
                Discover
              </Link>
              <Link to="/create" className="hidden sm:inline-block px-3.5 py-2 rounded-lg bg-blue dark:bg-blue-dark text-white text-sm font-semibold whitespace-nowrap">
                Create Project
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileSearchOpen(o => !o)}
            aria-label="Search"
            className="sm:hidden w-9 h-9 rounded-full border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="hidden sm:flex w-9 h-9 rounded-full border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>

          {user && <div className="hidden sm:block"><NotificationBell /></div>}

          {user ? (
            <div className="relative hidden sm:block">
              <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-1.5">
                <Avatar user={user} size={30} />
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold">{user.name || user.email}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface dark:bg-surfacedark border border-ink/20 dark:border-ink-dark/20 rounded-xl shadow-lg z-30 py-1">
                    {items.map(i => (
                      <Link key={i.to} to={i.to} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-page dark:hover:bg-pagedark">
                        {i.label}
                      </Link>
                    ))}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-page dark:hover:bg-pagedark">
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 rounded-lg border border-ink/20 dark:border-ink-dark/20 text-sm font-semibold">Sign in</Link>
              <Link to="/register" className="px-4 py-2 rounded-lg bg-blue dark:bg-blue-dark text-white text-sm font-semibold">Sign up</Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            className="sm:hidden w-9 h-9 rounded-full border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </nav>

      {mobileSearchOpen && (
        <div className="sm:hidden px-6 pb-3">
          <GlobalSearch />
        </div>
      )}

      {/* mobile drawer - side panel, holds everything the desktop menu/search bar do */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-72 max-w-[80%] bg-surface dark:bg-surfacedark shadow-xl flex flex-col px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="w-8 h-8 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6" /></svg>
              </button>
            </div>

            <button onClick={toggleTheme} className="flex items-center gap-2 text-sm font-medium mb-5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              Toggle theme
            </button>

            {user ? (
              <div className="flex flex-col gap-5 text-sm font-medium">
                {items.map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setMobileOpen(false)}>{i.label}</Link>
                ))}
                <Link to="/explore" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 rounded-lg border border-ink/20 dark:border-ink-dark/20 font-semibold">
                  Discover
                </Link>
                <Link to="/create" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 rounded-lg bg-blue dark:bg-blue-dark text-white font-semibold">
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 rounded-lg bg-blue dark:bg-blue-dark text-white text-sm font-semibold">
                  Sign up
                </Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 rounded-lg border border-ink/20 dark:border-ink-dark/20 text-sm font-semibold">
                  Sign in
                </Link>
              </div>
            )}

            <div className="mt-auto border-t border-ink/10 dark:border-ink-dark/10 pt-5">
              {user && (
                <div className="flex items-center justify-between">
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                    <Avatar user={user} size={28} />
                    {user.name || user.email}
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-red-500">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

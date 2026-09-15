import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './BlendRings';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';

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
    <header className="sticky top-0 z-40 border-b border-ink/10 dark:border-ink-dark/10 bg-page/85 dark:bg-pagedark/85 backdrop-blur-xl">
      <nav className="max-w-6xl mx-auto h-16 flex items-center gap-4 px-5 md:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <BlendLogo />
          <span className="font-display font-bold text-[15px] tracking-tight hidden sm:inline group-hover:opacity-75 transition-opacity">Idea Blend</span>
        </Link>

        <div className="hidden md:block flex-1 max-w-xl mx-auto">
          <GlobalSearch />
        </div>
        <div className="md:hidden flex-1" />

        <div className="flex items-center gap-1.5 shrink-0">
          {user && (
            <>
              <Link to="/explore" className="hidden lg:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-ink/60 dark:text-ink-dark/60 hover:text-ink dark:hover:text-ink-dark hover:bg-ink/5 dark:hover:bg-ink-dark/5 transition-colors">Discover</Link>
              <Link to="/create" className="hidden sm:inline-flex ib-button-primary !rounded-lg !px-3.5 !py-2">Create project</Link>
            </>
          )}

          <button onClick={() => setMobileSearchOpen(o => !o)} aria-label="Search" className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-ink/5 dark:hover:bg-ink-dark/5">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
          </button>

          <button onClick={toggleTheme} aria-label="Toggle theme" className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center hover:bg-ink/5 dark:hover:bg-ink-dark/5 transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 15.4A8.5 8.5 0 0 1 8.6 3.2 8.5 8.5 0 1 0 20.8 15.4Z" /></svg>
          </button>

          {user && <div className="hidden sm:block ml-1"><NotificationBell /></div>}

          {user ? (
            <div className="relative hidden sm:block ml-1">
              <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-ink/5 dark:hover:bg-ink-dark/5 transition-colors">
                <Avatar user={user} size={30} />
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-surface dark:bg-surfacedark border border-ink/10 dark:border-ink-dark/10 shadow-xl shadow-black/10 z-30 py-2 overflow-hidden">
                    <div className="px-4 py-3 border-b border-ink/10 dark:border-ink-dark/10">
                      <div className="text-sm font-semibold truncate">{user.name || user.email}</div>
                      <div className="text-xs text-ink/45 dark:text-ink-dark/45 truncate mt-0.5">Your Idea Blend</div>
                    </div>
                    {items.map(i => <Link key={i.to} to={i.to} onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-ink/75 dark:text-ink-dark/75 hover:bg-ink/5 dark:hover:bg-ink-dark/5">{i.label}</Link>)}
                    <div className="my-1 border-t border-ink/10 dark:border-ink-dark/10" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5">Sign out</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/login" className="px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-ink/5 dark:hover:bg-ink-dark/5">Sign in</Link>
              <Link to="/register" className="ib-button-primary !rounded-lg !px-3.5 !py-2">Join Idea Blend</Link>
            </div>
          )}

          <button onClick={() => setMobileOpen(true)} aria-label="Menu" className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-ink/5 dark:hover:bg-ink-dark/5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </nav>

      {mobileSearchOpen && <div className="md:hidden px-5 pb-3"><GlobalSearch /></div>}

      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-[100] isolate">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-[min(22rem,88vw)] bg-white dark:bg-[#09090B] opacity-100 backdrop-blur-none shadow-2xl border-l border-black/10 dark:border-white/10 flex flex-col px-6 py-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2"><BlendLogo /><span className="font-display font-bold text-base">Idea Blend</span></Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-ink/5 dark:hover:bg-ink-dark/5">×</button>
            </div>

            {user ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-3 pb-5 mb-4 border-b border-ink/10 dark:border-ink-dark/10">
                  <Avatar user={user} size={42} />
                  <div className="min-w-0"><div className="font-semibold truncate">{user.name || user.email}</div><div className="text-xs text-ink/45 dark:text-ink-dark/45 mt-0.5">Your workspace</div></div>
                </div>
                {items.map(i => <Link key={i.to} to={i.to} onClick={() => setMobileOpen(false)} className="py-3 text-sm font-medium">{i.label}</Link>)}
                <div className="grid grid-cols-2 gap-2 mt-5">
                  <Link to="/explore" onClick={() => setMobileOpen(false)} className="ib-button-secondary !px-2">Discover</Link>
                  <Link to="/create" onClick={() => setMobileOpen(false)} className="ib-button-primary !px-2">Create</Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-2"><Link to="/register" onClick={() => setMobileOpen(false)} className="ib-button-primary">Join Idea Blend</Link><Link to="/login" onClick={() => setMobileOpen(false)} className="ib-button-secondary">Sign in</Link></div>
            )}

            <div className="mt-auto pt-5 border-t border-ink/10 dark:border-ink-dark/10 flex items-center justify-between">
              <button onClick={toggleTheme} className="text-sm font-medium">Toggle theme</button>
              {user && <button onClick={handleLogout} className="text-sm text-red-500">Sign out</button>}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

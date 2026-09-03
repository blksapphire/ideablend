import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './BlendRings';

function BlendLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 30 30">
      <circle cx="11" cy="13" r="8" className="fill-violet dark:fill-violet-dark" opacity="0.9" />
      <circle cx="19" cy="13" r="8" className="fill-teal dark:fill-teal-dark" opacity="0.85" />
      <circle cx="15" cy="20" r="8" className="fill-sky dark:fill-sky-dark" opacity="0.85" />
    </svg>
  );
}

const NAV_LINKS = [
  { to: '/explore', label: 'Discover', authOnly: false },
  { to: '/create', label: 'Create project', authOnly: true },
  { to: '/my-projects', label: 'My projects', authOnly: true },
  { to: '/my-applications', label: 'My applications', authOnly: true }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('ib_theme', isDark ? 'dark' : 'light');
  }

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate('/');
  }

  const links = NAV_LINKS.filter(l => !l.authOnly || user);

  return (
    <div className="relative border-b border-ink/20 dark:border-ink-dark/20">
      <nav className="max-w-5xl mx-auto flex items-center justify-between py-5 px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <BlendLogo />
          <span className="font-display font-bold text-lg">Idea Blend</span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-ink/60 dark:text-ink-dark/60">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="hover:text-ink dark:hover:text-ink-dark">{l.label}</Link>
          ))}
          {user?.isAdmin && <Link to="/admin" className="hover:text-ink dark:hover:text-ink-dark">Admin</Link>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>

          {/* hamburger - the nav links above are hidden below sm, this is the only way to reach them on mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            className="sm:hidden w-9 h-9 rounded-full border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2 text-sm font-medium">
                  <Avatar user={user} size={24} />
                  {user.name || user.email}
                </Link>
                <button onClick={handleLogout} className="text-sm text-ink/50 dark:text-ink-dark/50 hover:text-ink dark:hover:text-ink-dark">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold">
                  Sign in
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* mobile menu: a side drawer sliding in from the right over a dim
          backdrop, rather than a full-width panel dropping down from the
          top and covering half the screen */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-72 max-w-[80%] bg-surface dark:bg-surfacedark shadow-xl flex flex-col px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="w-8 h-8 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-5 text-sm font-medium">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>{l.label}</Link>
              ))}
              {user?.isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>}
            </div>

            <div className="mt-auto border-t border-ink/20 dark:border-ink-dark/20 pt-5">
              {user ? (
                <div className="space-y-3">
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                    <Avatar user={user} size={28} />
                    {user.name || user.email}
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-ink/50 dark:text-ink-dark/50">Sign out</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">
                    Sign up
                  </Link>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold">
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

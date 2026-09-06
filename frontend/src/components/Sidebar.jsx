import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICONS = {
  discover: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  projects: <><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></>,
  applications: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>,
  bell: <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
  admin: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
};

function Icon({ name, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>;
}

const ITEMS = [
  { to: '/explore', label: 'Discover', icon: 'discover', authOnly: false },
  { to: '/my-projects', label: 'My Projects', icon: 'projects', authOnly: true },
  { to: '/my-applications', label: 'My Applications', icon: 'applications', authOnly: true },
  { to: '/notifications', label: 'Notifications', icon: 'bell', authOnly: true }
];

export default function Sidebar() {
  const { user } = useAuth();
  const items = ITEMS.filter(i => !i.authOnly || user);
  if (user?.isAdmin) items.push({ to: '/admin', label: 'Admin', icon: 'admin', authOnly: true });

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-ink/10 dark:border-ink-dark/10 min-h-[calc(100vh-73px)] px-4 py-6">
      <nav className="flex flex-col gap-1">
        {items.map(item => (
          <NavLink
            key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive
                ? 'bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark'
                : 'text-ink/60 dark:text-ink-dark/60 hover:bg-page dark:hover:bg-pagedark'}`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="mt-auto pt-6">
          <div className="rounded-xl bg-gradient-to-br from-violet to-sky dark:from-violet-dark dark:to-sky-dark p-4 text-white">
            <p className="font-display font-semibold text-sm">Build something amazing together</p>
            <p className="text-xs opacity-80 mt-1 mb-3">Find the right people and turn ideas into real products.</p>
            <Link to="/create" className="block text-center bg-white/95 text-violet-text text-xs font-semibold py-2 rounded-lg">
              Create Project
            </Link>
          </div>
          <p className="text-[10px] text-ink/30 dark:text-ink-dark/30 mt-4">© {new Date().getFullYear()} Idea Blend. All rights reserved.</p>
        </div>
      )}
    </aside>
  );
}

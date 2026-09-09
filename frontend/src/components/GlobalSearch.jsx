import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import { Avatar } from './BlendRings';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [builders, setBuilders] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setProjects([]);
      setBuilders([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const [projectData, userData] = await Promise.all([
        get(`/projects?q=${encodeURIComponent(value)}&pageSize=4`),
        get(`/users?q=${encodeURIComponent(value)}&pageSize=4`)
      ]);
      setProjects(projectData.projects || []);
      setBuilders(userData.users || []);
    }, 250);
  }

  function go(path) {
    setOpen(false);
    setQuery('');
    navigate(path);
  }

  const hasResults = projects.length > 0 || builders.length > 0;

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-ink-dark/40">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Search projects, people, or roles..."
          className="w-full pl-9 pr-14 py-2 rounded-lg border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark text-sm"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink/30 dark:text-ink-dark/30 border border-ink/15 dark:border-ink-dark/15 rounded px-1.5 py-0.5">⌘K</span>
      </div>

      {open && query.trim() && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-full bg-surface dark:bg-surfacedark border border-ink/20 dark:border-ink-dark/20 rounded-xl shadow-lg z-30 max-h-96 overflow-y-auto">
            {!hasResults ? (
              <p className="p-4 text-sm text-ink/50 dark:text-ink-dark/50">No matches yet.</p>
            ) : (
              <>
                {projects.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] px-4 pt-3 pb-1 text-ink/40 dark:text-ink-dark/40">PROJECTS</p>
                    {projects.map(p => (
                      <button key={p.id} onClick={() => go(`/projects/${p.id}`)} className="w-full text-left px-4 py-2 text-sm hover:bg-page dark:hover:bg-pagedark">
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
                {builders.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] px-4 pt-3 pb-1 text-ink/40 dark:text-ink-dark/40">BUILDERS</p>
                    {builders.map(b => (
                      <button key={b.id} onClick={() => go(`/users/${b.id}`)} className="w-full text-left px-4 py-2 text-sm hover:bg-page dark:hover:bg-pagedark flex items-center gap-2">
                        <Avatar user={b} size={20} />
                        {b.name || 'Unnamed builder'}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import { Avatar } from './BlendRings';
import { Input } from './ui/Field';
import { Search } from './ui/icons';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function handleChange(event) {
    const value = event.target.value;
    setQuery(value);
    setError('');
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setProjects([]);
      setBuilders([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const [projectData, userData] = await Promise.all([
          get(`/projects?q=${encodeURIComponent(value)}&pageSize=4`),
          get(`/users?q=${encodeURIComponent(value)}&pageSize=4`)
        ]);
        setProjects(projectData.projects || []);
        setBuilders(userData.users || []);
      } catch (err) {
        setProjects([]);
        setBuilders([]);
        setError('Search is unavailable right now.');
      }
    }, 250);
  }

  function go(path) {
    setOpen(false);
    setQuery('');
    navigate(path);
  }

  const hasResults = projects.length > 0 || builders.length > 0;

  return (
    <div className="relative max-w-md flex-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ui-subtle" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Search projects, people, or roles..."
          aria-label="Search Idea Blend"
          className="py-2 pl-9 pr-14"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-ui-line/15 px-1.5 py-0.5 font-mono text-[10px] text-ui-subtle">
          ⌘K
        </span>
      </div>

      {open && query.trim() && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-ui-line/15 bg-ui-surface shadow-card-hover dark:shadow-card-dark">
            {error ? (
              <p className="p-4 text-sm text-red-500">{error}</p>
            ) : !hasResults ? (
              <p className="p-4 text-sm text-ui-muted">No matches yet.</p>
            ) : (
              <>
                {projects.length > 0 && (
                  <div className="py-1">
                    <p className="px-4 pb-1 pt-2 font-mono text-2xs uppercase tracking-[0.12em] text-ui-subtle">
                      Projects
                    </p>
                    {projects.map(project => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => go(`/projects/${project.id}`)}
                        className="block w-full px-4 py-2 text-left text-sm text-ui-fg transition-colors hover:bg-ui-raised/60"
                      >
                        {project.title}
                      </button>
                    ))}
                  </div>
                )}
                {builders.length > 0 && (
                  <div className="border-t border-ui-line/10 py-1">
                    <p className="px-4 pb-1 pt-2 font-mono text-2xs uppercase tracking-[0.12em] text-ui-subtle">
                      Builders
                    </p>
                    {builders.map(builder => (
                      <button
                        key={builder.id}
                        type="button"
                        onClick={() => go(`/users/${builder.id}`)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ui-fg transition-colors hover:bg-ui-raised/60"
                      >
                        <Avatar user={builder} size={20} />
                        {builder.name || 'Unnamed builder'}
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

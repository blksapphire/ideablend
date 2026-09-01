import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import ProjectCard from '../components/ProjectCard';

export default function MyProjects() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('owned');

  useEffect(() => { get('/projects/mine').then(setData); }, []);

  if (!data) return <p className="max-w-5xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  const list = tab === 'owned' ? data.owned : data.joined;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl mb-6">My projects</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('owned')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'owned' ? 'bg-violet dark:bg-violet-dark text-white' : 'border border-ink/15 dark:border-ink-dark/15'}`}
        >
          Owned ({data.owned.length})
        </button>
        <button
          onClick={() => setTab('joined')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'joined' ? 'bg-violet dark:bg-violet-dark text-white' : 'border border-ink/15 dark:border-ink-dark/15'}`}
        >
          Joined ({data.joined.length})
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">
          {tab === 'owned' ? "You haven't posted a project yet." : "You haven't joined any projects yet."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {list.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}

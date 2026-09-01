import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../lib/api';
import ProjectCard from '../components/ProjectCard';
import { Avatar } from '../components/BlendRings';

const CATEGORIES = ['fintech', 'ai-ml', 'mobile', 'design', 'web'];
const PAGE_SIZE = 12;

function FeaturedSection() {
  const [featured, setFeatured] = useState(null);

  useEffect(() => { get('/discover/featured').then(setFeatured).catch(() => setFeatured(null)); }, []);

  if (!featured || (featured.projects.length === 0 && featured.builders.length === 0)) return null;

  return (
    <div className="mb-10">
      {featured.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-bold text-lg mb-3">Featured projects</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {featured.projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}
      {featured.builders.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg mb-3">Active builders</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {featured.builders.map(b => (
              <Link key={b.id} to={`/users/${b.id}`} className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4 hover:border-violet/40 dark:hover:border-violet-dark/40 transition-colors">
                <div className="flex items-center gap-2">
                  <Avatar user={b} size={36} />
                  <div>
                    <div className="font-semibold text-sm">{b.name || 'Unnamed builder'}</div>
                    {b.headline && <div className="text-xs text-ink/50 dark:text-ink-dark/50">{b.headline}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <p className="font-mono text-[11px] text-ink/40 dark:text-ink-dark/40 mt-3">Featured picks rotate every 4 hours.</p>
    </div>
  );
}

function ProjectsBrowse() {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(targetPage = page) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('page', targetPage);
    params.set('pageSize', PAGE_SIZE);
    const data = await get(`/projects?${params.toString()}`);
    setProjects(data.projects || []);
    setTotalPages(data.totalPages || 1);
    setPage(data.page || 1);
    setLoading(false);
  }

  useEffect(() => { load(1); }, [category]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={e => { e.preventDefault(); load(1); }} className="flex-1 min-w-[200px]">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects"
            className="w-full p-2.5 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark text-sm" />
        </form>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="p-2.5 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">No projects match yet. Try a different search.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-4 py-2 rounded-lg border border-ink/15 dark:border-ink-dark/15 text-sm font-semibold disabled:opacity-30">Previous</button>
              <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="px-4 py-2 rounded-lg border border-ink/15 dark:border-ink-dark/15 text-sm font-semibold disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BuildersBrowse() {
  const [builders, setBuilders] = useState([]);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(targetPage = 1) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (skill) params.set('skill', skill);
    params.set('page', targetPage);
    params.set('pageSize', PAGE_SIZE);
    const data = await get(`/users?${params.toString()}`);
    setBuilders(data.users || []);
    setTotalPages(data.totalPages || 1);
    setPage(data.page || 1);
    setLoading(false);
  }

  useEffect(() => { load(1); }, []);

  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); load(1); }} className="flex flex-wrap gap-3 mb-6">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or headline"
          className="flex-1 min-w-[200px] p-2.5 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark text-sm" />
        <input value={skill} onChange={e => setSkill(e.target.value)} placeholder="Skill (e.g. React)"
          className="w-48 p-2.5 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark text-sm" />
        <button className="px-4 py-2.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">Search</button>
      </form>

      {loading ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">Loading…</p>
      ) : builders.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">No builders match yet.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {builders.map(b => (
              <Link key={b.id} to={`/users/${b.id}`} className="block rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-5 hover:border-violet/40 dark:hover:border-violet-dark/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar user={b} size={40} />
                  <div>
                    <div className="font-semibold text-sm">{b.name || 'Unnamed builder'}</div>
                    {b.headline && <div className="text-xs text-ink/50 dark:text-ink-dark/50">{b.headline}</div>}
                  </div>
                </div>
                {b.userSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {b.userSkills.slice(0, 4).map(us => (
                      <span key={us.skillId} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark">{us.skill.name}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-4 py-2 rounded-lg border border-ink/15 dark:border-ink-dark/15 text-sm font-semibold disabled:opacity-30">Previous</button>
              <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="px-4 py-2 rounded-lg border border-ink/15 dark:border-ink-dark/15 text-sm font-semibold disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Explore() {
  const [mode, setMode] = useState('projects');

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl mb-6">Discover</h1>

      <FeaturedSection />

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode('projects')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === 'projects' ? 'bg-violet dark:bg-violet-dark text-white' : 'border border-ink/15 dark:border-ink-dark/15'}`}>Projects</button>
        <button onClick={() => setMode('builders')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === 'builders' ? 'bg-violet dark:bg-violet-dark text-white' : 'border border-ink/15 dark:border-ink-dark/15'}`}>Builders</button>
      </div>

      {mode === 'projects' ? <ProjectsBrowse /> : <BuildersBrowse />}
    </div>
  );
}

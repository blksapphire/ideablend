import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import ProjectCard from '../components/ProjectCard';
import BuilderCard from '../components/BuilderCard';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['fintech', 'ai-ml', 'mobile', 'design', 'web'];
const PAGE_SIZE = 12;

function RecommendedForYou({ user }) {
  const [recs, setRecs] = useState(null);

  useEffect(() => {
    if (!user) return;
    get('/discover/for-you').then(setRecs).catch(() => setRecs([]));
  }, [user]);

  if (!user || !recs || recs.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-bold text-base">Recommended for you</h2>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark">SMART MATCH</span>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {recs.map(p => (
          <div key={p.id}>
            <ProjectCard project={p} />
            {p.matchReason && <p className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1 px-1">{p.matchReason}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingProjects({ projects }) {
  if (!projects || projects.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="font-display font-bold text-base mb-3">Trending projects</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {projects.map(p => <ProjectCard key={p.id} project={p} />)}
      </div>
      <p className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40 mt-2">Rotates every 4 hours based on recent activity.</p>
    </section>
  );
}

function ActiveBuilders({ builders }) {
  if (!builders || builders.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="font-display font-bold text-base mb-3">Active builders</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {builders.map(b => <BuilderCard key={b.id} user={b} />)}
      </div>
    </section>
  );
}

function LiveActivity() {
  const [activity, setActivity] = useState(null);
  useEffect(() => { get('/discover/activity').then(setActivity).catch(() => setActivity([])); }, []);
  if (!activity) return null;

  return (
    <section className="mb-10 rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4">
      <h2 className="font-display font-bold text-base mb-3">Activity</h2>
      <ActivityFeed activities={activity} showProject emptyText="No public activity yet." />
    </section>
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
      <div className="flex flex-wrap gap-2 mb-4">
        <form onSubmit={e => { e.preventDefault(); load(1); }} className="flex-1 min-w-[200px]">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects"
            className="w-full p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
        </form>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
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
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-4 py-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold disabled:opacity-30">Previous</button>
              <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="px-4 py-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold disabled:opacity-30">Next</button>
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
      <form onSubmit={e => { e.preventDefault(); load(1); }} className="flex flex-wrap gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or headline"
          className="flex-1 min-w-[200px] p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
        <input value={skill} onChange={e => setSkill(e.target.value)} placeholder="Skill (e.g. React)"
          className="w-48 p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
        <button className="px-4 py-2.5 rounded-lg bg-sky dark:bg-sky-dark text-white text-sm font-semibold">Search</button>
      </form>

      {loading ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">Loading…</p>
      ) : builders.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">No builders match yet.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {builders.map(b => <BuilderCard key={b.id} user={b} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-4 py-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold disabled:opacity-30">Previous</button>
              <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="px-4 py-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Explore() {
  const { user } = useAuth();
  const [mode, setMode] = useState('projects');
  const [featured, setFeatured] = useState(null);

  useEffect(() => { get('/discover/featured').then(setFeatured).catch(() => setFeatured(null)); }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <h1 className="font-display font-bold text-xl mb-5">Discover</h1>

      <RecommendedForYou user={user} />
      <TrendingProjects projects={featured?.projects} />
      <ActiveBuilders builders={featured?.builders} />
      <LiveActivity />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('projects')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === 'projects' ? 'bg-sky dark:bg-sky-dark text-white' : 'border border-ink/25 dark:border-ink-dark/25'}`}>Projects</button>
        <button onClick={() => setMode('builders')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === 'builders' ? 'bg-sky dark:bg-sky-dark text-white' : 'border border-ink/25 dark:border-ink-dark/25'}`}>Builders</button>
      </div>

      {mode === 'projects' ? <ProjectsBrowse /> : <BuildersBrowse />}
    </div>
  );
}

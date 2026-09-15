import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import ProjectCard from '../components/ProjectCard';
import BuilderCard from '../components/BuilderCard';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['fintech', 'ai-ml', 'mobile', 'design', 'web'];
const PAGE_SIZE = 12;

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        {eyebrow && <div className="ib-kicker mb-2">{eyebrow}</div>}
        <h2 className="font-display font-semibold text-lg md:text-xl tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function RecommendedForYou({ user }) {
  const [recs, setRecs] = useState(null);
  useEffect(() => { if (user) get('/discover/for-you').then(setRecs).catch(() => setRecs([])); }, [user]);
  if (!user || !recs || recs.length === 0) return null;

  return (
    <section className="mb-14">
      <SectionHeading eyebrow="Smart match" title="Projects worth a closer look" action={<span className="rounded-full bg-green-soft dark:bg-green-softdark px-2.5 py-1 text-[10px] font-mono font-semibold text-green-text dark:text-green-textdark">MATCHED TO YOU</span>} />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {recs.slice(0, 3).map(p => (
          <div key={p.id} className="group">
            <ProjectCard project={p} featured />
            {p.matchReason && <p className="text-xs leading-5 text-ink/45 dark:text-ink-dark/45 mt-2.5 px-1">Why it fits: <span className="text-ink/60 dark:text-ink-dark/60">{p.matchReason}</span></p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingProjects({ projects }) {
  if (!projects || projects.length === 0) return null;
  return (
    <section className="mb-14">
      <SectionHeading eyebrow="Right now" title="Projects getting attention" />
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
    </section>
  );
}

function ActiveBuilders({ builders }) {
  if (!builders || builders.length === 0) return null;
  return (
    <section className="mb-14">
      <SectionHeading eyebrow="People to know" title="Builders looking for their next thing" />
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">{builders.map(b => <BuilderCard key={b.id} user={b} />)}</div>
    </section>
  );
}

function LiveActivity() {
  const [activity, setActivity] = useState(null);
  useEffect(() => { get('/discover/activity').then(setActivity).catch(() => setActivity([])); }, []);
  if (!activity) return null;
  return (
    <section className="mb-14 rounded-[1.5rem] border border-ink/10 dark:border-ink-dark/10 bg-ink/[0.025] dark:bg-white/[0.025] p-5 md:p-6">
      <SectionHeading eyebrow="Community" title="What is happening" />
      <ActivityFeed activities={activity} showProject emptyText="No public activity yet." />
    </section>
  );
}

function SearchField({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-ink-dark/35" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark text-sm outline-none transition focus:border-blue/40 focus:ring-4 focus:ring-blue/5" />
    </div>
  );
}

function Pager({ page, totalPages, load }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-3 mt-8">
      <button disabled={page <= 1} onClick={() => load(page - 1)} className="ib-button-secondary !px-3 !py-2 disabled:opacity-30">Previous</button>
      <span className="min-w-16 text-center font-mono text-[10px] text-ink/45 dark:text-ink-dark/45">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="ib-button-secondary !px-3 !py-2 disabled:opacity-30">Next</button>
    </div>
  );
}

function ProjectsBrowse() {
  const [projects, setProjects] = useState([]); const [q, setQ] = useState(''); const [category, setCategory] = useState(''); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  async function load(targetPage = page) { setLoading(true); try { const params = new URLSearchParams(); if (q) params.set('q', q); if (category) params.set('category', category); params.set('page', targetPage); params.set('pageSize', PAGE_SIZE); const data = await get(`/projects?${params.toString()}`); setProjects(data.projects || []); setTotalPages(data.totalPages || 1); setPage(data.page || 1); } finally { setLoading(false); } }
  useEffect(() => { load(1); }, [category]);

  return <div>
    <form onSubmit={e => { e.preventDefault(); load(1); }} className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface/80 dark:bg-surfacedark/80 p-2 flex flex-wrap gap-2 mb-6 shadow-sm">
      <SearchField value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects, problems, ideas…" />
      <select value={category} onChange={e => setCategory(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark text-sm outline-none">
        <option value="">All categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button className="ib-button-primary !rounded-xl">Search</button>
    </form>
    {loading ? <p className="text-sm text-ink/45 dark:text-ink-dark/45 py-10 text-center">Looking for projects…</p> : projects.length === 0 ? <div className="text-center py-16 border border-dashed border-ink/15 dark:border-ink-dark/15 rounded-2xl"><p className="font-medium">Nothing matched that search.</p><p className="text-sm text-ink/45 mt-1">Try a broader term or another category.</p></div> : <><div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div><Pager page={page} totalPages={totalPages} load={load} /></>}
  </div>;
}

function BuildersBrowse() {
  const [builders, setBuilders] = useState([]); const [q, setQ] = useState(''); const [skill, setSkill] = useState(''); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  async function load(targetPage = 1) { setLoading(true); try { const params = new URLSearchParams(); if (q) params.set('q', q); if (skill) params.set('skill', skill); params.set('page', targetPage); params.set('pageSize', PAGE_SIZE); const data = await get(`/users?${params.toString()}`); setBuilders(data.users || []); setTotalPages(data.totalPages || 1); setPage(data.page || 1); } finally { setLoading(false); } }
  useEffect(() => { load(1); }, []);

  return <div>
    <form onSubmit={e => { e.preventDefault(); load(1); }} className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface/80 dark:bg-surfacedark/80 p-2 flex flex-wrap gap-2 mb-6 shadow-sm">
      <SearchField value={q} onChange={e => setQ(e.target.value)} placeholder="Search people or headlines…" />
      <input value={skill} onChange={e => setSkill(e.target.value)} placeholder="Skill, e.g. React" className="w-48 px-3.5 py-2.5 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark text-sm outline-none focus:border-blue/40" />
      <button className="ib-button-primary !rounded-xl">Search</button>
    </form>
    {loading ? <p className="text-sm text-ink/45 dark:text-ink-dark/45 py-10 text-center">Finding builders…</p> : builders.length === 0 ? <div className="text-center py-16 border border-dashed border-ink/15 dark:border-ink-dark/15 rounded-2xl"><p className="font-medium">No builders matched that search.</p><p className="text-sm text-ink/45 mt-1">Try another skill or name.</p></div> : <><div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">{builders.map(b => <BuilderCard key={b.id} user={b} />)}</div><Pager page={page} totalPages={totalPages} load={load} /></>}
  </div>;
}

export default function Explore() {
  const { user } = useAuth(); const [mode, setMode] = useState('projects'); const [featured, setFeatured] = useState(null);
  useEffect(() => { get('/discover/featured').then(setFeatured).catch(() => setFeatured(null)); }, []);

  return <main className="relative max-w-6xl mx-auto px-5 md:px-6 py-10 md:py-14">
    <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue/5 blur-3xl" />
    <header className="relative mb-14 md:mb-16">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 dark:border-ink-dark/10 bg-surface/70 dark:bg-surfacedark/70 px-3 py-1.5 mb-5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-green" />
          <span className="ib-kicker !tracking-[0.12em]">Discover</span>
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.04] max-w-4xl">Find something worth building.</h1>
        <p className="text-base md:text-lg leading-7 text-ink/55 dark:text-ink-dark/55 mt-5 max-w-2xl">Explore projects with room to contribute, meet people who build, and find your next reason to make something real.</p>
      </div>
    </header>

    <RecommendedForYou user={user} />
    <TrendingProjects projects={featured?.projects} />
    <ActiveBuilders builders={featured?.builders} />
    <LiveActivity />

    <section className="pt-2">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-6">
        <div><div className="ib-kicker mb-2">Browse all</div><h2 className="font-display font-semibold text-xl md:text-2xl">Open opportunities</h2><p className="text-sm text-ink/45 dark:text-ink-dark/45 mt-2">Search the wider Idea Blend community.</p></div>
        <div className="inline-flex rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface/80 dark:bg-surfacedark/80 p-1 shadow-sm">
          <button onClick={() => setMode('projects')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'projects' ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-sm' : 'text-ink/50 dark:text-ink-dark/50 hover:text-ink dark:hover:text-ink-dark'}`}>Projects</button>
          <button onClick={() => setMode('builders')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'builders' ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-sm' : 'text-ink/50 dark:text-ink-dark/50 hover:text-ink dark:hover:text-ink-dark'}`}>People</button>
        </div>
      </div>
      {mode === 'projects' ? <ProjectsBrowse /> : <BuildersBrowse />}
    </section>
  </main>;
}

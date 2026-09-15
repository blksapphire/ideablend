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
        <h2 className="font-display font-semibold text-lg md:text-xl">{title}</h2>
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
    <section className="mb-12">
      <SectionHeading eyebrow="Picked for you" title="Projects worth a closer look" action={<span className="text-[10px] font-mono text-green-text dark:text-green-textdark">SMART MATCH</span>} />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {recs.slice(0, 3).map(p => <div key={p.id}><ProjectCard project={p} featured />{p.matchReason && <p className="text-xs text-ink/45 dark:text-ink-dark/45 mt-2 px-1">Why it fits: {p.matchReason}</p>}</div>)}
      </div>
    </section>
  );
}

function TrendingProjects({ projects }) {
  if (!projects || projects.length === 0) return null;
  return (
    <section className="mb-12">
      <SectionHeading eyebrow="Right now" title="Projects getting attention" />
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
    </section>
  );
}

function ActiveBuilders({ builders }) {
  if (!builders || builders.length === 0) return null;
  return (
    <section className="mb-12">
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
    <section className="mb-12 ib-surface rounded-2xl p-5 md:p-6">
      <SectionHeading eyebrow="Community" title="What is happening" />
      <ActivityFeed activities={activity} showProject emptyText="No public activity yet." />
    </section>
  );
}

function SearchField({ value, onChange, placeholder }) {
  return <div className="relative flex-1 min-w-[220px]"><svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-ink-dark/35" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg><input value={value} onChange={onChange} placeholder={placeholder} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface/80 dark:bg-surfacedark/80 text-sm outline-none focus:border-blue/40" /></div>;
}

function Pager({ page, totalPages, load }) {
  if (totalPages <= 1) return null;
  return <div className="flex justify-center items-center gap-4 mt-8"><button disabled={page <= 1} onClick={() => load(page - 1)} className="ib-button-secondary !px-3 !py-2 disabled:opacity-30">Previous</button><span className="font-mono text-[10px] text-ink/45 dark:text-ink-dark/45">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => load(page + 1)} className="ib-button-secondary !px-3 !py-2 disabled:opacity-30">Next</button></div>;
}

function ProjectsBrowse() {
  const [projects, setProjects] = useState([]); const [q, setQ] = useState(''); const [category, setCategory] = useState(''); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  async function load(targetPage = page) { setLoading(true); const params = new URLSearchParams(); if (q) params.set('q', q); if (category) params.set('category', category); params.set('page', targetPage); params.set('pageSize', PAGE_SIZE); const data = await get(`/projects?${params.toString()}`); setProjects(data.projects || []); setTotalPages(data.totalPages || 1); setPage(data.page || 1); setLoading(false); }
  useEffect(() => { load(1); }, [category]);

  return <div>
    <form onSubmit={e => { e.preventDefault(); load(1); }} className="flex flex-wrap gap-2 mb-6"><SearchField value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects, problems, ideas…" /><select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2.5 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark text-sm"><option value="">All categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select><button className="ib-button-primary !rounded-xl">Search</button></form>
    {loading ? <p className="text-sm text-ink/45 dark:text-ink-dark/45 py-10 text-center">Looking for projects…</p> : projects.length === 0 ? <div className="text-center py-16 border border-dashed border-ink/15 dark:border-ink-dark/15 rounded-2xl"><p className="font-medium">Nothing matched that search.</p><p className="text-sm text-ink/45 mt-1">Try a broader term or another category.</p></div> : <><div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div><Pager page={page} totalPages={totalPages} load={load} /></>}
  </div>;
}

function BuildersBrowse() {
  const [builders, setBuilders] = useState([]); const [q, setQ] = useState(''); const [skill, setSkill] = useState(''); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  async function load(targetPage = 1) { setLoading(true); const params = new URLSearchParams(); if (q) params.set('q', q); if (skill) params.set('skill', skill); params.set('page', targetPage); params.set('pageSize', PAGE_SIZE); const data = await get(`/users?${params.toString()}`); setBuilders(data.users || []); setTotalPages(data.totalPages || 1); setPage(data.page || 1); setLoading(false); }
  useEffect(() => { load(1); }, []);

  return <div>
    <form onSubmit={e => { e.preventDefault(); load(1); }} className="flex flex-wrap gap-2 mb-6"><SearchField value={q} onChange={e => setQ(e.target.value)} placeholder="Search people or headlines…" /><input value={skill} onChange={e => setSkill(e.target.value)} placeholder="Skill, e.g. React" className="w-48 px-3 py-2.5 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark text-sm" /><button className="ib-button-primary !rounded-xl">Search</button></form>
    {loading ? <p className="text-sm text-ink/45 dark:text-ink-dark/45 py-10 text-center">Finding builders…</p> : builders.length === 0 ? <div className="text-center py-16 border border-dashed border-ink/15 dark:border-ink-dark/15 rounded-2xl"><p className="font-medium">No builders matched that search.</p><p className="text-sm text-ink/45 mt-1">Try another skill or name.</p></div> : <><div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">{builders.map(b => <BuilderCard key={b.id} user={b} />)}</div><Pager page={page} totalPages={totalPages} load={load} /></>}
  </div>;
}

export default function Explore() {
  const { user } = useAuth(); const [mode, setMode] = useState('projects'); const [featured, setFeatured] = useState(null);
  useEffect(() => { get('/discover/featured').then(setFeatured).catch(() => setFeatured(null)); }, []);

  return <main className="max-w-6xl mx-auto px-5 md:px-6 py-10 md:py-14">
    <header className="max-w-3xl mb-12">
      <div className="ib-kicker mb-3">Discover</div>
      <h1 className="font-display font-bold text-3xl md:text-5xl leading-tight">See what people are building.</h1>
      <p className="text-base md:text-lg leading-7 text-ink/55 dark:text-ink-dark/55 mt-4 max-w-2xl">Find an idea that pulls you in, meet the people behind it, and find a useful place to contribute.</p>
    </header>

    <RecommendedForYou user={user} />
    <TrendingProjects projects={featured?.projects} />
    <ActiveBuilders builders={featured?.builders} />
    <LiveActivity />

    <section className="pt-4">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-6">
        <div><div className="ib-kicker mb-2">Browse</div><h2 className="font-display font-semibold text-xl">Everything open right now</h2></div>
        <div className="inline-flex rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface/70 dark:bg-surfacedark/70 p-1">
          <button onClick={() => setMode('projects')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'projects' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-ink/50 dark:text-ink-dark/50'}`}>Projects</button>
          <button onClick={() => setMode('builders')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'builders' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-ink/50 dark:text-ink-dark/50'}`}>People</button>
        </div>
      </div>
      {mode === 'projects' ? <ProjectsBrowse /> : <BuildersBrowse />}
    </section>
  </main>;
}

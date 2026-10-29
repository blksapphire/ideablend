import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import ProjectCard from '../components/ProjectCard';
import BuilderCard from '../components/BuilderCard';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
import Tabs from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Input } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import Notice from '../components/ui/Notice';
import { Search } from '../components/ui/icons';
import useDocumentMeta from '../hooks/useDocumentMeta';

const CATEGORIES = ['fintech', 'ai-ml', 'mobile', 'design', 'web'];
const PAGE_SIZE = 12;

function RecommendedForYou({ user }) {
  const [recs, setRecs] = useState(null);
  useEffect(() => {
    if (user) get('/discover/for-you').then(setRecs).catch(() => setRecs([]));
  }, [user]);
  if (!user || !recs || recs.length === 0) return null;

  return (
    <section className="mb-14">
      <SectionHeader
        kicker="Smart match"
        title="Projects worth a closer look"
        action={
          <Badge tone="green" mono size="sm">
            Matched to you
          </Badge>
        }
        className="mb-5"
      />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {recs.slice(0, 3).map(project => (
          <div key={project.id}>
            <ProjectCard project={project} featured />
            {project.matchReason && (
              <p className="mt-2.5 px-1 text-xs leading-5 text-ui-muted">
                Why it fits: <span className="text-ui-fg">{project.matchReason}</span>
              </p>
            )}
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
      <SectionHeader kicker="Right now" title="Projects getting attention" className="mb-5" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

function ActiveBuilders({ builders }) {
  if (!builders || builders.length === 0) return null;
  return (
    <section className="mb-14">
      <SectionHeader
        kicker="People to know"
        title="Builders looking for their next thing"
        className="mb-5"
      />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {builders.map(builder => (
          <BuilderCard key={builder.id} user={builder} />
        ))}
      </div>
    </section>
  );
}

function LiveActivity() {
  const [activity, setActivity] = useState(null);
  useEffect(() => {
    get('/discover/activity').then(setActivity).catch(() => setActivity([]));
  }, []);
  if (!activity) return null;
  return (
    <section className="mb-14">
      <Card tone="inset" padding="lg">
        <SectionHeader kicker="Community" title="What is happening" className="mb-5" />
        <ActivityFeed activities={activity} showProject emptyText="No public activity yet." />
      </Card>
    </section>
  );
}

function SearchField({ value, onChange, placeholder, label }) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ui-subtle" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        className="pl-10"
      />
    </div>
  );
}

function Pager({ page, totalPages, load }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
        Previous
      </Button>
      <span className="min-w-16 text-center font-mono text-2xs text-ui-subtle">
        {page} / {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
        Next
      </Button>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
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
  const [error, setError] = useState('');

  async function load(targetPage = page) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      params.set('page', targetPage);
      params.set('pageSize', PAGE_SIZE);
      const data = await get(`/projects?${params.toString()}`);
      setProjects(data.projects || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      setError(err.message || 'Could not load projects right now.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [category]);

  function clearFilters() {
    setQ('');
    setCategory('');
    load(1);
  }

  return (
    <div>
      <form
        onSubmit={event => {
          event.preventDefault();
          load(1);
        }}
        className="mb-6 flex flex-wrap gap-2 rounded-card border border-ui-line/10 bg-ui-surface/80 p-2 shadow-card dark:bg-ui-surface/60"
      >
        <SearchField
          value={q}
          onChange={event => setQ(event.target.value)}
          placeholder="Search projects, problems, ideas…"
          label="Search projects"
        />
        <select
          value={category}
          onChange={event => setCategory(event.target.value)}
          aria-label="Filter by category"
          className="ib-input w-auto py-2.5"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {error && (
        <Notice tone="error" className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => load(page)}>
              Try again
            </Button>
          </div>
        </Notice>
      )}

      {loading ? (
        <ResultsSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Nothing matched that search."
          description="Try a broader term or another category."
          action={
            (q || category) && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <Pager page={page} totalPages={totalPages} load={load} />
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
  const [error, setError] = useState('');

  async function load(targetPage = 1) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (skill) params.set('skill', skill);
      params.set('page', targetPage);
      params.set('pageSize', PAGE_SIZE);
      const data = await get(`/users?${params.toString()}`);
      setBuilders(data.users || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      setError(err.message || 'Could not load builders right now.');
      setBuilders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  function clearFilters() {
    setQ('');
    setSkill('');
    load(1);
  }

  return (
    <div>
      <form
        onSubmit={event => {
          event.preventDefault();
          load(1);
        }}
        className="mb-6 flex flex-wrap gap-2 rounded-card border border-ui-line/10 bg-ui-surface/80 p-2 shadow-card dark:bg-ui-surface/60"
      >
        <SearchField
          value={q}
          onChange={event => setQ(event.target.value)}
          placeholder="Search people or headlines…"
          label="Search people"
        />
        <Input
          value={skill}
          onChange={event => setSkill(event.target.value)}
          placeholder="Skill, e.g. React"
          aria-label="Filter by skill"
          className="w-48 py-2.5"
        />
        <Button type="submit">Search</Button>
      </form>

      {error && (
        <Notice tone="error" className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => load(page)}>
              Try again
            </Button>
          </div>
        </Notice>
      )}

      {loading ? (
        <ResultsSkeleton />
      ) : builders.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No builders matched that search."
          description="Try another skill or name."
          action={
            (q || skill) && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {builders.map(builder => (
              <BuilderCard key={builder.id} user={builder} />
            ))}
          </div>
          <Pager page={page} totalPages={totalPages} load={load} />
        </>
      )}
    </div>
  );
}

export default function Explore() {
  useDocumentMeta({
    title: 'Explore',
    description:
      'Explore projects with room to contribute and meet builders looking for their next collaboration.'
  });

  const { user } = useAuth();
  const [mode, setMode] = useState('projects');
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    get('/discover/featured').then(setFeatured).catch(() => setFeatured(null));
  }, []);

  return (
    <main className="relative mx-auto max-w-shell px-5 py-10 md:px-6 md:py-14">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue/5 blur-3xl" />

      <PageHeader
        kicker="Discover"
        title="Find something worth building."
        description="Explore projects with room to contribute, meet people who build, and find your next reason to make something real."
        className="relative mb-14 md:mb-16"
      />

      <RecommendedForYou user={user} />
      <TrendingProjects projects={featured?.projects} />
      <ActiveBuilders builders={featured?.builders} />
      <LiveActivity />

      <section className="pt-2">
        <SectionHeader
          kicker="Browse all"
          title="Open opportunities"
          description="Search the wider Idea Blend community."
          action={
            <Tabs
              tabs={[
                { value: 'projects', label: 'Projects' },
                { value: 'builders', label: 'People' }
              ]}
              value={mode}
              onChange={setMode}
              label="Browse projects or people"
            />
          }
          className="mb-6"
        />
        {mode === 'projects' ? <ProjectsBrowse /> : <BuildersBrowse />}
      </section>
    </main>
  );
}

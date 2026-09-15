import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post, patch, del } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/BlendRings';
import ActivityFeed from '../components/ActivityFeed';

const COLUMNS = [
  { key: 'TODO', label: 'To do', short: 'TODO' },
  { key: 'IN_PROGRESS', label: 'In progress', short: 'DOING' },
  { key: 'IN_REVIEW', label: 'In review', short: 'REVIEW' },
  { key: 'DONE', label: 'Done', short: 'DONE' }
];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'team', label: 'Team' }
];

const surface = 'ib-surface rounded-2xl';

function SectionLabel({ children, count }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="ib-kicker">{children}</span>
      {count != null && <span className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40">{count}</span>}
    </div>
  );
}

function ProgressBar({ value, tone = 'blue' }) {
  return (
    <div className="h-2 rounded-full bg-ink/8 dark:bg-ink-dark/8 overflow-hidden">
      <div className={`h-full rounded-full ${tone === 'green' ? 'bg-green dark:bg-green-dark' : 'bg-blue dark:bg-blue-dark'} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function WorkspaceHeader({ project, tasks, isOwner, onTab, activeTab }) {
  const done = tasks.filter(t => t.status === 'DONE').length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const members = project.roles?.flatMap(r => r.memberships || []) || [];

  return (
    <header className="relative overflow-hidden rounded-[1.75rem] bg-ink text-white dark:bg-zinc-950 border border-ink/10 dark:border-white/10 p-5 sm:p-7 mb-6">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue/20 blur-3xl" />
      <div className="absolute -left-24 -bottom-32 h-64 w-64 rounded-full bg-green/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Link to={`/projects/${project.id}`} className="text-xs text-white/50 hover:text-white transition">← Project</Link>
          <span className="text-white/20">/</span>
          <span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/45">Workspace</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {project.category && <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70">{project.category}</span>}
              {project.stage && <span className="rounded-full bg-blue/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-blue-200">{project.stage}</span>}
              {isOwner && <span className="rounded-full bg-green/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-green-200">Owner</span>}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{project.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Your team workspace for planning, building and shipping together.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-[260px]">
            <div className="rounded-xl bg-white/[.06] border border-white/10 p-3">
              <div className="font-display text-lg font-bold">{progress}%</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">Progress</div>
            </div>
            <div className="rounded-xl bg-white/[.06] border border-white/10 p-3">
              <div className="font-display text-lg font-bold">{members.length}</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">Builders</div>
            </div>
            <div className="rounded-xl bg-white/[.06] border border-white/10 p-3">
              <div className="font-display text-lg font-bold">{tasks.length}</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">Tasks</div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1"><ProgressBar value={progress} /></div>
          <span className="font-mono text-[10px] text-white/40">{done}/{tasks.length || 0} complete</span>
        </div>
        <div className="mt-6 flex gap-1 overflow-x-auto border-t border-white/10 pt-3">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => onTab(tab.key)} className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${activeTab === tab.key ? 'bg-white text-ink' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function QuickStats({ tasks, project }) {
  const done = tasks.filter(t => t.status === 'DONE').length;
  const review = tasks.filter(t => t.status === 'IN_REVIEW').length;
  const members = project.roles?.flatMap(r => r.memberships || []) || [];
  const openRoles = project.roles?.filter(r => (r.memberships || []).length === 0).length || 0;
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {[
        ['Completed', done, 'green'],
        ['In review', review, 'blue'],
        ['Team', members.length, 'neutral'],
        ['Open roles', openRoles, 'neutral']
      ].map(([label, value, tone]) => (
        <div key={label} className={`${surface} p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink/50 dark:text-ink-dark/50">{label}</span>
            <span className={`h-2 w-2 rounded-full ${tone === 'green' ? 'bg-green dark:bg-green-dark' : tone === 'blue' ? 'bg-blue dark:bg-blue-dark' : 'bg-ink/20 dark:bg-ink-dark/20'}`} />
          </div>
          <div className="font-display text-xl font-bold mt-2">{value}</div>
        </div>
      ))}
    </div>
  );
}

function TaskBoard({ projectId, tasks, setTasks, isOwner }) {
  const [newTask, setNewTask] = useState('');
  const [error, setError] = useState('');

  async function addTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setError('');
    try {
      const task = await post(`/projects/${projectId}/tasks`, { title: newTask.trim() });
      setTasks(current => [...current, task]);
      setNewTask('');
    } catch (err) { setError(err.message); }
  }

  async function moveTask(taskId, status) {
    setError('');
    try {
      const updated = await patch(`/tasks/${taskId}`, { status });
      setTasks(current => current.map(task => task.id === taskId ? updated : task));
    } catch (err) { setError(err.message); }
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div><SectionLabel count={tasks.length}>Project board</SectionLabel><h2 className="font-display text-xl font-bold">Build queue</h2><p className="text-sm text-ink/50 dark:text-ink-dark/50 mt-1">Move work forward and keep everyone aligned.</p></div>
        <form onSubmit={addTask} className="flex gap-2 sm:w-auto w-full">
          <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="What needs doing?" className="min-w-0 flex-1 sm:w-64 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue/20" />
          <button className="ib-button-primary shrink-0">Add task</button>
        </form>
      </div>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 overflow-x-auto">
        {COLUMNS.map(column => {
          const columnTasks = tasks.filter(task => task.status === column.key);
          return (
            <div key={column.key} className="min-h-48 rounded-2xl bg-ink/[.025] dark:bg-white/[.025] border border-ink/5 dark:border-white/5 p-2.5">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${column.key === 'DONE' ? 'bg-green dark:bg-green-dark' : column.key === 'IN_REVIEW' ? 'bg-blue dark:bg-blue-dark' : 'bg-ink/25 dark:bg-ink-dark/25'}`} /><span className="text-xs font-semibold">{column.label}</span></div>
                <span className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40">{columnTasks.length}</span>
              </div>
              <div className="space-y-2">
                {columnTasks.map(task => {
                  const locked = !isOwner && task.status === 'IN_REVIEW';
                  const options = isOwner ? COLUMNS : COLUMNS.filter(c => c.key !== 'DONE');
                  return (
                    <div key={task.id} className="group rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <p className="text-sm leading-5 font-medium">{task.title}</p>
                      {locked ? <p className="mt-2 font-mono text-[10px] text-blue-text dark:text-blue-textdark">Awaiting owner review</p> : <select value={task.status} onChange={e => moveTask(task.id, e.target.value)} className="mt-3 w-full rounded-lg border border-ink/10 dark:border-ink-dark/10 bg-page dark:bg-pagedark px-2 py-1.5 text-[11px] outline-none">{options.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select>}
                    </div>
                  );
                })}
                {columnTasks.length === 0 && <div className="rounded-xl border border-dashed border-ink/10 dark:border-ink-dark/10 px-3 py-6 text-center text-xs text-ink/35 dark:text-ink-dark/35">Nothing here yet</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Milestones({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const load = () => get(`/projects/${projectId}/milestones`).then(setMilestones).catch(() => setMilestones([]));
  useEffect(() => { load(); }, [projectId]);
  async function add(e) { e.preventDefault(); if (!title.trim()) return; try { await post(`/projects/${projectId}/milestones`, { title: title.trim() }); setTitle(''); load(); } catch (err) { setError(err.message); } }
  async function toggle(m) { try { await patch(`/milestones/${m.id}`, { completed: !m.completed }); load(); } catch (err) { setError(err.message); } }
  const done = milestones.filter(m => m.completed).length;
  const progress = milestones.length ? Math.round(done / milestones.length * 100) : 0;
  return (
    <section className={`${surface} p-5`}>
      <SectionLabel count={milestones.length}>Milestones</SectionLabel>
      <div className="flex items-end justify-between mb-3"><h3 className="font-display text-lg font-bold">Ship it in steps</h3><span className="font-mono text-xs text-ink/45 dark:text-ink-dark/45">{progress}%</span></div>
      <ProgressBar value={progress} tone="green" />
      <div className="mt-4 space-y-1">
        {milestones.map(m => <label key={m.id} className="flex gap-3 items-center rounded-xl px-2 py-2 hover:bg-ink/[.03] dark:hover:bg-white/[.03] cursor-pointer"><input type="checkbox" checked={m.completed} onChange={() => toggle(m)} className="accent-green" /><span className={`text-sm ${m.completed ? 'line-through text-ink/35 dark:text-ink-dark/35' : ''}`}>{m.title}</span></label>)}
        {milestones.length === 0 && <p className="py-3 text-sm text-ink/40 dark:text-ink-dark/40">No milestones yet.</p>}
      </div>
      <form onSubmit={add} className="flex gap-2 mt-4"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add milestone" className="flex-1 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-page dark:bg-pagedark px-3 py-2 text-sm" /><button className="ib-button-secondary">Add</button></form>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </section>
  );
}

function Roster({ project, isOwner, onChanged }) {
  const [reassigning, setReassigning] = useState(null);
  const [error, setError] = useState('');
  const rows = project.roles?.flatMap(role => (role.memberships || []).map(membership => ({ membership, role }))) || [];
  async function reassign(membershipId, roleId) { try { await post(`/memberships/${membershipId}/reassign`, { toRoleId: Number(roleId) }); setReassigning(null); onChanged(); } catch (err) { setError(err.message); } }
  async function removeRole(id) { try { await del(`/memberships/${id}`); onChanged(); } catch (err) { setError(err.message); } }
  async function removeProject(userId) { try { await post(`/projects/${project.id}/members/${userId}/remove`, {}); onChanged(); } catch (err) { setError(err.message); } }
  return (
    <section className={`${surface} p-5`}>
      <SectionLabel count={rows.length}>Team</SectionLabel>
      <h3 className="font-display text-lg font-bold mb-4">People building this</h3>
      <div className="space-y-2">
        {rows.map(({ membership, role }) => <div key={membership.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-ink/5 dark:border-white/5 p-3"><div className="flex items-center gap-3 min-w-0"><Avatar user={membership.user} size={36} /><div className="min-w-0"><Link to={`/users/${membership.user?.id}`} className="text-sm font-semibold hover:text-blue-text dark:hover:text-blue-textdark">{membership.user?.name || membership.user?.email}</Link><div className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40 truncate">{role.name}</div></div></div>{isOwner && (reassigning === membership.id ? <div className="flex gap-2"><select defaultValue="" onChange={e => e.target.value && reassign(membership.id, e.target.value)} className="rounded-lg border border-ink/10 dark:border-ink-dark/10 bg-page dark:bg-pagedark p-2 text-xs"><option value="" disabled>Move to…</option>{project.roles.filter(r => r.id !== role.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><button onClick={() => setReassigning(null)} className="text-xs text-ink/45">Cancel</button></div> : <div className="flex flex-wrap gap-3 text-xs"><button onClick={() => setReassigning(membership.id)} className="font-semibold text-blue-text dark:text-blue-textdark">Reassign</button><button onClick={() => removeRole(membership.id)} className="text-ink/45">Remove role</button><button onClick={() => removeProject(membership.user.id)} className="text-red-500">Remove</button></div>)}</div>)}
        {rows.length === 0 && <div className="rounded-xl border border-dashed border-ink/10 dark:border-ink-dark/10 py-8 text-center text-sm text-ink/40 dark:text-ink-dark/40">No confirmed members yet.</div>}
      </div>
      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
    </section>
  );
}

function ProjectActivity({ projectId }) {
  const [activity, setActivity] = useState(null);
  useEffect(() => { get(`/projects/${projectId}/activity`).then(setActivity).catch(() => setActivity([])); }, [projectId]);
  return <section className={`${surface} p-5`}><SectionLabel>Recent activity</SectionLabel><ActivityFeed activities={activity} /></section>;
}

function ReviewTeammates({ projectId }) {
  const [pending, setPending] = useState([]); const [ratings, setRatings] = useState({}); const [comments, setComments] = useState({}); const [error, setError] = useState('');
  const load = () => get(`/projects/${projectId}/teammates-to-review`).then(setPending).catch(() => setPending([]));
  useEffect(() => { load(); }, [projectId]);
  async function submit(id) { try { await post(`/projects/${projectId}/reviews`, { revieweeId: id, rating: ratings[id] || 5, comment: comments[id] || undefined }); load(); } catch (err) { setError(err.message); } }
  if (!pending.length) return null;
  return <section className={`${surface} p-5`}><SectionLabel>Collaboration</SectionLabel><h3 className="font-display text-lg font-bold">Rate your teammates</h3><p className="text-sm text-ink/50 dark:text-ink-dark/50 mt-1 mb-4">The project is complete. Leave a quick review for people you worked with.</p><div className="space-y-4">{pending.map(p => <div key={p.id} className="rounded-xl border border-ink/10 dark:border-ink-dark/10 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-sm">{p.name}</span><div>{[1,2,3,4,5].map(n => <button key={n} onClick={() => setRatings(r => ({...r,[p.id]:n}))} className={`px-0.5 ${n <= (ratings[p.id] || 5) ? 'text-green dark:text-green-dark' : 'text-ink/15'}`}>★</button>)}</div></div><input value={comments[p.id] || ''} onChange={e => setComments(c => ({...c,[p.id]:e.target.value}))} placeholder="Optional comment" className="mt-3 w-full rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-page dark:bg-pagedark px-3 py-2 text-sm" /><button onClick={() => submit(p.id)} className="ib-button-primary mt-3">Submit review</button></div>)}</div>{error && <p className="text-xs text-red-500 mt-3">{error}</p>}</section>;
}

function ChatPanel({ projectId, messages, user }) {
  const [text, setText] = useState(''); const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  function send() { if (!text.trim()) return; getSocket().emit('message', { projectId, content: text.trim() }); setText(''); }
  return <section className={`${surface} p-5 flex flex-col h-[430px]`}><div className="flex items-center justify-between mb-4"><div><SectionLabel>Team room</SectionLabel><h3 className="font-display text-lg font-bold">Chat</h3></div><span className="h-2 w-2 rounded-full bg-green dark:bg-green-dark" /></div><div className="flex-1 overflow-y-auto space-y-4 pr-1">{messages.map(m => { const mine = m.authorId === user?.id; return <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}><Avatar user={m.author} size={28} /><div className={`max-w-[80%] ${mine ? 'text-right' : ''}`}><div className="font-mono text-[9px] text-ink/35 dark:text-ink-dark/35 mb-1">{m.author ? <Link to={`/users/${m.author.id}`} className="hover:text-blue-text">{m.author.name}</Link> : 'Unknown'}</div><div className={`inline-block rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-blue text-white' : 'bg-ink/5 dark:bg-white/5'}`}>{m.content}</div></div></div>; })}{!messages.length && <div className="h-full grid place-items-center text-sm text-ink/35 dark:text-ink-dark/35">Start the conversation.</div>}<div ref={endRef} /></div><div className="flex gap-2 mt-4"><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message your team…" className="flex-1 rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-page dark:bg-pagedark px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue/20" /><button onClick={send} className="ib-button-primary">Send</button></div></section>;
}

export default function Workspace() {
  const { id } = useParams();
  const projectId = Number(id);
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState('overview');

  function loadProject() { get(`/projects/${id}`).then(setProject); }
  useEffect(() => {
    loadProject();
    get(`/projects/${id}/tasks`).then(setTasks).catch(() => setTasks([]));
    get(`/projects/${id}/messages`).then(setMessages).catch(() => setMessages([]));
    const socket = getSocket();
    socket.emit('joinRoom', { projectId });
    const onMessage = message => setMessages(current => [...current, message]);
    socket.on('message', onMessage);
    return () => socket.off('message', onMessage);
  }, [id]);

  if (!project) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16"><div className="h-48 rounded-3xl bg-ink/5 dark:bg-white/5 animate-pulse" /></main>;

  const isOwner = user && user.id === project.owner.id;
  const done = tasks.filter(t => t.status === 'DONE').length;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const members = project.roles?.flatMap(r => r.memberships || []) || [];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <WorkspaceHeader project={project} tasks={tasks} isOwner={isOwner} onTab={setTab} activeTab={tab} />
      <div className="space-y-6">
        {tab === 'overview' && <>
          <QuickStats tasks={tasks} project={project} />
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6"><Milestones projectId={project.id} /><ProjectActivity projectId={project.id} /><ReviewTeammates projectId={project.id} /></div>
            <div className="space-y-6"><ChatPanel projectId={project.id} messages={messages} user={user} /><div className={`${surface} p-5`}><SectionLabel>Project</SectionLabel><h3 className="font-display text-lg font-bold">Keep building.</h3><p className="text-sm leading-6 text-ink/50 dark:text-ink-dark/50 mt-2">{progress}% of tracked tasks are complete. {members.length} builders are currently connected to this workspace.</p><Link to={`/projects/${project.id}`} className="ib-button-secondary mt-4 w-full">View project page</Link></div></div>
          </div>
        </>}
        {tab === 'tasks' && <><TaskBoard projectId={project.id} tasks={tasks} setTasks={setTasks} isOwner={isOwner} /><div className="lg:hidden mt-6"><ChatPanel projectId={project.id} messages={messages} user={user} /></div></>}
        {tab === 'team' && <div className="grid lg:grid-cols-[1fr_360px] gap-6"><Roster project={project} isOwner={isOwner} onChanged={loadProject} /><ChatPanel projectId={project.id} messages={messages} user={user} /></div>}
      </div>
    </main>
  );
}

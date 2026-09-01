import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post, patch, del } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/BlendRings';

const COLUMNS = [
  { key: 'TODO', label: 'To do' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'IN_REVIEW', label: 'In review' },
  { key: 'DONE', label: 'Done' }
];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'team', label: 'Team' }
];

const ACTIVITY_ICON = {
  MEMBER_JOINED: '→', MEMBER_REMOVED: '✕', TASK_CREATED: '+', TASK_COMPLETED: '✓',
  MILESTONE_CREATED: '◆', MILESTONE_COMPLETED: '★', PROJECT_COMPLETED: '🎉'
};

function Roster({ project, isOwner, onChanged }) {
  const [reassigning, setReassigning] = useState(null);
  const [error, setError] = useState('');

  const rows = project.roles.flatMap(role => (role.memberships || []).map(m => ({ membership: m, role })));

  async function reassign(membershipId, toRoleId) {
    setError('');
    try {
      await post(`/memberships/${membershipId}/reassign`, { toRoleId: Number(toRoleId) });
      setReassigning(null);
      onChanged();
    } catch (err) { setError(err.message); }
  }
  async function removeFromRole(membershipId) {
    setError('');
    try { await del(`/memberships/${membershipId}`); onChanged(); } catch (err) { setError(err.message); }
  }
  async function removeFromProject(userId) {
    setError('');
    try { await post(`/projects/${project.id}/members/${userId}/remove`, {}); onChanged(); } catch (err) { setError(err.message); }
  }

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
      <h3 className="font-semibold text-sm mb-3">Team</h3>
      {rows.length === 0 && <p className="text-sm text-ink/50 dark:text-ink-dark/50">No confirmed members yet.</p>}
      <div className="space-y-2">
        {rows.map(({ membership, role }) => (
          <div key={membership.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Avatar user={membership.user} size={28} />
              <Link to={`/users/${membership.user?.id}`} className="font-medium hover:text-violet-text dark:hover:text-violet-textdark">{membership.user?.name || membership.user?.email}</Link>
              <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">— {role.name}</span>
            </div>
            {isOwner && (
              reassigning === membership.id ? (
                <div className="flex items-center gap-2">
                  <select onChange={e => e.target.value && reassign(membership.id, e.target.value)} defaultValue=""
                    className="text-xs p-1.5 rounded-md border border-ink/15 dark:border-ink-dark/15 bg-page dark:bg-pagedark">
                    <option value="" disabled>Move to…</option>
                    {project.roles.filter(r => r.id !== role.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button onClick={() => setReassigning(null)} className="text-xs text-ink/50 dark:text-ink-dark/50">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs">
                  <button onClick={() => setReassigning(membership.id)} className="font-semibold text-violet-text dark:text-violet-textdark">Reassign</button>
                  <button onClick={() => removeFromRole(membership.id)} className="text-ink/50 dark:text-ink-dark/50">Remove from role</button>
                  <button onClick={() => removeFromProject(membership.user.id)} className="text-red-500">Remove entirely</button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </div>
  );
}

function ReviewTeammates({ projectId }) {
  const [pending, setPending] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [error, setError] = useState('');

  function load() { get(`/projects/${projectId}/teammates-to-review`).then(setPending).catch(() => setPending([])); }
  useEffect(() => { load(); }, [projectId]);

  async function submitReview(revieweeId) {
    setError('');
    try {
      await post(`/projects/${projectId}/reviews`, { revieweeId, rating: ratings[revieweeId] || 5, comment: comments[revieweeId] || undefined });
      load();
    } catch (err) { setError(err.message); }
  }

  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
      <h3 className="font-semibold text-sm mb-1">Rate your teammates</h3>
      <p className="text-xs text-ink/50 dark:text-ink-dark/50 mb-3">This project is complete — leave a review for who you worked with.</p>
      <div className="space-y-3">
        {pending.map(p => (
          <div key={p.id} className="border-t border-ink/10 dark:border-ink-dark/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{p.name}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRatings(r => ({ ...r, [p.id]: n }))}
                    className={n <= (ratings[p.id] || 5) ? 'text-teal dark:text-teal-dark' : 'text-ink/20 dark:text-ink-dark/20'}>★</button>
                ))}
              </div>
            </div>
            <input value={comments[p.id] || ''} onChange={e => setComments(c => ({ ...c, [p.id]: e.target.value }))} placeholder="Optional comment"
              className="w-full mt-2 p-2 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-page dark:bg-pagedark text-sm" />
            <button onClick={() => submitReview(p.id)} className="mt-2 px-3 py-1.5 rounded-lg bg-teal dark:bg-teal-dark text-white text-xs font-semibold">Submit review</button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </div>
  );
}

function Milestones({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  function load() { get(`/projects/${projectId}/milestones`).then(setMilestones).catch(() => setMilestones([])); }
  useEffect(() => { load(); }, [projectId]);

  async function addMilestone(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try { await post(`/projects/${projectId}/milestones`, { title }); setTitle(''); load(); } catch (err) { setError(err.message); }
  }
  async function toggle(m) {
    try { await patch(`/milestones/${m.id}`, { completed: !m.completed }); load(); } catch (err) { setError(err.message); }
  }

  const done = milestones.filter(m => m.completed).length;
  const progress = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Milestones</h3>
        {milestones.length > 0 && <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">{progress}%</span>}
      </div>
      {milestones.length > 0 && (
        <div className="h-1.5 rounded-full bg-page dark:bg-pagedark mb-3 overflow-hidden">
          <div className="h-full bg-teal dark:bg-teal-dark" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="space-y-1.5 mb-3">
        {milestones.map(m => (
          <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={m.completed} onChange={() => toggle(m)} />
            <span className={m.completed ? 'line-through text-ink/40 dark:text-ink-dark/40' : ''}>{m.title}</span>
          </label>
        ))}
        {milestones.length === 0 && <p className="text-sm text-ink/50 dark:text-ink-dark/50">No milestones yet.</p>}
      </div>
      <form onSubmit={addMilestone} className="flex gap-2">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add a milestone"
          className="flex-1 p-2 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-page dark:bg-pagedark text-sm" />
        <button className="px-3 py-2 rounded-lg bg-violet dark:bg-violet-dark text-white text-xs font-semibold">Add</button>
      </form>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}

function ActivityFeed({ projectId }) {
  const [activity, setActivity] = useState([]);
  useEffect(() => { get(`/projects/${projectId}/activity`).then(setActivity).catch(() => setActivity([])); }, [projectId]);

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
      <h3 className="font-semibold text-sm mb-3">Activity</h3>
      {activity.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">Nothing yet.</p>
      ) : (
        <div className="space-y-2">
          {activity.map(a => (
            <div key={a.id} className="flex items-start gap-2 text-sm">
              <span className="font-mono text-xs text-violet-text dark:text-violet-textdark w-4">{ACTIVITY_ICON[a.type] || '•'}</span>
              <span className="text-ink/70 dark:text-ink-dark/70">{a.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskBoard({ projectId, tasks, setTasks, isOwner }) {
  const [newTask, setNewTask] = useState('');
  const [taskError, setTaskError] = useState('');

  async function addTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task = await post(`/projects/${projectId}/tasks`, { title: newTask });
    setTasks(t => [...t, task]);
    setNewTask('');
  }
  async function moveTask(taskId, status) {
    setTaskError('');
    try {
      const updated = await patch(`/tasks/${taskId}`, { status });
      setTasks(ts => ts.map(t => t.id === taskId ? updated : t));
    } catch (err) { setTaskError(err.message); }
  }

  return (
    <div>
      <form onSubmit={addTask} className="flex gap-2 mb-4">
        <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a task"
          className="flex-1 p-2.5 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark text-sm" />
        <button className="px-4 py-2.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">Add</button>
      </form>
      {taskError && <p className="text-sm text-red-500 mb-3">{taskError}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {COLUMNS.map(col => (
          <div key={col.key}>
            <div className="font-mono text-xs text-ink/50 dark:text-ink-dark/50 mb-2 flex justify-between">
              <span>{col.label.toUpperCase()}</span>
              <span>{tasks.filter(t => t.status === col.key).length}</span>
            </div>
            {tasks.filter(t => t.status === col.key).map(task => {
              const locked = !isOwner && task.status === 'IN_REVIEW';
              const options = isOwner ? COLUMNS : COLUMNS.filter(c => c.key !== 'DONE');
              return (
                <div key={task.id} className="bg-surface dark:bg-surfacedark border border-ink/10 dark:border-ink-dark/10 rounded-lg p-3 text-sm mb-2">
                  <p>{task.title}</p>
                  {locked ? (
                    <p className="mt-2 text-xs font-mono text-violet-text dark:text-violet-textdark">Awaiting owner review</p>
                  ) : (
                    <select value={task.status} onChange={e => moveTask(task.id, e.target.value)}
                      className="mt-2 text-xs bg-transparent border border-ink/10 dark:border-ink-dark/10 rounded-md p-1 w-full">
                      {options.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPanel({ projectId, messages, user }) {
  const [text, setText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function sendMessage() {
    if (!text.trim()) return;
    getSocket().emit('message', { projectId, content: text });
    setText('');
  }

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4 flex flex-col h-[340px]">
      <h3 className="font-semibold text-sm mb-2">Team chat</h3>
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map(m => {
          const mine = m.authorId === user?.id;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <Avatar user={m.author} size={22} />
              <div className={mine ? 'text-right' : 'text-left'}>
                <div className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40 mb-0.5">
                  {m.author ? <Link to={`/users/${m.author.id}`} className="hover:text-violet-text dark:hover:text-violet-textdark">{m.author.name}</Link> : 'Unknown'}
                </div>
                <div className="inline-block bg-page dark:bg-pagedark rounded-lg px-3 py-1.5 text-sm max-w-md break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Message the team" className="flex-1 p-2 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-page dark:bg-pagedark text-sm" />
        <button onClick={sendMessage} className="px-3 py-2 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">Send</button>
      </div>
    </div>
  );
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
    get(`/projects/${id}/tasks`).then(setTasks);
    get(`/projects/${id}/messages`).then(setMessages).catch(() => setMessages([]));

    const socket = getSocket();
    socket.emit('joinRoom', { projectId });
    socket.on('message', m => setMessages(msgs => [...msgs, m]));
    socket.on('error', e => console.error(e));
    return () => socket.off('message');
  }, [id]);

  if (!project) return <p className="max-w-4xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  const isOwner = user && user.id === project.owner.id;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const taskProgress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-sm text-ink/50 dark:text-ink-dark/50 hover:text-ink dark:hover:text-ink-dark mb-4">
        ← Back to project
      </Link>
      <h1 className="font-display font-bold text-xl mb-1">{project.title}</h1>
      <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-4">Workspace</p>

      <div className="flex gap-1 mb-6 border-b border-ink/10 dark:border-ink-dark/10 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? 'border-violet dark:border-violet-dark text-ink dark:text-ink-dark' : 'border-transparent text-ink/50 dark:text-ink-dark/50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6 mb-6">
          {project.category && (
            <div className="flex flex-wrap gap-1.5">
              <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark">{project.category.toUpperCase()}</span>
              <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-sky-soft dark:bg-sky-softdark text-sky-text dark:text-sky-textdark">{project.stage}</span>
            </div>
          )}
          {tasks.length > 0 && (
            <div className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">Task progress</h3>
                <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">{doneCount}/{tasks.length} done · {taskProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-page dark:bg-pagedark overflow-hidden">
                <div className="h-full bg-violet dark:bg-violet-dark" style={{ width: `${taskProgress}%` }} />
              </div>
            </div>
          )}
          <ReviewTeammates projectId={project.id} />
          <div className="grid md:grid-cols-2 gap-6">
            <Milestones projectId={project.id} />
            <ActivityFeed projectId={project.id} />
          </div>
        </div>
      )}

      {tab === 'tasks' && <div className="mb-6"><TaskBoard projectId={project.id} tasks={tasks} setTasks={setTasks} isOwner={isOwner} /></div>}
      {tab === 'team' && <div className="mb-6"><Roster project={project} isOwner={isOwner} onChanged={loadProject} /></div>}

      {/* chat stays visible below regardless of which tab above is active,
          instead of being buried behind its own tab */}
      <ChatPanel projectId={project.id} messages={messages} user={user} />
    </div>
  );
}

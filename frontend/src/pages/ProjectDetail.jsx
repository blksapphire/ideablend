import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post, patch, uploadFile, downloadFile, del } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RoleRings } from '../components/BlendRings';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RepoPanel({ project, isOwner, onSaved }) {
  const [editing, setEditing] = useState(false); const [value, setValue] = useState(project.repoUrl || ''); const [error, setError] = useState('');
  async function save() { setError(''); try { const updated = await patch(`/projects/${project.id}`, { repoUrl: value }); setEditing(false); onSaved(updated); } catch (err) { setError(err.message); } }
  if (!project.repoUrl && !isOwner) return null;
  return <div className="ib-surface rounded-2xl p-5 mb-5">
    <div className="flex items-center justify-between gap-3 mb-3"><div><div className="ib-kicker">Source</div><h3 className="font-semibold text-sm mt-1">Repository</h3></div><span className="font-mono text-[10px] text-green-text dark:text-green-textdark">GITHUB</span></div>
    {editing ? <div className="flex flex-col sm:flex-row gap-2"><input value={value} onChange={e => setValue(e.target.value)} placeholder="https://github.com/owner/repo" className="flex-1 p-2.5 rounded-xl border border-ink/15 dark:border-ink-dark/15 bg-page dark:bg-pagedark text-sm" /><button onClick={save} className="ib-button-primary !rounded-xl">Save</button><button onClick={() => setEditing(false)} className="ib-button-secondary !rounded-xl">Cancel</button></div> : project.repoUrl ? <div className="flex items-center justify-between gap-3"><a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-text dark:text-blue-textdark font-medium truncate">{project.repoUrl}</a>{isOwner && <button onClick={() => setEditing(true)} className="text-xs text-ink/50 dark:text-ink-dark/50 shrink-0">Edit</button>}</div> : <button onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-text dark:text-blue-textdark">+ Link a GitHub repo</button>}
    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
  </div>;
}

function GithubActivity({ projectId, repoUrl }) {
  const [activity, setActivity] = useState(null); const [error, setError] = useState('');
  useEffect(() => { if (!repoUrl) return; get(`/projects/${projectId}/github-activity`).then(setActivity).catch(err => setError(err.message)); }, [projectId, repoUrl]);
  if (!repoUrl) return null;
  if (error) return <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-5">GitHub activity unavailable: {error}</p>;
  if (!activity) return <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-5">Loading repo activity…</p>;
  return <div className="ib-surface rounded-2xl p-5 mb-5">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3"><div><div className="ib-kicker">Live signal</div><h3 className="font-semibold text-sm mt-1">{activity.fullName}</h3>{activity.description && <p className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1">{activity.description}</p>}</div><div className="flex gap-3 font-mono text-xs text-ink/50 dark:text-ink-dark/50"><span>★ {activity.stars}</span><span>{activity.openIssues} issues</span></div></div>
    {activity.recentCommits?.length > 0 && <div className="space-y-2 mt-4 pt-4 border-t border-ink/10 dark:border-ink-dark/10">{activity.recentCommits.map(c => <div key={c.sha} className="flex justify-between gap-3 text-xs"><span className="truncate">{c.message}</span><span className="text-ink/40 dark:text-ink-dark/40 font-mono whitespace-nowrap">{c.author} · {c.sha}</span></div>)}</div>}
  </div>;
}

function FilesPanel({ projectId, user }) {
  const [files, setFiles] = useState(null); const [error, setError] = useState(''); const [uploading, setUploading] = useState(false);
  function load() { get(`/projects/${projectId}/files`).then(setFiles).catch(() => setFiles(null)); }
  useEffect(() => { if (user) load(); }, [projectId, user]);
  async function handleUpload(e) { const file = e.target.files[0]; if (!file) return; setError(''); setUploading(true); try { await uploadFile(`/projects/${projectId}/files`, file); load(); } catch (err) { setError(err.message); } finally { setUploading(false); e.target.value = ''; } }
  async function handleDelete(fileId) { await del(`/files/${fileId}`); load(); }
  if (!user || files === null) return null;
  return <div className="ib-surface rounded-2xl p-5 mb-5"><div className="flex items-center justify-between mb-3"><div><div className="ib-kicker">Project assets</div><h3 className="font-semibold text-sm mt-1">Files</h3></div></div>{files.length === 0 && <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-3">No files yet — specs, mockups, decks.</p>}<div className="space-y-2 mb-3">{files.map(f => <div key={f.id} className="flex items-center justify-between gap-3 text-sm"><div className="min-w-0"><button onClick={() => downloadFile(`/files/${f.id}/download`, f.filename)} className="font-medium text-blue-text dark:text-blue-textdark truncate">{f.filename}</button><span className="font-mono text-xs text-ink/40 dark:text-ink-dark/40 ml-2">{formatSize(f.size)} · {f.uploader?.name}</span></div>{f.uploaderId === user.id && <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500 shrink-0">Delete</button>}</div>)}</div><label className="text-xs font-semibold text-blue-text dark:text-blue-textdark cursor-pointer">{uploading ? 'Uploading…' : '+ Upload a file (max 15MB)'}<input type="file" onChange={handleUpload} disabled={uploading} className="hidden" /></label>{error && <p className="text-sm text-red-500 mt-2">{error}</p>}</div>;
}

export default function ProjectDetail() {
  const { id } = useParams(); const { user } = useAuth(); const [project, setProject] = useState(null); const [applyingRoleId, setApplyingRoleId] = useState(null); const [applyMessage, setApplyMessage] = useState(''); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  async function load() { const data = await get(`/projects/${id}`); setProject(data); }
  useEffect(() => { load(); }, [id]);
  if (!project) return <p className="max-w-3xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;
  const isOwner = user && user.id === project.owner.id;
  async function applyToRole(roleId) { setError(''); setNotice(''); try { await post(`/projects/${project.id}/roles/${roleId}/apply`, { message: applyMessage }); setApplyingRoleId(null); setApplyMessage(''); setNotice('Application sent.'); } catch (err) { setError(err.message); } }
  const filled = project.roles.reduce((sum, role) => sum + role.filledSlots, 0); const slots = project.roles.reduce((sum, role) => sum + role.slots, 0); const progress = slots ? Math.round((filled / slots) * 100) : 0;
  return <main className="max-w-6xl mx-auto px-5 md:px-6 py-8 md:py-12">
    <div className="mb-6"><Link to="/explore" className="text-xs font-semibold text-ink/45 dark:text-ink-dark/45 hover:text-blue transition-colors">← Back to discover</Link></div>
    <section className="relative overflow-hidden rounded-[1.75rem] bg-ink dark:bg-surface p-6 md:p-9 text-white dark:text-ink-dark mb-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10 pointer-events-none" /><div className="absolute -right-8 -bottom-32 h-72 w-72 rounded-full border border-blue/20 pointer-events-none" />
      <div className="relative grid lg:grid-cols-[1fr_18rem] gap-8 items-end">
        <div><div className="flex flex-wrap gap-2">{project.category && <span className="font-mono text-[10px] px-2 py-1 rounded-md bg-white/10">{project.category.toUpperCase()}</span>}<span className="font-mono text-[10px] px-2 py-1 rounded-md bg-blue/20 text-blue-dark dark:text-blue-textdark">{project.stage}</span>{project.type && <span className="font-mono text-[10px] px-2 py-1 rounded-md bg-green/15 text-green-dark dark:text-green-textdark">{project.type.replace('_', ' ')}</span>}{project.commitment && <span className="font-mono text-[10px] px-2 py-1 rounded-md bg-white/10">{project.commitment}</span>}</div>
          <h1 className="font-display font-bold text-3xl md:text-5xl leading-tight mt-5 max-w-4xl">{project.title}</h1><p className="mt-4 text-sm md:text-base leading-7 text-white/65 dark:text-ink-dark/65 max-w-3xl">{project.description}</p>
          <div className="flex flex-wrap gap-2 mt-7">{isOwner ? <><Link to={`/projects/${project.id}/applications`} className="ib-button-primary !bg-white !text-ink">Review applications</Link><Link to={`/projects/${project.id}/workspace`} className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">Open workspace</Link><Link to={`/projects/${project.id}/edit`} className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">Edit project</Link></> : user && <Link to={`/projects/${project.id}/workspace`} className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">Open workspace</Link>}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"><div className="ib-kicker !text-white/45">Team progress</div><div className="flex items-end justify-between gap-3 mt-3"><span className="font-display text-3xl font-bold">{filled}</span><span className="font-mono text-[10px] text-white/45 mb-1">of {slots} spots filled</span></div><div className="h-1.5 rounded-full bg-white/10 mt-4 overflow-hidden"><div className="h-full rounded-full bg-green" style={{ width: `${progress}%` }} /></div><div className="flex justify-between mt-3 text-[10px] font-mono text-white/40"><span>{progress}% staffed</span><span>{project.roles.filter(r => r.filledSlots < r.slots).length} roles open</span></div></div>
      </div>
    </section>

    <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-6 items-start">
      <div><section className="ib-surface rounded-2xl p-6 mb-5"><div className="ib-kicker mb-2">Join the work</div><div className="flex items-center justify-between gap-3 mb-5"><h2 className="font-display font-semibold text-xl">Open roles</h2><span className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40">{filled}/{slots} filled</span></div>{project.roles.map(role => { const full = role.filledSlots >= role.slots; const isApplying = applyingRoleId === role.id; return <div key={role.id} className="py-5 border-t border-ink/10 dark:border-ink-dark/10 first:border-t-0 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="text-base font-semibold">{role.name}</div><div className="font-mono text-[10px] text-ink/45 dark:text-ink-dark/45 mt-1">{role.filledSlots} / {role.slots} {full ? 'filled' : 'open'}{role.experience && role.experience !== 'ANY' && ` · ${role.experience}`}{role.commitment && ` · ${role.commitment}`}</div></div><RoleRings role={role} /></div>{role.description && <p className="text-sm text-ink/55 dark:text-ink-dark/55 mt-3 leading-6">{role.description}</p>}{role.roleSkills?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{role.roleSkills.map(rs => <span key={rs.skillId} className="font-mono text-[10px] px-2 py-1 rounded-md bg-blue-soft dark:bg-blue-softdark text-blue-text dark:text-blue-textdark">{rs.skill.name}</span>)}</div>}{!isOwner && user && !full && (isApplying ? <div className="mt-4 space-y-2"><textarea value={applyMessage} onChange={e => setApplyMessage(e.target.value)} placeholder="Optional note to the owner" rows={3} className="w-full p-3 rounded-xl border border-ink/15 dark:border-ink-dark/15 bg-page dark:bg-pagedark text-sm" /><div className="flex gap-2"><button onClick={() => applyToRole(role.id)} className="ib-button-primary !rounded-xl">Send application</button><button onClick={() => setApplyingRoleId(null)} className="ib-button-secondary !rounded-xl">Cancel</button></div></div> : <button onClick={() => setApplyingRoleId(role.id)} className="mt-4 text-xs font-semibold text-blue-text dark:text-blue-textdark hover:underline">Apply for this role →</button>)}</div>);}{notice && <p className="text-sm text-green-text dark:text-green-textdark mt-4">{notice}</p>}{error && <p className="text-sm text-red-500 mt-4">{error}</p>}</section><RepoPanel project={project} isOwner={isOwner} onSaved={setProject} /><GithubActivity projectId={project.id} repoUrl={project.repoUrl} /><FilesPanel projectId={project.id} user={user} /></div>
      <aside className="lg:sticky lg:top-24 space-y-5"><div className="ib-surface rounded-2xl p-5"><div className="ib-kicker">Project snapshot</div><div className="grid grid-cols-2 gap-3 mt-4">{[['Stage', project.stage], ['Type', project.type?.replace('_', ' ') || '—'], ['Commitment', project.commitment || '—'], ['Open roles', project.roles.filter(r => r.filledSlots < r.slots).length]].map(([label, value]) => <div key={label} className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.03] p-3"><div className="text-[10px] font-mono text-ink/40 dark:text-ink-dark/40 uppercase">{label}</div><div className="text-sm font-semibold mt-1 capitalize">{value}</div></div>)}</div></div><div className="ib-surface rounded-2xl p-5"><div className="ib-kicker">Project owner</div><div className="flex items-center gap-3 mt-4"><div className="h-10 w-10 rounded-full bg-blue/10 flex items-center justify-center font-semibold text-blue">{(project.owner.name || project.owner.email || '?').charAt(0).toUpperCase()}</div><div className="min-w-0"><div className="font-semibold truncate">{project.owner.name || project.owner.email}</div><div className="text-xs text-ink/45 dark:text-ink-dark/45 mt-0.5">Project owner</div></div></div></div></aside>
    </div>
  </main>;
}

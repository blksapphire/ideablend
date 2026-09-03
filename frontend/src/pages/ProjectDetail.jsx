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
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(project.repoUrl || '');
  const [error, setError] = useState('');

  async function save() {
    setError('');
    try {
      const updated = await patch(`/projects/${project.id}`, { repoUrl: value });
      setEditing(false);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!project.repoUrl && !isOwner) return null;

  return (
    <div className="rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4 mb-6">
      <h3 className="font-semibold text-sm mb-2">Repository</h3>
      {editing ? (
        <div className="flex gap-2">
          <input
            value={value} onChange={e => setValue(e.target.value)} placeholder="https://github.com/owner/repo"
            className="flex-1 p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-page dark:bg-pagedark text-sm"
          />
          <button onClick={save} className="px-3 py-2 rounded-lg bg-violet dark:bg-violet-dark text-white text-xs font-semibold">Save</button>
          <button onClick={() => setEditing(false)} className="text-xs text-ink/50 dark:text-ink-dark/50">Cancel</button>
        </div>
      ) : project.repoUrl ? (
        <div className="flex items-center justify-between">
          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-sm text-violet-text dark:text-violet-textdark font-medium">
            {project.repoUrl}
          </a>
          {isOwner && <button onClick={() => setEditing(true)} className="text-xs text-ink/50 dark:text-ink-dark/50">Edit</button>}
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-xs font-semibold text-violet-text dark:text-violet-textdark">
          + Link a GitHub repo
        </button>
      )}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}

function GithubActivity({ projectId, repoUrl }) {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repoUrl) return;
    get(`/projects/${projectId}/github-activity`)
      .then(setActivity)
      .catch(err => setError(err.message));
  }, [projectId, repoUrl]);

  if (!repoUrl) return null;
  if (error) return <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-6">GitHub activity unavailable: {error}</p>;
  if (!activity) return <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-6">Loading repo activity…</p>;

  return (
    <div className="rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4 mb-6">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-sm">{activity.fullName}</h3>
          {activity.description && <p className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1">{activity.description}</p>}
        </div>
        <div className="flex gap-3 font-mono text-xs text-ink/50 dark:text-ink-dark/50">
          <span>★ {activity.stars}</span>
          <span>{activity.openIssues} issues</span>
        </div>
      </div>
      {activity.recentCommits?.length > 0 && (
        <div className="space-y-1.5 mt-3 pt-3 border-t border-ink/20 dark:border-ink-dark/20">
          {activity.recentCommits.map(c => (
            <div key={c.sha} className="flex justify-between text-xs">
              <span className="truncate pr-2">{c.message}</span>
              <span className="text-ink/40 dark:text-ink-dark/40 font-mono whitespace-nowrap">{c.author} · {c.sha}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilesPanel({ projectId, user }) {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  function load() {
    get(`/projects/${projectId}/files`).then(setFiles).catch(() => setFiles(null));
  }

  useEffect(() => { if (user) load(); }, [projectId, user]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      await uploadFile(`/projects/${projectId}/files`, file);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(fileId) {
    await del(`/files/${fileId}`);
    load();
  }

  if (!user || files === null) return null;

  return (
    <div className="rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4 mb-6">
      <h3 className="font-semibold text-sm mb-3">Files</h3>
      {files.length === 0 && <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-3">No files yet — specs, mockups, decks.</p>}
      <div className="space-y-2 mb-3">
        {files.map(f => (
          <div key={f.id} className="flex items-center justify-between text-sm">
            <div>
              <button onClick={() => downloadFile(`/files/${f.id}/download`, f.filename)} className="font-medium text-violet-text dark:text-violet-textdark">
                {f.filename}
              </button>
              <span className="font-mono text-xs text-ink/40 dark:text-ink-dark/40 ml-2">{formatSize(f.size)} · {f.uploader?.name}</span>
            </div>
            {(f.uploaderId === user.id) && (
              <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500">Delete</button>
            )}
          </div>
        ))}
      </div>
      <label className="text-xs font-semibold text-violet-text dark:text-violet-textdark cursor-pointer">
        {uploading ? 'Uploading…' : '+ Upload a file (max 15MB)'}
        <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [applyingRoleId, setApplyingRoleId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const data = await get(`/projects/${id}`);
    setProject(data);
  }

  useEffect(() => { load(); }, [id]);

  if (!project) return <p className="max-w-3xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  const isOwner = user && user.id === project.owner.id;

  async function applyToRole(roleId) {
    setError('');
    setNotice('');
    try {
      await post(`/projects/${project.id}/roles/${roleId}/apply`, { message: applyMessage });
      setApplyingRoleId(null);
      setApplyMessage('');
      setNotice('Application sent.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 mb-6">
        <div className="rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-6">
          <div className="flex flex-wrap gap-1.5">
            {project.category && (
              <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark">
                {project.category.toUpperCase()}
              </span>
            )}
            <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-sky-soft dark:bg-sky-softdark text-sky-text dark:text-sky-textdark">
              {project.stage}
            </span>
            {project.type && (
              <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark">
                {project.type.replace('_', ' ')}
              </span>
            )}
            {project.commitment && (
              <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-ink/5 dark:bg-ink-dark/5 text-ink/60 dark:text-ink-dark/60">
                {project.commitment}
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-xl mt-3">{project.title}</h1>
          <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-3 leading-relaxed">{project.description}</p>

          {isOwner ? (
            <div className="flex flex-wrap gap-2 mt-6">
              <Link to={`/projects/${project.id}/applications`} className="px-4 py-2.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">
                Review applications
              </Link>
              <Link to={`/projects/${project.id}/workspace`} className="px-4 py-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold">
                Open workspace
              </Link>
              <Link to={`/projects/${project.id}/edit`} className="px-4 py-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold">
                Edit project
              </Link>
            </div>
          ) : (
            user && (
              <Link to={`/projects/${project.id}/workspace`} className="inline-block mt-6 px-4 py-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-sm font-semibold">
                Open workspace
              </Link>
            )
          )}
        </div>

        <div className="rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-6">
          <h3 className="font-semibold text-sm mb-3">Roles</h3>
          {project.roles.map(role => {
            const full = role.filledSlots >= role.slots;
            const isApplying = applyingRoleId === role.id;
            return (
              <div key={role.id} className="py-3 border-b border-ink/20 dark:border-ink-dark/20 last:border-none">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold">{role.name}</div>
                    <div className="font-mono text-xs text-ink/50 dark:text-ink-dark/50 mt-0.5">
                      {role.filledSlots} / {role.slots} {full ? 'filled' : 'open'}
                      {role.experience && role.experience !== 'ANY' && ` · ${role.experience}`}
                      {role.commitment && ` · ${role.commitment}`}
                    </div>
                  </div>
                  <RoleRings role={role} />
                </div>
                {role.description && <p className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1.5">{role.description}</p>}
                {role.roleSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.roleSkills.map(rs => (
                      <span key={rs.skillId} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark">
                        {rs.skill.name}
                      </span>
                    ))}
                  </div>
                )}

                {!isOwner && user && !full && (
                  isApplying ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={applyMessage} onChange={e => setApplyMessage(e.target.value)}
                        placeholder="Optional note to the owner" rows={2}
                        className="w-full p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-page dark:bg-pagedark text-sm"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => applyToRole(role.id)} className="px-3 py-1.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-xs font-semibold">
                          Send application
                        </button>
                        <button onClick={() => setApplyingRoleId(null)} className="text-xs text-ink/50 dark:text-ink-dark/50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setApplyingRoleId(role.id)} className="mt-2 text-xs font-semibold text-violet-text dark:text-violet-textdark">
                      Apply for this role
                    </button>
                  )
                )}
              </div>
            );
          })}
          {notice && <p className="text-sm text-teal-text dark:text-teal-textdark mt-3">{notice}</p>}
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>
      </div>

      <RepoPanel project={project} isOwner={isOwner} onSaved={setProject} />
      <GithubActivity projectId={project.id} repoUrl={project.repoUrl} />
      <FilesPanel projectId={project.id} user={user} />
    </div>
  );
}

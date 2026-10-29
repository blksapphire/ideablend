import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post, patch, uploadFile, downloadFile, del } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RoleRings } from '../components/BlendRings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Stat } from '../components/ui/Stat';
import SectionHeader from '../components/ui/SectionHeader';
import { Field, Input, Textarea } from '../components/ui/Field';
import Notice from '../components/ui/Notice';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { ChevronLeft, Star } from '../components/ui/icons';
import useDocumentMeta from '../hooks/useDocumentMeta';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// repo URLs are user-supplied - only render them as links when they are
// actually http(s), otherwise a "javascript:" value would become clickable
function safeUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function RepoPanel({ project, isOwner, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(project.repoUrl || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setError('');
    setSaving(true);
    try {
      await patch(`/projects/${project.id}`, { repoUrl: value });
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!project.repoUrl && !isOwner) return null;
  const link = safeUrl(project.repoUrl);

  return (
    <Card className="mb-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="ib-kicker">Source</div>
          <h3 className="mt-1 text-sm font-semibold">Repository</h3>
        </div>
        <Badge mono size="sm">
          GitHub
        </Badge>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Input
            value={value}
            onChange={event => setValue(event.target.value)}
            placeholder="https://github.com/owner/repo"
            aria-label="Repository URL"
          />
          <div className="flex gap-2">
            <Button onClick={save} loading={saving}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : project.repoUrl ? (
        <div className="flex items-start justify-between gap-3">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer noopener"
              className="break-all text-sm font-medium text-blue-text dark:text-blue-textdark"
            >
              {project.repoUrl}
            </a>
          ) : (
            <span className="break-all text-sm text-ui-muted">{project.repoUrl}</span>
          )}
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          + Link a GitHub repo
        </Button>
      )}

      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </Card>
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
  if (error) {
    return <Notice tone="info" className="mb-5">GitHub activity unavailable: {error}</Notice>;
  }
  if (!activity) {
    return (
      <Card className="mb-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <SkeletonText lines={3} />
      </Card>
    );
  }

  return (
    <Card className="mb-5">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="ib-kicker">Live signal</div>
          <h3 className="mt-1 text-sm font-semibold">{activity.fullName}</h3>
          {activity.description && (
            <p className="mt-1 text-xs leading-relaxed text-ui-muted">{activity.description}</p>
          )}
        </div>
        <div className="flex gap-3 font-mono text-xs text-ui-muted">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3" />
            {activity.stars}
          </span>
          <span>{activity.openIssues} issues</span>
        </div>
      </div>
      {activity.recentCommits?.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-ui-line/10 pt-4">
          {activity.recentCommits.map(commit => (
            <div key={commit.sha} className="flex justify-between gap-3 text-xs">
              <span className="truncate">{commit.message}</span>
              <span className="whitespace-nowrap font-mono text-ui-subtle">
                {commit.author} · {commit.sha}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function FilesPanel({ projectId, user }) {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  function load() {
    get(`/projects/${projectId}/files`)
      .then(setFiles)
      .catch(() => setFiles(null));
  }

  useEffect(() => {
    if (user) load();
  }, [projectId, user]);

  async function handleUpload(event) {
    const file = event.target.files[0];
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
      event.target.value = '';
    }
  }

  async function handleDelete(fileId) {
    setError('');
    try {
      await del(`/files/${fileId}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user || files === null) return null;

  return (
    <Card className="mb-5">
      <div className="mb-3">
        <div className="ib-kicker">Project assets</div>
        <h3 className="mt-1 text-sm font-semibold">Files</h3>
      </div>

      {files.length === 0 && (
        <p className="mb-3 text-sm text-ui-muted">No files yet — specs, mockups, decks.</p>
      )}

      <div className="mb-3 space-y-2">
        {files.map(file => (
          <div key={file.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => downloadFile(`/files/${file.id}/download`, file.filename)}
                className="truncate text-left font-medium text-blue-text dark:text-blue-textdark"
              >
                {file.filename}
              </button>
              <span className="ml-2 font-mono text-xs text-ui-subtle">
                {formatSize(file.size)} · {file.uploader?.name}
              </span>
            </div>
            {file.uploaderId === user.id && (
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="shrink-0 text-xs text-red-500"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <label className="cursor-pointer text-xs font-semibold text-blue-text dark:text-blue-textdark">
        {uploading ? 'Uploading…' : '+ Upload a file (max 15MB)'}
        <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>

      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </Card>
  );
}

function ProjectDetailSkeleton() {
  return (
    <main className="mx-auto max-w-shell px-5 py-8 md:px-6 md:py-12">
      <Skeleton className="mb-6 h-3 w-32" />
      <div className="mb-6 rounded-panel bg-ui-raised p-6 md:p-9">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-9 w-3/4" />
            <SkeletonText lines={2} />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="rounded-2xl border border-ui-line/10 p-5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-4 h-1.5 w-full" />
          </div>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-52 rounded-card" />
          <Skeleton className="h-32 rounded-card" />
        </div>
      </div>
    </main>
  );
}

function HeroTag({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white/10 text-white/80',
    blue: 'bg-blue/20 text-blue-dark dark:text-blue-textdark',
    green: 'bg-green/15 text-green-dark dark:text-green-textdark'
  };
  return (
    <span
      className={`rounded-md px-2 py-1 font-mono text-2xs uppercase tracking-[0.08em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [applyingRoleId, setApplyingRoleId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyBusy, setApplyBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useDocumentMeta({
    title: project?.title || 'Project',
    description: project?.description
      ? project.description.slice(0, 155)
      : 'A project looking for collaborators on Idea Blend.'
  });

  async function load() {
    setLoadError('');
    try {
      const data = await get(`/projects/${id}`);
      setProject(data);
    } catch (err) {
      setLoadError(err.message || 'Could not load this project.');
    }
  }

  useEffect(() => {
    setProject(null);
    setApplyingRoleId(null);
    setApplyMessage('');
    setNotice('');
    setError('');
    load();
  }, [id, reloadKey]);

  if (loadError) {
    return (
      <main className="mx-auto max-w-shell px-5 py-16 md:px-6">
        <EmptyState
          title="This project could not load"
          description={loadError}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onClick={() => setReloadKey(key => key + 1)}>
                Try again
              </Button>
              <Button to="/explore">Back to discover</Button>
            </div>
          }
        />
      </main>
    );
  }

  if (!project) return <ProjectDetailSkeleton />;

  const isOwner = !!project.viewer?.isOwner;
  const isMember = !!project.viewer?.isMember;
  const filled = project.roles.reduce((sum, role) => sum + role.filledSlots, 0);
  const slots = project.roles.reduce((sum, role) => sum + role.slots, 0);
  const progress = slots ? Math.round((filled / slots) * 100) : 0;
  const openRoles = project.roles.filter(role => role.filledSlots < role.slots);

  async function applyToRole(roleId) {
    if (applyBusy) return;
    setError('');
    setNotice('');
    setApplyBusy(true);
    try {
      await post(`/projects/${project.id}/roles/${roleId}/apply`, { message: applyMessage });
      setApplyingRoleId(null);
      setApplyMessage('');
      setNotice('Application sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-shell px-5 py-8 md:px-6 md:py-12">
      <div className="mb-6">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 text-xs font-semibold text-ui-muted transition-colors hover:text-blue dark:hover:text-blue-dark"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to discover
        </Link>
      </div>

      <section className="relative mb-6 overflow-hidden rounded-panel bg-ink p-6 text-white shadow-panel dark:bg-ui-surface dark:text-ink-dark md:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -right-8 h-72 w-72 rounded-full border border-blue/20" />
        <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="flex flex-wrap gap-2">
              {project.category && <HeroTag>{project.category}</HeroTag>}
              {project.stage && <HeroTag tone="blue">{project.stage}</HeroTag>}
              {project.type && <HeroTag tone="green">{project.type.replace('_', ' ')}</HeroTag>}
              {project.commitment && <HeroTag>{project.commitment}</HeroTag>}
            </div>

            <h1 className="mt-5 max-w-4xl font-display text-display-sm font-bold leading-tight text-balance md:text-display-md">
              {project.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 dark:text-ink-dark/70 md:text-base">
              {project.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <Button to={`/projects/${project.id}/applications`} variant="inverse">
                    Review applications
                  </Button>
                  <Link
                    to={`/projects/${project.id}/workspace`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 dark:text-ink-dark"
                  >
                    Open workspace
                  </Link>
                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 dark:text-ink-dark"
                  >
                    Edit project
                  </Link>
                </>
              ) : (
                isMember && (
                  <Link
                    to={`/projects/${project.id}/workspace`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 dark:text-ink-dark"
                  >
                    Open workspace
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="font-mono text-2xs uppercase tracking-[0.16em] text-white/60">
              Team progress
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <span className="font-display text-3xl font-bold">{filled}</span>
              <span className="mb-1 font-mono text-2xs text-white/60">of {slots} spots filled</span>
            </div>
            <div
              role="progressbar"
              aria-label="Team progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-green transition-[width] duration-500 ease-ib dark:bg-green-dark"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between font-mono text-2xs text-white/60">
              <span>{progress}% staffed</span>
              <span>{openRoles.length} roles open</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <div>
          <Card padding="lg" className="mb-5">
            <SectionHeader
              kicker="Join the work"
              title="Open roles"
              action={
                <span className="font-mono text-2xs text-ui-subtle">
                  {filled}/{slots} filled
                </span>
              }
              className="mb-5"
            />

            {project.roles.map(role => {
              const full = role.filledSlots >= role.slots;
              const isApplying = applyingRoleId === role.id;
              return (
                <div
                  key={role.id}
                  className="border-t border-ui-line/10 py-5 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-base font-semibold">{role.name}</div>
                      <div className="mt-1 font-mono text-2xs text-ui-subtle">
                        {role.filledSlots} / {role.slots} {full ? 'filled' : 'open'}
                        {role.experience && role.experience !== 'ANY' && ` · ${role.experience}`}
                        {role.commitment && ` · ${role.commitment}`}
                      </div>
                    </div>
                    <RoleRings role={role} />
                  </div>

                  {role.description && (
                    <p className="mt-3 text-sm leading-6 text-ui-muted">{role.description}</p>
                  )}

                  {role.roleSkills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {role.roleSkills.map(roleSkill => (
                        <Badge key={roleSkill.skillId} tone="blue" mono size="sm">
                          {roleSkill.skill.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {!isOwner && user && !full && (
                    isApplying ? (
                      <div className="mt-4 space-y-3">
                        <Field label="Note to the owner" hint="Optional.">
                          <Textarea
                            value={applyMessage}
                            onChange={event => setApplyMessage(event.target.value)}
                            placeholder="What would you bring to this role?"
                            rows={3}
                            autoFocus
                          />
                        </Field>
                        <div className="flex gap-2">
                          <Button onClick={() => applyToRole(role.id)} loading={applyBusy}>
                            Send application
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setApplyingRoleId(null);
                              setError('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 px-0 text-blue-text hover:bg-transparent hover:text-blue dark:text-blue-textdark"
                        onClick={() => {
                          setApplyingRoleId(role.id);
                          setError('');
                          setNotice('');
                        }}
                      >
                        Apply for this role →
                      </Button>
                    )
                  )}
                </div>
              );
            })}

            {notice && <Notice tone="success" className="mt-4">{notice}</Notice>}
            {error && <Notice tone="error" className="mt-4">{error}</Notice>}
          </Card>

          <RepoPanel project={project} isOwner={isOwner} onSaved={load} />
          <GithubActivity projectId={project.id} repoUrl={project.repoUrl} />
          {isMember && <FilesPanel projectId={project.id} user={user} />}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <Card>
            <div className="ib-kicker">Project snapshot</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['Stage', project.stage],
                ['Type', project.type?.replace('_', ' ') || '—'],
                ['Commitment', project.commitment || '—'],
                ['Open roles', openRoles.length]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-ui-raised/60 p-3">
                  <Stat value={value} label={label} className="[&>div:first-child]:capitalize [&>div:first-child]:text-base" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="ib-kicker">Project owner</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-soft font-semibold text-blue-text dark:bg-blue-softdark dark:text-blue-textdark">
                {(project.owner.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold">{project.owner.name || 'Project owner'}</div>
                <div className="mt-0.5 text-xs text-ui-subtle">Project owner</div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { get, patch, post } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STAGES = ['IDEA', 'PLANNING', 'MVP', 'BETA', 'LIVE', 'COMPLETED', 'ARCHIVED'];
const STATUSES = ['RECRUITING', 'ACTIVE', 'COMPLETED'];
const TYPES = ['STARTUP', 'OPEN_SOURCE', 'SIDE_PROJECT', 'HACKATHON', 'RESEARCH', 'COMMUNITY', 'EXPERIMENTAL'];
const COMMITMENTS = ['VOLUNTEER', 'EQUITY', 'PAID', 'MIXED'];
const EXPERIENCE = ['ANY', 'JUNIOR', 'MID', 'SENIOR'];

export default function EditProject() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [fields, setFields] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [newRole, setNewRole] = useState({ name: '', slots: 1, description: '', experience: 'ANY', commitment: '', skills: '' });
  const [addingRole, setAddingRole] = useState(false);
  const [roleError, setRoleError] = useState('');

  function load() {
    get(`/projects/${id}`).then(data => {
      setProject(data);
      setFields({
        title: data.title, description: data.description, category: data.category || '',
        stage: data.stage, status: data.status, type: data.type || '', commitment: data.commitment || '', repoUrl: data.repoUrl || ''
      });
    });
  }

  useEffect(() => { load(); }, [id]);

  if (!project || !fields) return <p className="max-w-lg mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  if (!user || user.id !== project.owner.id) {
    return <p className="max-w-lg mx-auto px-6 py-16 text-center text-ink/60 dark:text-ink-dark/60">Only the project owner can edit this.</p>;
  }

  function set(key) {
    return e => setFields(f => ({ ...f, [key]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      await patch(`/projects/${id}`, fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addRole(e) {
    e.preventDefault();
    setRoleError('');
    if (!newRole.name.trim()) return;
    try {
      await post(`/projects/${id}/roles`, {
        name: newRole.name,
        slots: Number(newRole.slots) || 1,
        description: newRole.description || undefined,
        experience: newRole.experience || undefined,
        commitment: newRole.commitment || undefined,
        skills: newRole.skills.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, level: 3 }))
      });
      setNewRole({ name: '', slots: 1, description: '', experience: 'ANY', commitment: '', skills: '' });
      setAddingRole(false);
      load();
    } catch (err) {
      setRoleError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-ink/50 dark:text-ink-dark/50 hover:text-ink dark:hover:text-ink-dark mb-4">
        ← Back to project
      </Link>
      <h1 className="font-display font-bold text-2xl mb-6">Edit project</h1>

      <form onSubmit={save} className="space-y-3">
        <input value={fields.title} onChange={set('title')} placeholder="Title"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <textarea value={fields.description} onChange={set('description')} rows={4} placeholder="Description"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.category} onChange={set('category')} placeholder="Category"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.repoUrl} onChange={set('repoUrl')} placeholder="Repo URL"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />

        <div className="grid grid-cols-2 gap-2">
          <select value={fields.status} onChange={set('status')} className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fields.stage} onChange={set('stage')} className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fields.type} onChange={set('type')} className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
            <option value="">Type…</option>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          <select value={fields.commitment} onChange={set('commitment')} className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
            <option value="">Commitment…</option>
            {COMMITMENTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="w-full p-3 rounded-lg bg-violet dark:bg-violet-dark text-white font-semibold">
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="font-semibold text-sm mb-3">Roles</h3>
        <div className="space-y-2 mb-3">
          {project.roles.map(role => (
            <div key={role.id} className="flex justify-between items-center p-3 rounded-lg border border-ink/20 dark:border-ink-dark/20 text-sm">
              <span>{role.name}</span>
              <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">{role.filledSlots}/{role.slots}</span>
            </div>
          ))}
        </div>

        {addingRole ? (
          <form onSubmit={addRole} className="p-3 rounded-lg border border-ink/20 dark:border-ink-dark/20 space-y-2">
            <div className="flex gap-2">
              <input value={newRole.name} onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))} placeholder="Role name"
                className="flex-1 p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
              <input value={newRole.slots} onChange={e => setNewRole(r => ({ ...r, slots: e.target.value }))} type="number" min="1" placeholder="Slots"
                className="w-20 p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
            </div>
            <input value={newRole.description} onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))} placeholder="What this role will do (optional)"
              className="w-full p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
            <input value={newRole.skills} onChange={e => setNewRole(r => ({ ...r, skills: e.target.value }))} placeholder="Skills needed, comma separated"
              className="w-full p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
            <div className="flex gap-2">
              <select value={newRole.experience} onChange={e => setNewRole(r => ({ ...r, experience: e.target.value }))} className="flex-1 p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
                {EXPERIENCE.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
              <select value={newRole.commitment} onChange={e => setNewRole(r => ({ ...r, commitment: e.target.value }))} className="flex-1 p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
                <option value="">Commitment…</option>
                {COMMITMENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {roleError && <p className="text-sm text-red-500">{roleError}</p>}
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-teal dark:bg-teal-dark text-white text-xs font-semibold">Add role</button>
              <button type="button" onClick={() => setAddingRole(false)} className="text-xs text-ink/50 dark:text-ink-dark/50">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAddingRole(true)} className="text-sm font-semibold text-violet-text dark:text-violet-textdark">
            + Add a role vacancy
          </button>
        )}
      </div>
    </div>
  );
}

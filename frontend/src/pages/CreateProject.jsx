import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SignInPrompt from '../components/SignInPrompt';

const STAGES = ['IDEA', 'PLANNING', 'MVP', 'BETA', 'LIVE'];
const TYPES = ['STARTUP', 'OPEN_SOURCE', 'SIDE_PROJECT', 'HACKATHON', 'RESEARCH', 'COMMUNITY', 'EXPERIMENTAL'];
const COMMITMENTS = ['VOLUNTEER', 'EQUITY', 'PAID', 'MIXED'];
const EXPERIENCE = ['ANY', 'JUNIOR', 'MID', 'SENIOR'];

const emptyRole = () => ({ name: '', slots: 1, description: '', experience: 'ANY', commitment: '', skills: '' });

export default function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stage, setStage] = useState('IDEA');
  const [type, setType] = useState('');
  const [commitment, setCommitment] = useState('');
  const [roles, setRoles] = useState([emptyRole()]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <SignInPrompt message="Sign in to post a project." />;
  }

  function updateRole(i, key, value) {
    setRoles(rs => rs.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
  }
  function addRole() {
    setRoles(rs => [...rs, emptyRole()]);
  }
  function removeRole(i) {
    setRoles(rs => rs.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!title || !description) return setError('Title and description are required.');
    const cleanRoles = roles.filter(r => r.name.trim()).map(r => ({
      name: r.name,
      slots: Number(r.slots) || 1,
      description: r.description || undefined,
      experience: r.experience || undefined,
      commitment: r.commitment || undefined,
      skills: r.skills.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, level: 3 }))
    }));
    if (cleanRoles.length === 0) return setError('Add at least one role.');

    setLoading(true);
    try {
      const project = await post('/projects', {
        title, description, category,
        stage, type: type || undefined, commitment: commitment || undefined,
        roles: cleanRoles
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="font-display font-bold text-2xl mb-6">Post a project</h1>
      <form onSubmit={submit} className="space-y-4">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the project" rows={4}
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. fintech, mobile)"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />

        <div className="grid grid-cols-3 gap-2">
          <select value={stage} onChange={e => setStage(e.target.value)} className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
            <option value="">Type…</option>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          <select value={commitment} onChange={e => setCommitment(e.target.value)} className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
            <option value="">Commitment…</option>
            {COMMITMENTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">Roles needed</label>
          <div className="space-y-3 mt-2">
            {roles.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border border-ink/20 dark:border-ink-dark/20 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={r.name} onChange={e => updateRole(i, 'name', e.target.value)} placeholder="Role name"
                    className="flex-1 p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm"
                  />
                  <input
                    value={r.slots} onChange={e => updateRole(i, 'slots', e.target.value)} type="number" min="1" placeholder="Slots"
                    className="w-20 p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm"
                  />
                  {roles.length > 1 && (
                    <button type="button" onClick={() => removeRole(i)} className="text-ink/40 dark:text-ink-dark/40 text-sm px-2">✕</button>
                  )}
                </div>
                <input
                  value={r.description} onChange={e => updateRole(i, 'description', e.target.value)} placeholder="What this role will do (optional)"
                  className="w-full p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm"
                />
                <input
                  value={r.skills} onChange={e => updateRole(i, 'skills', e.target.value)} placeholder="Skills needed, comma separated (e.g. React, PostgreSQL)"
                  className="w-full p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm"
                />
                <div className="flex gap-2">
                  <select value={r.experience} onChange={e => updateRole(i, 'experience', e.target.value)} className="flex-1 p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
                    {EXPERIENCE.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                  <select value={r.commitment} onChange={e => updateRole(i, 'commitment', e.target.value)} className="flex-1 p-2 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm">
                    <option value="">Commitment…</option>
                    {COMMITMENTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRole} className="text-sm font-medium text-violet-text dark:text-violet-textdark mt-2">
            + Add another role
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="w-full p-3 rounded-lg bg-violet dark:bg-violet-dark text-white font-semibold">
          {loading ? 'Posting…' : 'Post project'}
        </button>
      </form>
    </div>
  );
}

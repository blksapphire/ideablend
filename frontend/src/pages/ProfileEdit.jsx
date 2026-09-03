import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, del, patch, uploadFile } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/BlendRings';
import SignInPrompt from '../components/SignInPrompt';
import { COUNTRIES, CITY_SUGGESTIONS, getTimezones } from '../lib/locationData';

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'HOURS_5_10', label: '5–10 hrs/week' },
  { value: 'HOURS_10_20', label: '10–20 hrs/week' },
  { value: 'HOURS_20_40', label: '20–40 hrs/week' },
  { value: 'FULL_TIME', label: 'Full-time' }
];

export default function ProfileEdit() {
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [fields, setFields] = useState(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  async function load() {
    const data = await get('/users/me');
    setProfile(data);
    // location is stored as one combined "City, Country" string on the
    // backend - split it here so it can be edited as two separate dropdowns
    const [city = '', country = ''] = (data.location || '').split(',').map(s => s.trim());
    setFields({
      name: data.name || '', headline: data.headline || '', bio: data.bio || '',
      githubUrl: data.githubUrl || '', portfolioUrl: data.portfolioUrl || '',
      linkedinUrl: data.linkedinUrl || '', websiteUrl: data.websiteUrl || '',
      city, country: COUNTRIES.includes(country) ? country : '',
      timezone: data.timezone || '',
      openToProjects: data.openToProjects, openToCofounder: data.openToCofounder,
      openToFreelance: data.openToFreelance, openToEmployment: data.openToEmployment,
      availability: data.availability || ''
    });
  }

  useEffect(() => { if (authUser) load(); }, [authUser]);

  if (!authUser) return <SignInPrompt message="Sign in to edit your profile." />;
  if (!profile || !fields) return <p className="max-w-lg mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  function set(key) {
    return e => setFields(f => ({ ...f, [key]: e.target.value }));
  }
  function toggle(key) {
    return e => setFields(f => ({ ...f, [key]: e.target.checked }));
  }

  async function save(e) {
    e.preventDefault();
    const location = [fields.city, fields.country].filter(Boolean).join(', ');
    const { city, country, ...rest } = fields;
    const updated = await patch('/users/me', { ...rest, location, availability: fields.availability || null });
    updateUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setAvatarUploading(true);
    try {
      const updated = await uploadFile('/users/me/avatar', file, 'avatar');
      setProfile(p => ({ ...p, ...updated }));
      updateUser(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  async function addSkill(e) {
    e.preventDefault();
    setError('');
    if (!newSkillName.trim()) return;
    try {
      await post('/users/me/skills', { name: newSkillName.trim(), level: Number(newSkillLevel) });
      setNewSkillName('');
      setNewSkillLevel(3);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSkill(skillId) {
    await del(`/users/me/skills/${skillId}`);
    load();
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Edit profile</h1>
        <button onClick={() => navigate('/profile')} className="text-sm text-ink/50 dark:text-ink-dark/50">Back to profile</button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Avatar user={profile} size={72} />
        <label className="text-sm font-semibold text-violet-text dark:text-violet-textdark cursor-pointer">
          {avatarUploading ? 'Uploading…' : 'Change photo'}
          <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={avatarUploading} className="hidden" />
        </label>
      </div>

      <form onSubmit={save} className="space-y-3">
        <input value={fields.name} onChange={set('name')} placeholder="Name"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.headline} onChange={set('headline')} placeholder="Headline (e.g. Backend dev, Lagos)"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <textarea value={fields.bio} onChange={set('bio')} placeholder="Short bio" rows={3}
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input value={fields.city} onChange={set('city')} placeholder="City" list="city-suggestions"
              className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
            <datalist id="city-suggestions">
              {CITY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <select value={fields.country} onChange={set('country')}
            className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark">
            <option value="">Country…</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <select value={fields.timezone} onChange={set('timezone')}
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark">
          <option value="">Timezone…</option>
          {getTimezones().map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>

        <input value={fields.githubUrl} onChange={set('githubUrl')} placeholder="GitHub URL"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.linkedinUrl} onChange={set('linkedinUrl')} placeholder="LinkedIn URL"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.portfolioUrl} onChange={set('portfolioUrl')} placeholder="Portfolio URL"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.websiteUrl} onChange={set('websiteUrl')} placeholder="Website URL"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />

        <div>
          <label className="text-sm font-semibold">Open to</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.openToProjects} onChange={toggle('openToProjects')} /> Projects</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.openToCofounder} onChange={toggle('openToCofounder')} /> Co-founding</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.openToFreelance} onChange={toggle('openToFreelance')} /> Freelance</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!fields.openToEmployment} onChange={toggle('openToEmployment')} /> Full-time employment</label>
          </div>
        </div>

        <select value={fields.availability} onChange={set('availability')}
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark">
          {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button className="w-full p-3 rounded-lg bg-violet dark:bg-violet-dark text-white font-semibold">
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="font-semibold text-sm mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.userSkills?.length === 0 && (
            <p className="text-sm text-ink/50 dark:text-ink-dark/50">No tagged skills yet.</p>
          )}
          {profile.userSkills?.map(us => (
            <span key={us.skillId} className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-full bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark">
              {us.skill.name} · L{us.level}
              <button onClick={() => removeSkill(us.skillId)} className="opacity-60 hover:opacity-100">✕</button>
            </span>
          ))}
        </div>
        <form onSubmit={addSkill} className="flex gap-2">
          <input
            value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="Add a skill (e.g. React)"
            className="flex-1 p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm"
          />
          <select
            value={newSkillLevel} onChange={e => setNewSkillLevel(e.target.value)}
            className="p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm"
          >
            {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
          </select>
          <button className="px-4 py-2.5 rounded-lg bg-teal dark:bg-teal-dark text-white text-sm font-semibold">Add</button>
        </form>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}

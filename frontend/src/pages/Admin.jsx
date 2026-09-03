import React, { useEffect, useState } from 'react';
import { get, post } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SignInPrompt from '../components/SignInPrompt';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4">
      <div className="font-display font-bold text-2xl">{value}</div>
      <div className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1">{label}</div>
    </div>
  );
}

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">No data yet.</p>
      ) : (
        <div className="space-y-1">
          {entries.map(([key, count]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="font-mono text-xs text-ink/60 dark:text-ink-dark/60">{key}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  function load() {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    get(`/admin/users${params}`).then(data => setUsers(data.users)).catch(err => setError(err.message));
  }

  useEffect(() => { load(); }, []);

  async function toggleBan(u) {
    setError('');
    try {
      await post(`/admin/users/${u.id}/${u.isBanned ? 'unban' : 'ban'}`, {});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeUser(u) {
    if (!window.confirm(`Remove ${u.name || u.email}? This scrubs their profile permanently and cannot be undone.`)) return;
    setError('');
    try {
      await post(`/admin/users/${u.id}/remove`, {});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="font-display font-bold text-lg mb-3">Manage users</h2>
      <form onSubmit={e => { e.preventDefault(); load(); }} className="flex gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email"
          className="flex-1 p-2.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark text-sm" />
        <button className="px-4 py-2.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">Search</button>
      </form>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <div className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark divide-y divide-ink/10 dark:divide-ink-dark/10">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <div className="font-medium">
                {u.isRemoved ? 'Removed user' : (u.name || 'Unnamed')}{' '}
                {u.isAdmin && <span className="font-mono text-[10px] text-violet-text dark:text-violet-textdark">ADMIN</span>}
                {u.isRemoved && <span className="font-mono text-[10px] text-red-500 ml-1">REMOVED</span>}
              </div>
              <div className="text-xs text-ink/50 dark:text-ink-dark/50">{u.email}</div>
              <div className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40 mt-0.5">
                Last active: {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : 'never'}
              </div>
            </div>
            {!u.isRemoved && (
              <div className="flex gap-2">
                <button
                  onClick={() => toggleBan(u)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${u.isBanned ? 'bg-teal dark:bg-teal-dark text-white' : 'border border-red-300 text-red-500'}`}
                >
                  {u.isBanned ? 'Unban' : 'Ban'}
                </button>
                <button onClick={() => removeUser(u)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-white">
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="p-3 text-sm text-ink/50 dark:text-ink-dark/50">No users found.</p>}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    get('/admin/stats').then(setStats).catch(err => setError(err.message));
  }, [user]);

  if (!user) return <SignInPrompt message="Sign in required." />;
  if (!user.isAdmin) return <p className="max-w-3xl mx-auto px-6 py-16 text-center text-ink/60 dark:text-ink-dark/60">You don't have access to this page.</p>;
  if (error) return <p className="max-w-3xl mx-auto px-6 py-16 text-red-500">{error}</p>;
  if (!stats) return <p className="max-w-3xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl mb-6">Admin dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Total users" value={stats.users.total} />
        <Stat label="Active (24h)" value={stats.users.active24h} />
        <Stat label="Active (7d)" value={stats.users.active7d} />
        <Stat label="New users (7d)" value={stats.users.newLast7Days} />
        <Stat label="Total projects" value={stats.projects.total} />
        <Stat label="New projects (7d)" value={stats.projects.newLast7Days} />
        <Stat label="Applications" value={stats.applications.total} />
        <Stat label="Active memberships" value={stats.activeMemberships} />
        <Stat label="Messages sent" value={stats.messages.total} />
        <Stat label="Reviews left" value={stats.reviews.total} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Breakdown title="Projects by status" data={stats.projects.byStatus} />
        <Breakdown title="Projects by stage" data={stats.projects.byStage} />
        <Breakdown title="Applications by status" data={stats.applications.byStatus} />
        <Breakdown title="Tasks by status" data={stats.tasks.byStatus} />
      </div>

      <UserManagement />
    </div>
  );
}

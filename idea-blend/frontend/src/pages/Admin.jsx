import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
      <div className="font-display font-bold text-2xl">{value}</div>
      <div className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1">{label}</div>
    </div>
  );
}

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
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

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    get('/admin/stats').then(setStats).catch(err => setError(err.message));
  }, [user]);

  if (!user) return <p className="max-w-3xl mx-auto px-6 py-16 text-center text-ink/60 dark:text-ink-dark/60">Sign in required.</p>;
  if (!user.isAdmin) return <p className="max-w-3xl mx-auto px-6 py-16 text-center text-ink/60 dark:text-ink-dark/60">You don't have access to this page.</p>;
  if (error) return <p className="max-w-3xl mx-auto px-6 py-16 text-red-500">{error}</p>;
  if (!stats) return <p className="max-w-3xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl mb-6">Admin dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Total users" value={stats.users.total} />
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
    </div>
  );
}

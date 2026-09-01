import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post } from '../lib/api';

export default function ApplicationsInbox() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await get(`/projects/${id}/applications`);
      setApplications(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function act(appId, action) {
    setError('');
    try {
      await post(`/applications/${appId}/${action}`, {});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const statusColor = {
    PENDING: 'bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark',
    ACCEPTED: 'bg-sky-soft dark:bg-sky-softdark text-sky-text dark:text-sky-textdark',
    CONFIRMED: 'bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark',
    REJECTED: 'bg-ink/5 dark:bg-ink-dark/5 text-ink/50 dark:text-ink-dark/50',
    WITHDRAWN: 'bg-ink/5 dark:bg-ink-dark/5 text-ink/50 dark:text-ink-dark/50'
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-ink/50 dark:text-ink-dark/50 hover:text-ink dark:hover:text-ink-dark mb-4">
        ← Back to project
      </Link>
      <h1 className="font-display font-bold text-2xl mb-6">Applications</h1>
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {applications.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="rounded-xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-4">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/users/${app.user.id}`} className="font-semibold text-sm hover:text-violet-text dark:hover:text-violet-textdark">{app.user.name || app.user.email}</Link>
                  <p className="text-xs text-ink/50 dark:text-ink-dark/50 mt-0.5">Applying for {app.role.name}</p>
                  {app.user.skills && <p className="font-mono text-xs text-ink/40 dark:text-ink-dark/40 mt-1">{app.user.skills}</p>}
                  {app.message && <p className="text-sm mt-2">{app.message}</p>}
                </div>
                <span className={`font-mono text-[11px] px-2 py-1 rounded-md ${statusColor[app.status]}`}>{app.status}</span>
              </div>
              {app.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => act(app.id, 'accept')} className="px-3 py-1.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-xs font-semibold">
                    Accept
                  </button>
                  <button onClick={() => act(app.id, 'reject')} className="px-3 py-1.5 rounded-lg border border-ink/15 dark:border-ink-dark/15 text-xs font-semibold">
                    Reject
                  </button>
                </div>
              )}
              {app.status === 'ACCEPTED' && (
                <p className="text-xs text-ink/50 dark:text-ink-dark/50 mt-3">Waiting for them to confirm.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

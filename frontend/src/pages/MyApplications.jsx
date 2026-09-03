import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, post } from '../lib/api';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const data = await get('/applications/mine');
    setApplications(data);
  }

  useEffect(() => { load(); }, []);

  async function act(appId, action) {
    setError('');
    try {
      await post(`/applications/${appId}/${action}`, {});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl mb-6">My applications</h1>
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {applications.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">You haven't applied to anything yet.</p>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4">
              <div className="flex justify-between items-center">
                <div>
                  <Link to={`/projects/${app.project.id}`} className="font-semibold text-sm hover:underline">{app.project.title}</Link>
                  <p className="text-xs text-ink/50 dark:text-ink-dark/50 mt-0.5">{app.role.name}</p>
                </div>
                <span className="font-mono text-[11px] text-ink/50 dark:text-ink-dark/50">{app.status}</span>
              </div>
              {app.status === 'ACCEPTED' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => act(app.id, 'confirm')} className="px-3 py-1.5 rounded-lg bg-teal dark:bg-teal-dark text-white text-xs font-semibold">
                    Confirm and join
                  </button>
                  <button onClick={() => act(app.id, 'withdraw')} className="px-3 py-1.5 rounded-lg border border-ink/25 dark:border-ink-dark/25 text-xs font-semibold">
                    Withdraw
                  </button>
                </div>
              )}
              {app.status === 'PENDING' && (
                <button onClick={() => act(app.id, 'withdraw')} className="mt-3 text-xs font-semibold text-ink/50 dark:text-ink-dark/50">
                  Withdraw application
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

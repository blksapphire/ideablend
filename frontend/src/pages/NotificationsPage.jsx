import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SignInPrompt from '../components/SignInPrompt';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(null);

  function load() {
    get('/notifications').then(setNotifications).catch(() => setNotifications([]));
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (!user) return <SignInPrompt message="Sign in to see your notifications." />;
  if (!notifications) return <p className="max-w-2xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  async function handleClick(n) {
    if (!n.read) await post(`/notifications/${n.id}/read`, {});
    if (n.link) navigate(n.link);
    load();
  }

  async function markAllRead() {
    await post('/notifications/read-all', {});
    load();
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-semibold text-sky-text dark:text-sky-textdark">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-ink-dark/50">No notifications yet.</p>
      ) : (
        <div className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark divide-y divide-ink/10 dark:divide-ink-dark/10">
          {notifications.map(n => (
            <button
              key={n.id} onClick={() => handleClick(n)}
              className={`w-full text-left p-4 text-sm hover:bg-page dark:hover:bg-pagedark ${!n.read ? 'bg-sky-soft/40 dark:bg-sky-softdark/40' : ''}`}
            >
              <p>{n.message}</p>
              <p className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40 mt-1">{timeAgo(n.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

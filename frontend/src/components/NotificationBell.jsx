import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../lib/api';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  function loadCount() {
    get('/notifications/unread-count').then(d => setUnreadCount(d.count)).catch(() => {});
  }

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000); // poll every 30s - no websocket push for notifications yet
    return () => clearInterval(interval);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) get('/notifications').then(setNotifications).catch(() => {});
  }

  async function handleClick(n) {
    if (!n.read) {
      post(`/notifications/${n.id}/read`, {}).catch(() => {});
      setUnreadCount(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function markAllRead() {
    await post('/notifications/read-all', {});
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-full border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark flex items-center justify-center"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-surface dark:bg-surfacedark border border-ink/20 dark:border-ink-dark/20 rounded-xl shadow-lg z-30 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-ink/10 dark:border-ink-dark/10">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-violet-text dark:text-violet-textdark font-medium">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-ink/50 dark:text-ink-dark/50">No notifications yet.</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left p-3 border-b border-ink/10 dark:border-ink-dark/10 last:border-none text-sm hover:bg-page dark:hover:bg-pagedark ${!n.read ? 'bg-violet-soft/40 dark:bg-violet-softdark/40' : ''}`}
                >
                  <p>{n.message}</p>
                  <p className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40 mt-1">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

import React from 'react';
import { avatarUrl } from '../lib/api';

const COLORS = [
  { bg: 'bg-violet dark:bg-violet-dark' },
  { bg: 'bg-teal dark:bg-teal-dark' },
  { bg: 'bg-sky dark:bg-sky-dark' }
];

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

// shared circle avatar: real photo if the user has one, initials on a
// colored background otherwise. Used everywhere a person shows up - role
// rings, chat, roster, nav.
export function Avatar({ user, size = 28, colorIndex = 0 }) {
  const dim = `${size}px`;
  const url = avatarUrl(user?.profilePic);
  if (url) {
    return (
      <img
        src={url} alt={user?.name || ''} title={user?.name}
        className="rounded-full object-cover border-2 border-surface dark:border-surfacedark -ml-2 first:ml-0"
        style={{ width: dim, height: dim }}
      />
    );
  }
  return (
    <div
      title={user?.name}
      className={`${COLORS[colorIndex % COLORS.length].bg} rounded-full flex items-center justify-center text-[11px] font-semibold text-white border-2 border-surface dark:border-surfacedark -ml-2 first:ml-0`}
      style={{ width: dim, height: dim }}
    >
      {initials(user?.name)}
    </div>
  );
}

// role: { slots, filledSlots, memberships: [{ user: { name, profilePic } }] }
export function RoleRings({ role, size = 28 }) {
  const members = role.memberships || [];
  const openCount = Math.max(role.slots - members.length, 0);
  const dim = `${size}px`;

  return (
    <div className="flex items-center">
      {members.map((m, i) => <Avatar key={m.id || i} user={m.user} size={size} colorIndex={i} />)}
      {Array.from({ length: openCount }).map((_, i) => (
        <div
          key={`open-${i}`}
          className="rounded-full border-2 border-dashed border-ink/20 dark:border-ink-dark/20 flex items-center justify-center text-[11px] text-ink/40 dark:text-ink-dark/40 -ml-2 first:ml-0"
          style={{ width: dim, height: dim }}
        >
          ?
        </div>
      ))}
    </div>
  );
}

// small badge summarizing every role on a project, e.g. "5/8 slots filled"
export function SlotSummary({ roles }) {
  const total = roles.reduce((sum, r) => sum + r.slots, 0);
  const filled = roles.reduce((sum, r) => sum + (r.memberships?.length || 0), 0);
  const full = filled >= total;
  return (
    <span className={`text-xs font-mono px-2 py-1 rounded-md ${full ? 'bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark' : 'bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark'}`}>
      {filled}/{total} {full ? 'full' : 'filled'}
    </span>
  );
}

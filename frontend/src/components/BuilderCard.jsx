import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, VerifiedBadge } from './BlendRings';

const AVAILABILITY_LABELS = {
  HOURS_5_10: '5–10 hrs/wk',
  HOURS_10_20: '10–20 hrs/wk',
  HOURS_20_40: '20–40 hrs/wk',
  FULL_TIME: 'Full-time'
};

export default function BuilderCard({ user, onInvite, inviteLabel = 'Invite' }) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <Avatar user={user} size={40} />
        <div className="min-w-0">
          <div className="font-semibold text-sm flex items-center gap-1 truncate">
            {user.name || 'Unnamed builder'}
            {user.isVerified && <VerifiedBadge size={13} />}
          </div>
          {user.headline && <div className="text-xs text-ink/50 dark:text-ink-dark/50 truncate">{user.headline}</div>}
        </div>
      </div>

      {user.availability && (
        <span className="inline-block font-mono text-[10px] px-2 py-0.5 rounded-md bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark mt-2">
          {AVAILABILITY_LABELS[user.availability]}
        </span>
      )}

      {user.userSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {user.userSkills.slice(0, 4).map(us => (
            <span key={us.skillId} className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-sky-soft dark:bg-sky-softdark text-sky-text dark:text-sky-textdark">
              {us.skill.name}
            </span>
          ))}
        </div>
      )}
    </>
  );

  if (onInvite) {
    return (
      <div className="rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4">
        {content}
        <button onClick={() => onInvite(user)} className="mt-3 w-full text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky dark:bg-sky-dark text-white">
          {inviteLabel}
        </button>
      </div>
    );
  }

  return (
    <Link to={`/users/${user.id}`} className="block rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4 hover:border-sky/40 dark:hover:border-sky-dark/40 transition-colors">
      {content}
    </Link>
  );
}

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
      <div className="flex items-start gap-3">
        <Avatar user={user} size={44} />
        <div className="min-w-0 pt-0.5">
          <div className="font-semibold text-sm flex items-center gap-1.5 truncate">
            {user.name || 'Unnamed builder'}
            {user.isVerified && <VerifiedBadge size={13} />}
          </div>
          {user.headline && <div className="text-xs text-ink/50 dark:text-ink-dark/50 truncate mt-1">{user.headline}</div>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-5">
        {user.availability ? <span className="text-[10px] font-medium text-green-text dark:text-green-textdark">● {AVAILABILITY_LABELS[user.availability]}</span> : <span />}
        <span className="text-[10px] text-ink/35 dark:text-ink-dark/35">builder</span>
      </div>

      {user.userSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {user.userSkills.slice(0, 4).map(us => <span key={us.skillId} className="text-[10px] px-2 py-1 rounded-md bg-ink/[0.045] dark:bg-ink-dark/[0.045] text-ink/60 dark:text-ink-dark/60">{us.skill.name}</span>)}
        </div>
      )}
    </>
  );

  if (onInvite) {
    return <div className="rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-5">{content}<button onClick={() => onInvite(user)} className="mt-5 w-full ib-button-primary !rounded-lg !py-2">{inviteLabel}</button></div>;
  }

  return <Link to={`/users/${user.id}`} className="group block h-full rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue/25 dark:hover:border-blue-dark/25 hover:shadow-[0_14px_40px_rgba(15,23,42,0.07)] dark:hover:shadow-none">{content}<div className="mt-5 text-[10px] font-medium text-blue-text dark:text-blue-textdark opacity-0 group-hover:opacity-100 transition-opacity">View profile →</div></Link>;
}

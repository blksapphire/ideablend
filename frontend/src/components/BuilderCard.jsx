import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, VerifiedBadge } from './BlendRings';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { ArrowUpRight } from './ui/icons';

const AVAILABILITY_LABELS = {
  HOURS_5_10: '5–10 hrs/wk',
  HOURS_10_20: '10–20 hrs/wk',
  HOURS_20_40: '20–40 hrs/wk',
  FULL_TIME: 'Full-time'
};

function CardContent({ user }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <Avatar user={user} size={44} />
        <div className="min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
            {user.name || 'Unnamed builder'}
            {user.isVerified && <VerifiedBadge size={13} />}
          </div>
          {user.headline && (
            <div className="mt-1 truncate text-xs text-ui-muted">{user.headline}</div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        {user.availability ? (
          <Badge tone="green" size="sm" dot>
            {AVAILABILITY_LABELS[user.availability]}
          </Badge>
        ) : (
          <span />
        )}
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ui-subtle">
          builder
        </span>
      </div>

      {user.userSkills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.userSkills.slice(0, 4).map(userSkill => (
            <Badge key={userSkill.skillId} size="sm">
              {userSkill.skill.name}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}

export default function BuilderCard({ user, onInvite, inviteLabel = 'Invite' }) {
  if (onInvite) {
    return (
      <Card className="flex h-full flex-col">
        <CardContent user={user} />
        <Button size="sm" fullWidth className="mt-5" onClick={() => onInvite(user)}>
          {inviteLabel}
        </Button>
      </Card>
    );
  }

  return (
    <Card
      as={Link}
      to={`/users/${user.id}`}
      interactive
      className="group flex h-full flex-col"
    >
      <CardContent user={user} />
      <div className="mt-5 inline-flex items-center gap-1 text-2xs font-medium text-blue-text opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-textdark">
        View profile
        <ArrowUpRight className="h-3 w-3" />
      </div>
    </Card>
  );
}

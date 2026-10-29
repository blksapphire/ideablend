import React, { useState } from 'react';
import { Avatar, VerifiedBadge } from './BlendRings';
import { post } from '../lib/api';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Stat, StatGroup } from './ui/Stat';
import SectionHeader from './ui/SectionHeader';
import EmptyState from './ui/EmptyState';
import Notice from './ui/Notice';
import { Skeleton } from './ui/Skeleton';
import { ExternalLink, Star } from './ui/icons';

const AVAILABILITY_LABELS = {
  HOURS_5_10: '5–10 hrs/week',
  HOURS_10_20: '10–20 hrs/week',
  HOURS_20_40: '20–40 hrs/week',
  FULL_TIME: 'Full-time'
};

const OPEN_TO_LABELS = [
  ['openToProjects', 'Projects'],
  ['openToCofounder', 'Co-founding'],
  ['openToFreelance', 'Freelance'],
  ['openToEmployment', 'Full-time employment']
];

function Stars({ rating = 0 }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span aria-label={`${rating} out of 5 stars`} className="tracking-wide text-green dark:text-green-dark">
      {'★'.repeat(filled)}
      <span className="text-ui-line/20">{'★'.repeat(5 - filled)}</span>
    </span>
  );
}

function Section({ eyebrow, title, children, className = '' }) {
  return (
    <section className={className}>
      <SectionHeader kicker={eyebrow} title={title} className="mb-4" />
      {children}
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="pb-16">
      <div className="ib-card overflow-hidden">
        <Skeleton className="h-28 rounded-none sm:h-36" />
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            <Skeleton className="h-[6.25rem] w-[6.25rem] rounded-full border-4 border-ui-surface" />
            <div className="flex-1 space-y-2 pb-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-8 border-t border-ui-line/10 pt-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
        <Skeleton className="h-48 rounded-card" />
      </div>
    </div>
  );
}

export default function ProfileView({ profile, reviews, isOwnProfile }) {
  const stats = profile.stats || {};
  const openTo = OPEN_TO_LABELS.filter(([key]) => profile[key]);
  const [isFollowing, setIsFollowing] = useState(!!profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile._count?.followers ?? 0);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState('');

  async function toggleFollow() {
    setFollowBusy(true);
    setFollowError('');
    try {
      if (isFollowing) {
        await post(`/users/${profile.id}/unfollow`, {});
        setIsFollowing(false);
        setFollowerCount(count => Math.max(0, count - 1));
      } else {
        await post(`/users/${profile.id}/follow`, {});
        setIsFollowing(true);
        setFollowerCount(count => count + 1);
      }
    } catch (err) {
      setFollowError(err.message || 'Could not update follow right now.');
    } finally {
      setFollowBusy(false);
    }
  }

  const rating = stats.averageRating == null ? null : Number(stats.averageRating);
  const ratingDisplay = rating == null ? '—' : rating.toFixed(1);
  const availability = profile.availability ? AVAILABILITY_LABELS[profile.availability] : null;
  const links = [
    ['GitHub', profile.githubUrl],
    ['LinkedIn', profile.linkedinUrl],
    ['Portfolio', profile.portfolioUrl],
    ['Website', profile.websiteUrl]
  ].filter(([, url]) => url);

  return (
    <div className="pb-16">
      <Card tone="hero" padding="none" className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-blue-soft via-ui-surface to-green-soft dark:from-blue-softdark dark:via-ui-surface dark:to-green-softdark sm:h-36">
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_20%,rgba(37,99,235,.18),transparent_22%),radial-gradient(circle_at_85%_30%,rgba(22,163,74,.14),transparent_20%)]" />
        </div>

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="rounded-full bg-ui-surface p-1.5 shadow-card">
                <Avatar user={profile} size={88} />
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    {profile.name || 'Unnamed builder'}
                  </h1>
                  {profile.isVerified && <VerifiedBadge />}
                </div>
                {profile.headline && (
                  <p className="mt-1 text-sm text-ui-muted">{profile.headline}</p>
                )}
                {(profile.location || profile.timezone) && (
                  <p className="mt-1.5 text-xs text-ui-subtle">
                    {[profile.location, profile.timezone].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {isOwnProfile ? (
              <Button to="/profile/edit" className="w-full sm:w-auto">
                Edit profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                onClick={toggleFollow}
                loading={followBusy}
                className="w-full sm:w-auto"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          <StatGroup columns={5} className="mt-7 border-t border-ui-line/10 pt-5">
            <Stat value={followerCount} label="Followers" />
            <Stat value={profile._count?.following ?? 0} label="Following" />
            <Stat value={stats.completedProjects ?? 0} label="Projects completed" />
            <Stat
              value={stats.responseRate == null ? '—' : `${stats.responseRate}%`}
              label="Response rate"
            />
            <Stat value={ratingDisplay} label="Average rating" />
          </StatGroup>
        </div>
      </Card>

      {followError && (
        <Notice tone="error" className="mt-4">
          {followError}
        </Notice>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-7">
          {profile.bio && (
            <Section eyebrow="About" title="A little about this builder">
              <Card padding="lg">
                <p className="whitespace-pre-line text-sm leading-7 text-ui-muted">{profile.bio}</p>
              </Card>
            </Section>
          )}

          {profile.userSkills?.length > 0 && (
            <Section eyebrow="Capabilities" title="Skills & experience">
              <Card padding="lg">
                <div className="flex flex-wrap gap-2.5">
                  {profile.userSkills.map(userSkill => (
                    <Badge key={userSkill.skillId} tone="blue" size="md">
                      {userSkill.skill.name}
                      <span className="ml-1 font-mono text-2xs opacity-60">
                        L{userSkill.level}
                      </span>
                    </Badge>
                  ))}
                </div>
              </Card>
            </Section>
          )}

          <Section eyebrow="Reputation" title="What collaborators say">
            {!reviews || reviews.length === 0 ? (
              <EmptyState
                compact
                icon={<Star />}
                title="No reviews yet"
                description="Complete projects together to start building a reputation."
              />
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <Card key={review.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold">
                        <span>{review.reviewer.name}</span>
                        <span aria-hidden className="h-1 w-1 rounded-full bg-ui-line/20" />
                        <span className="text-xs font-normal text-ui-subtle">
                          {review.project.title}
                        </span>
                      </div>
                      <Stars rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-6 text-ui-muted">“{review.comment}”</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <div className="ib-kicker mb-3">Availability</div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span
                className={
                  availability
                    ? 'h-2.5 w-2.5 rounded-full bg-green shadow-[0_0_0_4px_rgba(22,163,74,.10)] dark:bg-green-dark'
                    : 'h-2.5 w-2.5 rounded-full bg-ui-line/25'
                }
              />
              {availability || 'Not specified'}
            </div>

            {openTo.length > 0 && (
              <div className="mt-5 border-t border-ui-line/10 pt-4">
                <div className="ib-kicker mb-2.5">Open to</div>
                <div className="flex flex-wrap gap-2">
                  {openTo.map(([key, label]) => (
                    <Badge key={key} tone="green" size="sm">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {links.length > 0 && (
            <Card>
              <div className="ib-kicker mb-3">Elsewhere</div>
              <div className="space-y-1">
                {links.map(([label, url]) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-ui-raised/60"
                  >
                    <span>{label}</span>
                    <ExternalLink className="text-ui-subtle" />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

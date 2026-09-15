import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, VerifiedBadge } from './BlendRings';
import { post } from '../lib/api';

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
  return (
    <span aria-label={`${rating} out of 5 stars`} className="tracking-wide text-green dark:text-green-dark">
      {'★'.repeat(Math.max(0, Math.min(5, rating)))}
      <span className="text-ink/15 dark:text-ink-dark/15">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

function Metric({ value, label }) {
  return (
    <div className="min-w-0">
      <div className="font-display text-xl sm:text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink/45 dark:text-ink-dark/45">{label}</div>
    </div>
  );
}

function Section({ eyebrow, title, children, className = '' }) {
  return (
    <section className={className}>
      <div className="mb-4">
        {eyebrow && <div className="ib-kicker mb-1.5">{eyebrow}</div>}
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function ProfileView({ profile, reviews, isOwnProfile }) {
  const stats = profile.stats || {};
  const openTo = OPEN_TO_LABELS.filter(([key]) => profile[key]);
  const [isFollowing, setIsFollowing] = useState(!!profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile._count?.followers ?? 0);
  const [followBusy, setFollowBusy] = useState(false);

  async function toggleFollow() {
    setFollowBusy(true);
    try {
      if (isFollowing) {
        await post(`/users/${profile.id}/unfollow`, {});
        setIsFollowing(false);
        setFollowerCount(c => Math.max(0, c - 1));
      } else {
        await post(`/users/${profile.id}/follow`, {});
        setIsFollowing(true);
        setFollowerCount(c => c + 1);
      }
    } catch (err) {
      // Keep the UI stable if the request fails.
    } finally {
      setFollowBusy(false);
    }
  }

  const rating = stats.averageRating == null ? null : Number(stats.averageRating);
  const ratingDisplay = rating == null ? '—' : rating.toFixed(1);
  const availability = profile.availability ? AVAILABILITY_LABELS[profile.availability] : null;

  return (
    <div className="pb-16">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:shadow-none">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-blue-soft via-white to-green-soft dark:from-blue-softdark dark:via-zinc-900 dark:to-green-softdark" />
        <div className="absolute inset-x-0 top-0 h-36 opacity-60 [background-image:radial-gradient(circle_at_20%_20%,rgba(37,99,235,.18),transparent_22%),radial-gradient(circle_at_85%_30%,rgba(22,163,74,.14),transparent_20%)]" />

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="rounded-full bg-surface p-1.5 dark:bg-surfacedark">
                <Avatar user={profile} size={88} />
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                    {profile.name || 'Unnamed builder'}
                  </h1>
                  {profile.isVerified && <VerifiedBadge />}
                </div>
                {profile.headline && (
                  <p className="mt-1 text-sm text-ink/60 dark:text-ink-dark/60">{profile.headline}</p>
                )}
                {(profile.location || profile.timezone) && (
                  <p className="mt-1.5 text-xs text-ink/40 dark:text-ink-dark/40">
                    {[profile.location, profile.timezone].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {isOwnProfile ? (
              <Link to="/profile/edit" className="ib-button-primary w-full sm:w-auto">
                Edit profile
              </Link>
            ) : (
              <button onClick={toggleFollow} disabled={followBusy} className={`${isFollowing ? 'ib-button-secondary' : 'ib-button-primary'} w-full sm:w-auto`}>
                {followBusy ? 'Working…' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-ink/10 pt-5 dark:border-ink-dark/10">
            <Metric value={followerCount} label="Followers" />
            <Metric value={profile._count?.following ?? 0} label="Following" />
            <Metric value={stats.completedProjects ?? 0} label="Projects completed" />
            <Metric value={stats.responseRate == null ? '—' : `${stats.responseRate}%`} label="Response rate" />
            <Metric value={ratingDisplay} label="Average rating" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-7">
          {profile.bio && (
            <Section eyebrow="About" title="A little about this builder">
              <div className="ib-surface rounded-2xl p-5 sm:p-6">
                <p className="whitespace-pre-line text-sm leading-7 text-ink/75 dark:text-ink-dark/75">{profile.bio}</p>
              </div>
            </Section>
          )}

          {profile.userSkills?.length > 0 && (
            <Section eyebrow="Capabilities" title="Skills & experience">
              <div className="ib-surface rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap gap-2.5">
                  {profile.userSkills.map(us => (
                    <span key={us.skillId} className="group rounded-xl border border-blue/10 bg-blue-soft px-3.5 py-2 text-sm font-medium text-blue-text transition-transform hover:-translate-y-0.5 dark:border-blue-dark/10 dark:bg-blue-softdark dark:text-blue-textdark">
                      {us.skill.name}
                      <span className="ml-1.5 font-mono text-[10px] opacity-60">L{us.level}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Section>
          )}

          <Section eyebrow="Reputation" title="What collaborators say">
            {!reviews || reviews.length === 0 ? (
              <div className="ib-surface rounded-2xl p-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-soft text-green dark:bg-green-softdark dark:text-green-dark">★</div>
                <p className="text-sm font-semibold">No reviews yet</p>
                <p className="mt-1 text-xs text-ink/45 dark:text-ink-dark/45">Complete projects together to start building a reputation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <article key={r.id} className="ib-surface rounded-2xl p-5 transition-transform hover:-translate-y-0.5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span>{r.reviewer.name}</span>
                          <span className="h-1 w-1 rounded-full bg-ink/20 dark:bg-ink-dark/20" />
                          <span className="font-normal text-ink/45 dark:text-ink-dark/45">{r.project.title}</span>
                        </div>
                        <div className="mt-1 text-xs"><Stars rating={r.rating} /></div>
                      </div>
                    </div>
                    {r.comment && <p className="mt-4 text-sm leading-6 text-ink/70 dark:text-ink-dark/70">“{r.comment}”</p>}
                  </article>
                ))}
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-4">
          <div className="ib-surface rounded-2xl p-5">
            <div className="ib-kicker mb-3">Availability</div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-green dark:bg-green-dark shadow-[0_0_0_4px_rgba(22,163,74,.10)]" />
              {availability || 'Not specified'}
            </div>

            {openTo.length > 0 && (
              <div className="mt-5 border-t border-ink/10 pt-4 dark:border-ink-dark/10">
                <div className="ib-kicker mb-2.5">Open to</div>
                <div className="flex flex-wrap gap-2">
                  {openTo.map(([key, label]) => (
                    <span key={key} className="rounded-lg bg-green-soft px-2.5 py-1.5 text-xs font-medium text-green-text dark:bg-green-softdark dark:text-green-textdark">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.websiteUrl) && (
            <div className="ib-surface rounded-2xl p-5">
              <div className="ib-kicker mb-3">Elsewhere</div>
              <div className="space-y-1">
                {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-ink/5 dark:hover:bg-white/5"><span>GitHub</span><span className="text-ink/30 dark:text-ink-dark/30">↗</span></a>}
                {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-ink/5 dark:hover:bg-white/5"><span>LinkedIn</span><span className="text-ink/30 dark:text-ink-dark/30">↗</span></a>}
                {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-ink/5 dark:hover:bg-white/5"><span>Portfolio</span><span className="text-ink/30 dark:text-ink-dark/30">↗</span></a>}
                {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-ink/5 dark:hover:bg-white/5"><span>Website</span><span className="text-ink/30 dark:text-ink-dark/30">↗</span></a>}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

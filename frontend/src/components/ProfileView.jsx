import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './BlendRings';

const AVAILABILITY_LABELS = {
  HOURS_5_10: '5–10 hrs/week',
  HOURS_10_20: '10–20 hrs/week',
  HOURS_20_40: '20–40 hrs/week',
  FULL_TIME: 'Full-time'
};

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4 text-center">
      <div className="font-display font-bold text-xl">{value}</div>
      <div className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1">{label}</div>
    </div>
  );
}

function Stars({ rating }) {
  return <span className="text-teal dark:text-teal-dark">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

const OPEN_TO_LABELS = [
  ['openToProjects', 'Projects'],
  ['openToCofounder', 'Co-founding'],
  ['openToFreelance', 'Freelance'],
  ['openToEmployment', 'Full-time employment']
];

export default function ProfileView({ profile, reviews, isOwnProfile }) {
  const stats = profile.stats || {};
  const openTo = OPEN_TO_LABELS.filter(([key]) => profile[key]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar user={profile} size={72} />
          <div>
            <h1 className="font-display font-bold text-xl">{profile.name || 'Unnamed builder'}</h1>
            {profile.headline && <p className="text-sm text-ink/60 dark:text-ink-dark/60">{profile.headline}</p>}
            {(profile.location || profile.timezone) && (
              <p className="font-mono text-xs text-ink/40 dark:text-ink-dark/40 mt-1">
                {[profile.location, profile.timezone].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        {isOwnProfile && (
          <Link to="/profile/edit" className="px-4 py-2 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold whitespace-nowrap">
            Edit profile
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Completed projects" value={stats.completedProjects ?? 0} />
        <StatCard label="Response rate" value={stats.responseRate == null ? '—' : `${stats.responseRate}%`} />
        <StatCard label="Rating" value={stats.averageRating == null ? '—' : `${stats.averageRating}★ (${stats.reviewCount})`} />
      </div>

      {profile.bio && <p className="text-sm leading-relaxed mb-6">{profile.bio}</p>}

      {openTo.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {openTo.map(([key, label]) => (
            <span key={key} className="font-mono text-[11px] px-2 py-1 rounded-md bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark">
              Open to {label}
            </span>
          ))}
        </div>
      )}

      {profile.availability && (
        <p className="text-xs text-ink/50 dark:text-ink-dark/50 mb-4">Availability: {AVAILABILITY_LABELS[profile.availability]}</p>
      )}

      <div className="flex flex-wrap gap-3 mb-6 text-sm">
        {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-violet-text dark:text-violet-textdark">GitHub</a>}
        {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-violet-text dark:text-violet-textdark">LinkedIn</a>}
        {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-violet-text dark:text-violet-textdark">Portfolio</a>}
        {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="text-violet-text dark:text-violet-textdark">Website</a>}
      </div>

      {profile.userSkills?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.userSkills.map(us => (
              <span key={us.skillId} className="font-mono text-xs px-3 py-1.5 rounded-full bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark">
                {us.skill.name} · L{us.level}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Reviews</h3>
        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-ink-dark/50">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{r.reviewer.name}</span>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-xs text-ink/50 dark:text-ink-dark/50 mb-1">{r.project.title}</p>
                {r.comment && <p className="text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

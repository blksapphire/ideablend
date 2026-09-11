import React from 'react';
import { Link } from 'react-router-dom';
import { RoleRings } from './BlendRings';

export default function ProjectCard({ project }) {
  const firstRole = project.roles?.[0];
  const totalSlots = project.roles?.reduce((s, r) => s + r.slots, 0) || 0;
  const filledSlots = project.roles?.reduce((s, r) => s + (r.filledSlots ?? r.memberships?.length ?? 0), 0) || 0;
  const progressPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const openRoles = project.roles?.filter(r => (r.filledSlots ?? r.memberships?.length ?? 0) < r.slots) || [];

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-5 hover:border-blue/40 dark:hover:border-blue-dark/40 transition-colors"
    >
      <div className="flex flex-wrap gap-1.5">
        {project.category && (
          <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-ink/8 dark:bg-ink-dark/8 text-ink/70 dark:text-ink-dark/70">
            {project.category.toUpperCase()}
          </span>
        )}
        {project.stage && (
          <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-blue-soft dark:bg-blue-softdark text-blue-text dark:text-blue-textdark">
            {project.stage}
          </span>
        )}
        {project.commitment && (
          <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-ink/5 dark:bg-ink-dark/5 text-ink/60 dark:text-ink-dark/60">
            {project.commitment}
          </span>
        )}
      </div>

      <h3 className="font-display font-semibold text-base mt-3">{project.title}</h3>
      <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-2 line-clamp-2">{project.description}</p>

      {openRoles.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {openRoles.slice(0, 3).map(r => (
            <span key={r.id} className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-green-soft dark:bg-green-softdark text-green-text dark:text-green-textdark">
              {r.name}
            </span>
          ))}
        </div>
      )}

      {totalSlots > 0 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-page dark:bg-pagedark overflow-hidden">
            <div className="h-full bg-blue dark:bg-blue-dark" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-ink/20 dark:border-ink-dark/20">
        {firstRole ? <RoleRings role={firstRole} size={26} /> : <span />}
        <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">{filledSlots}/{totalSlots} filled</span>
      </div>
    </Link>
  );
}

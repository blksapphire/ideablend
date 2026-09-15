import React from 'react';
import { Link } from 'react-router-dom';
import { RoleRings } from './BlendRings';

export default function ProjectCard({ project, featured = false }) {
  const firstRole = project.roles?.[0];
  const totalSlots = project.roles?.reduce((s, r) => s + r.slots, 0) || 0;
  const filledSlots = project.roles?.reduce((s, r) => s + (r.filledSlots ?? r.memberships?.length ?? 0), 0) || 0;
  const progressPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const openRoles = project.roles?.filter(r => (r.filledSlots ?? r.memberships?.length ?? 0) < r.slots) || [];

  return (
    <Link
      to={`/projects/${project.id}`}
      className={`group relative flex h-full flex-col rounded-2xl border border-ink/10 dark:border-ink-dark/10 bg-surface dark:bg-surfacedark p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue/25 dark:hover:border-blue-dark/25 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)] dark:hover:shadow-none ${featured ? 'md:p-6' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {project.category && <span className="ib-kicker rounded-md bg-ink/[0.045] dark:bg-ink-dark/[0.045] px-2 py-1 !tracking-[0.08em]">{project.category}</span>}
          {project.stage && <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded-md bg-blue-soft dark:bg-blue-softdark text-blue-text dark:text-blue-textdark">{project.stage}</span>}
        </div>
        <span className="text-ink/25 dark:text-ink-dark/25 group-hover:text-blue transition-colors text-lg leading-none">↗</span>
      </div>

      <h3 className="font-display font-semibold text-[15px] leading-snug mt-4 group-hover:text-blue dark:group-hover:text-blue-dark transition-colors">{project.title}</h3>
      <p className="text-sm leading-6 text-ink/55 dark:text-ink-dark/55 mt-2 line-clamp-3">{project.description}</p>

      <div className="mt-auto pt-5">
        {openRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {openRoles.slice(0, 3).map(r => <span key={r.id} className="text-[10px] font-medium px-2 py-1 rounded-md bg-green-soft dark:bg-green-softdark text-green-text dark:text-green-textdark">{r.name}</span>)}
            {openRoles.length > 3 && <span className="text-[10px] text-ink/40 dark:text-ink-dark/40 px-1 py-1">+{openRoles.length - 3}</span>}
          </div>
        )}

        {totalSlots > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-[10px] mb-1.5"><span className="text-ink/40 dark:text-ink-dark/40">Team</span><span className="font-mono text-ink/50 dark:text-ink-dark/50">{filledSlots}/{totalSlots}</span></div>
            <div className="h-1 rounded-full bg-ink/8 dark:bg-ink-dark/8 overflow-hidden"><div className="h-full rounded-full bg-blue dark:bg-blue-dark transition-all" style={{ width: `${progressPct}%` }} /></div>
          </div>
        )}

        <div className="flex justify-between items-center mt-5 pt-4 border-t border-ink/8 dark:border-ink-dark/8">
          <div className="flex items-center gap-2 min-w-0">
            {firstRole ? <RoleRings role={firstRole} size={26} /> : <div className="h-7 w-7 rounded-full bg-ink/5 dark:bg-ink-dark/5" />}
            {project.commitment && <span className="text-[10px] text-ink/40 dark:text-ink-dark/40 truncate">{project.commitment}</span>}
          </div>
          <span className="text-[10px] font-medium text-blue-text dark:text-blue-textdark opacity-0 group-hover:opacity-100 transition-opacity">View project</span>
        </div>
      </div>
    </Link>
  );
}

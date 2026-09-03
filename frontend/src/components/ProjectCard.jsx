import React from 'react';
import { Link } from 'react-router-dom';
import { RoleRings, SlotSummary } from './BlendRings';

export default function ProjectCard({ project }) {
  const firstRole = project.roles?.[0];
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-5 hover:border-violet/40 dark:hover:border-violet-dark/40 transition-colors"
    >
      {project.category && (
        <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-violet-soft dark:bg-violet-softdark text-violet-text dark:text-violet-textdark">
          {project.category.toUpperCase()}
        </span>
      )}
      <h3 className="font-display font-semibold text-base mt-3">{project.title}</h3>
      <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-2 line-clamp-2">{project.description}</p>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-ink/20 dark:border-ink-dark/20">
        {firstRole ? <RoleRings role={firstRole} size={26} /> : <span />}
        {project.roles && <SlotSummary roles={project.roles} />}
      </div>
    </Link>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { RoleRings } from './BlendRings';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Progress from './ui/Progress';
import { ArrowUpRight } from './ui/icons';

export default function ProjectCard({ project, featured = false }) {
  const firstRole = project.roles?.[0];
  const totalSlots = project.roles?.reduce((sum, role) => sum + role.slots, 0) || 0;
  const filledSlots =
    project.roles?.reduce(
      (sum, role) => sum + (role.filledSlots ?? role.memberships?.length ?? 0),
      0
    ) || 0;
  const openRoles =
    project.roles?.filter(
      role => (role.filledSlots ?? role.memberships?.length ?? 0) < role.slots
    ) || [];

  return (
    <Card
      as={Link}
      to={`/projects/${project.id}`}
      padding={featured ? 'lg' : 'md'}
      interactive
      className="group relative flex h-full flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {project.category && (
            <Badge mono size="sm">
              {project.category}
            </Badge>
          )}
          {project.stage && (
            <Badge tone="blue" mono size="sm">
              {project.stage}
            </Badge>
          )}
        </div>
        <ArrowUpRight className="text-ui-subtle/60 transition-colors group-hover:text-blue dark:group-hover:text-blue-dark" />
      </div>

      <h3 className="mt-4 font-display text-[15px] font-semibold leading-snug transition-colors group-hover:text-blue dark:group-hover:text-blue-dark">
        {project.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-ui-muted">{project.description}</p>

      <div className="mt-auto pt-5">
        {openRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {openRoles.slice(0, 3).map(role => (
              <Badge key={role.id} tone="green" size="sm">
                {role.name}
              </Badge>
            ))}
            {openRoles.length > 3 && (
              <span className="px-1 py-1 text-2xs text-ui-subtle">+{openRoles.length - 3}</span>
            )}
          </div>
        )}

        {totalSlots > 0 && (
          <Progress
            className="mt-5"
            value={filledSlots}
            max={totalSlots}
            size="sm"
            label={`Team ${filledSlots}/${totalSlots}`}
          />
        )}

        <div className="mt-5 flex items-center justify-between border-t border-ui-line/8 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            {firstRole ? (
              <RoleRings role={firstRole} size={26} />
            ) : (
              <div className="h-7 w-7 rounded-full bg-ui-raised" />
            )}
            {project.commitment && (
              <span className="truncate text-2xs text-ui-subtle">{project.commitment}</span>
            )}
          </div>
          <span className="text-2xs font-medium text-blue-text opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-textdark">
            View project
          </span>
        </div>
      </div>
    </Card>
  );
}

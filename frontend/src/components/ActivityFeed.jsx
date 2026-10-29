import React from 'react';
import { Link } from 'react-router-dom';

const ACTIVITY_ICON = {
  MEMBER_JOINED: '→',
  MEMBER_REMOVED: '✕',
  TASK_CREATED: '+',
  TASK_COMPLETED: '✓',
  MILESTONE_CREATED: '◆',
  MILESTONE_COMPLETED: '★',
  PROJECT_COMPLETED: '🎉'
};

export default function ActivityFeed({ activities, showProject = false, emptyText = 'Nothing yet.' }) {
  if (!activities || activities.length === 0) {
    return <p className="text-sm text-ui-muted">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {activities.map(activity => (
        <li key={activity.id} className="flex items-start gap-2.5 text-sm">
          <span
            aria-hidden="true"
            className="w-4 shrink-0 pt-px font-mono text-xs text-blue-text dark:text-blue-textdark"
          >
            {ACTIVITY_ICON[activity.type] || '•'}
          </span>
          <span className="leading-relaxed text-ui-muted">
            {activity.message}
            {showProject && activity.project && (
              <>
                {' '}on{' '}
                <Link
                  to={`/projects/${activity.project.id}`}
                  className="font-medium text-ui-fg transition-colors hover:text-blue-text dark:hover:text-blue-textdark"
                >
                  {activity.project.title}
                </Link>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

const ACTIVITY_ICON = {
  MEMBER_JOINED: '→', MEMBER_REMOVED: '✕', TASK_CREATED: '+', TASK_COMPLETED: '✓',
  MILESTONE_CREATED: '◆', MILESTONE_COMPLETED: '★', PROJECT_COMPLETED: '🎉'
};

export default function ActivityFeed({ activities, showProject = false, emptyText = 'Nothing yet.' }) {
  if (!activities || activities.length === 0) {
    return <p className="text-sm text-ink/50 dark:text-ink-dark/50">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {activities.map(a => (
        <div key={a.id} className="flex items-start gap-2 text-sm">
          <span className="font-mono text-xs text-blue-text dark:text-blue-textdark w-4 shrink-0">{ACTIVITY_ICON[a.type] || '•'}</span>
          <span className="text-ink/70 dark:text-ink-dark/70">
            {a.message}
            {showProject && a.project && (
              <>
                {' '}on <Link to={`/projects/${a.project.id}`} className="font-medium hover:text-blue-text dark:hover:text-blue-textdark">{a.project.title}</Link>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

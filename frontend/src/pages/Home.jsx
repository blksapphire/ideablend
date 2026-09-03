import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <span className="font-mono text-xs px-3 py-1 rounded-md bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark">
          for builders, by builders
        </span>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight mt-4">
          Find your team.<br />Ship the idea.
        </h1>
        <p className="text-ink/60 dark:text-ink-dark/60 mt-5 max-w-md leading-relaxed">
          Idea Blend is where African developers, designers, and founders team up on real projects
          — pick a role, join the squad, build together.
        </p>
        <div className="flex gap-3 mt-7">
          <Link to="/create" className="px-5 py-3 rounded-xl bg-violet dark:bg-violet-dark text-white font-semibold text-sm">
            Post a project
          </Link>
          <Link to="/explore" className="px-5 py-3 rounded-xl border border-ink/25 dark:border-ink-dark/25 font-semibold text-sm">
            Browse open roles
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-6">
        <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-teal-soft dark:bg-teal-softdark text-teal-text dark:text-teal-textdark">
          LOGISTICS
        </span>
        <h3 className="font-display font-semibold mt-3">Live dispatch rider tracker</h3>
        <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-2">
          Real-time delivery tracking for local dispatch riders and their customers.
        </p>
      </div>
    </div>
  );
}

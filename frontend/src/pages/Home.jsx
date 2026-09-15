import React from 'react';
import { Link } from 'react-router-dom';

const signals = [
  ['01', 'Find people who fit the work'],
  ['02', 'Join projects with room to contribute'],
  ['03', 'Build, ship, and leave something behind']
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-14 lg:gap-20 items-end">
          <div>
            <div className="flex items-center gap-3 mb-7">
              <span className="h-px w-10 bg-blue" />
              <span className="ib-kicker">For people who want to build</span>
            </div>

            <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl leading-[1.02] max-w-4xl">
              Good ideas get better when the right people show up.
            </h1>

            <p className="mt-7 text-lg md:text-xl leading-relaxed text-ink/60 dark:text-ink-dark/60 max-w-2xl">
              Idea Blend is a place to find projects, find collaborators, and turn unfinished ideas into things people can actually use.
            </p>

            <div className="flex flex-wrap gap-3 mt-9">
              <Link to="/create" className="ib-button-primary">Start a project <span aria-hidden className="ml-2">→</span></Link>
              <Link to="/explore" className="ib-button-secondary">Explore projects</Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-14 max-w-2xl">
              {signals.map(([num, text]) => (
                <div key={num} className="border-t border-ink/10 dark:border-ink-dark/10 pt-3">
                  <div className="font-mono text-[10px] text-blue">{num}</div>
                  <p className="text-sm font-medium mt-2 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pb-2">
            <div className="ib-surface rounded-[1.75rem] p-5 md:p-6 rotate-[1deg]">
              <div className="flex items-center justify-between pb-5 border-b border-ink/10 dark:border-ink-dark/10">
                <div>
                  <div className="ib-kicker">A project in motion</div>
                  <h2 className="font-display text-xl font-semibold mt-2">Build something useful</h2>
                </div>
                <span className="h-3 w-3 rounded-full bg-green" title="Open" />
              </div>

              <div className="py-6">
                <p className="text-sm leading-6 text-ink/60 dark:text-ink-dark/60">
                  A small team is shaping an idea. There is a clear problem, an open role, and enough room for someone new to make a real contribution.
                </p>

                <div className="mt-7 space-y-4">
                  {['Product', 'Design', 'Engineering'].map((role, index) => (
                    <div key={role} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-ink/5 dark:bg-ink-dark/5 flex items-center justify-center font-mono text-xs">{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="font-medium">{role}</span>
                          <span className="font-mono text-[10px] text-ink/40 dark:text-ink-dark/40">open</span>
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-ink/8 dark:bg-ink-dark/8 overflow-hidden">
                          <div className="h-full rounded-full bg-blue" style={{ width: `${index === 1 ? 42 : 68}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-ink/10 dark:border-ink-dark/10 flex items-center justify-between">
                <span className="text-xs text-ink/45 dark:text-ink-dark/45">Open collaboration</span>
                <span className="font-mono text-[10px] text-green">3 spots</span>
              </div>
            </div>
            <div className="absolute -z-10 -bottom-5 -left-5 h-28 w-28 rounded-full border border-blue/10" />
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 dark:border-ink-dark/10 bg-white/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-7 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink/50 dark:text-ink-dark/50">Projects need more than an idea. They need people who care enough to build them.</p>
          <Link to="/explore" className="text-sm font-semibold text-blue dark:text-blue-dark hover:underline">See what people are building →</Link>
        </div>
      </section>
    </main>
  );
}

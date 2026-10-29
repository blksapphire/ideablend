import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import { ArrowRight } from '../components/ui/icons';
import useDocumentMeta from '../hooks/useDocumentMeta';

const signals = [
  ['01', 'Find people who fit the work'],
  ['02', 'Join projects with room to contribute'],
  ['03', 'Build, ship, and leave something behind']
];

const roles = [
  ['Product', 68],
  ['Design', 42],
  ['Engineering', 68]
];

export default function Home() {
  useDocumentMeta({
    title: 'Find your team',
    description:
      'Idea Blend is a place to find projects, find collaborators, and turn unfinished ideas into things people can actually use.'
  });

  return (
    <main className="overflow-hidden">
      <section className="mx-auto max-w-shell px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
          <div className="motion-safe:animate-ib-fade-up">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-blue" />
              <span className="ib-kicker">For people who want to build</span>
            </div>

            <h1 className="max-w-4xl font-display text-display-md font-bold text-balance sm:text-display-lg md:text-display-xl">
              Good ideas get better when the right people show up.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ui-muted md:text-xl">
              Idea Blend is a place to find projects, find collaborators, and turn unfinished ideas
              into things people can actually use.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/create" size="lg" trailingIcon={<ArrowRight />}>
                Start a project
              </Button>
              <Button to="/explore" variant="secondary" size="lg">
                Explore projects
              </Button>
            </div>

            <div className="mt-14 grid max-w-2xl gap-4 sm:grid-cols-3">
              {signals.map(([num, text]) => (
                <div key={num} className="border-t border-ui-line/10 pt-3">
                  <div className="font-mono text-[10px] text-blue dark:text-blue-dark">{num}</div>
                  <p className="mt-2 text-sm font-medium leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pb-2">
            <Card
              tone="hero"
              padding="lg"
              className="rotate-[1deg] motion-safe:animate-ib-fade-up [animation-delay:120ms]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-ui-line/10 pb-5">
                <div>
                  <div className="ib-kicker">A project in motion</div>
                  <h2 className="mt-2 font-display text-xl font-semibold">
                    Build something useful
                  </h2>
                </div>
                <Badge tone="green" size="sm" dot mono>
                  Open
                </Badge>
              </div>

              <div className="py-6">
                <p className="text-sm leading-6 text-ui-muted">
                  A small team is shaping an idea. There is a clear problem, an open role, and enough
                  room for someone new to make a real contribution.
                </p>

                <div className="mt-7 space-y-4">
                  {roles.map(([role, width], index) => (
                    <div key={role} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ui-raised font-mono text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="font-medium">{role}</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ui-subtle">
                            open
                          </span>
                        </div>
                        <div className="mt-2" aria-hidden="true">
                          <Progress value={width} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-ui-line/10 pt-4">
                <span className="text-xs text-ui-subtle">Open collaboration</span>
                <span className="font-mono text-2xs uppercase tracking-[0.12em] text-green-text dark:text-green-textdark">
                  3 spots
                </span>
              </div>
            </Card>
            <div className="absolute -bottom-5 -left-5 -z-10 h-28 w-28 rounded-full border border-blue/10" />
          </div>
        </div>
      </section>

      <section className="border-y border-ui-line/10 bg-ui-surface/50">
        <div className="mx-auto flex max-w-shell flex-wrap items-center justify-between gap-4 px-6 py-7">
          <p className="max-w-2xl text-sm text-ui-muted">
            Projects need more than an idea. They need people who care enough to build them.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue transition-colors hover:text-blue-text dark:text-blue-dark dark:hover:text-blue-textdark"
          >
            See what people are building
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

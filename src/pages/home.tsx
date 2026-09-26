import { useMemo, useState } from 'react';
import { ArrowRight, Check, CloudSun, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { getGetGraceTodayQueryKey, useGetGraceToday } from '@/api-client';

function TodaySkeleton() {
  return (
    <div className="space-y-7" aria-label="Loading today’s practice">
      <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
      <div className="space-y-3">
        <div className="h-14 w-4/5 animate-pulse rounded-xl bg-muted" />
        <div className="h-14 w-3/5 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-[28px] bg-muted" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[28px] bg-muted" />
        <div className="h-48 animate-pulse rounded-[28px] bg-muted" />
      </div>
    </div>
  );
}

function getLocalDayDetails() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12
    ? 'Good morning, gently.'
    : hour < 18
      ? 'Good afternoon, gently.'
      : 'Good evening, gently.';

  return {
    greeting,
    date: new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(now),
  };
}

export function HomePage() {
  const todayQuery = useGetGraceToday({
    query: {
      queryKey: getGetGraceTodayQueryKey(),
      staleTime: 1000 * 60 * 10,
    },
  });
  const [isComplete, setIsComplete] = useState(false);
  const localDay = useMemo(getLocalDayDetails, []);

  if (todayQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-12 md:py-16">
        <TodaySkeleton />
      </div>
    );
  }

  if (todayQuery.isError || !todayQuery.data) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-5xl items-center px-5 py-10 md:px-12">
        <div className="max-w-md rounded-[30px] border border-border bg-card p-8 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-foreground"><CloudSun className="size-6" strokeWidth={1.5} /></div>
          <h1 className="mt-6 font-serif text-4xl tracking-[-0.035em]">The day can wait a breath.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">We couldn’t bring your practice in just now. Your space is still here when you are.</p>
          <button type="button" onClick={() => todayQuery.refetch()} data-testid="button-retry-today" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
            <RefreshCw className="size-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const { greeting, reflection, action, affirmation } = todayQuery.data;

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden px-5 py-8 md:px-12 md:py-14 xl:px-20">
      <div className="pointer-events-none absolute -right-28 -top-32 size-[410px] rounded-full bg-secondary/60 blur-[1px] md:size-[520px]" />
      <div className="pointer-events-none absolute right-28 top-24 size-20 rounded-full border border-accent/50 bg-accent/20 grace-drift" />
      <div className="relative">
        <div className="flex items-center justify-between grace-rise">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            {localDay.date}
          </div>
          <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className="size-2 rounded-full bg-[hsl(var(--chart-5))]" /> a daily kindness practice</span>
        </div>

        <section className="mt-14 max-w-3xl md:mt-20">
          <p className="text-sm font-medium text-muted-foreground grace-rise grace-rise-delay-1">{localDay.greeting}</p>
          <h1 data-testid="text-greeting" className="mt-4 font-serif text-[clamp(3.3rem,8vw,7.4rem)] leading-[0.94] tracking-[-0.065em] text-primary grace-rise grace-rise-delay-2">
            {greeting}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground grace-rise grace-rise-delay-3 md:text-lg">{reflection}</p>
        </section>

        <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-[1.15fr_.85fr]">
          <article className="relative overflow-hidden rounded-[30px] bg-primary p-7 text-primary-foreground shadow-md grace-rise grace-rise-delay-3 md:p-10">
            <div className="absolute -right-10 -top-10 size-44 rounded-full border border-primary-foreground/10" />
            <div className="absolute -right-2 top-0 size-20 rounded-full bg-accent/80 grace-breathe" />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65"><Sparkles className="size-4" /> A moment to notice</div>
              <Link href={`/chat?prompt=${encodeURIComponent(reflection)}`} data-testid="link-daily-prompt" className="mt-9 block max-w-xl">
                <p data-testid="text-reflection" className="font-serif text-[clamp(1.8rem,3.2vw,3rem)] leading-[1.1] tracking-[-0.04em]">{reflection}</p>
              </Link>
              <Link href="/chat" data-testid="link-reflect-with-grace" className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5">
                Reflect with Rose <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>

          <article className="rounded-[30px] border border-border bg-card p-7 shadow-sm grace-rise grace-rise-delay-4 md:p-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"><span className="size-2 rounded-full bg-accent" /> A small action</div>
              <span className="text-xs text-muted-foreground">01</span>
            </div>
            <p data-testid="text-action" className="mt-9 font-serif text-[clamp(1.65rem,2.5vw,2.4rem)] leading-[1.12] tracking-[-0.04em]">{action}</p>
            <button
              type="button"
              onClick={() => setIsComplete((value) => !value)}
              data-testid="button-complete-action"
              aria-pressed={isComplete}
              className={`mt-10 flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${isComplete ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-secondary'}`}
            >
              <span className={`flex size-5 items-center justify-center rounded-full border ${isComplete ? 'border-primary-foreground bg-primary-foreground text-primary' : 'border-muted-foreground/50'}`}>{isComplete && <Check className="size-3.5" strokeWidth={3} />}</span>
              {isComplete ? 'A little kindness, done' : 'Mark as done'}
            </button>
          </article>
        </div>

        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-stretch">
          <article className="flex-1 rounded-[26px] border border-border bg-secondary/55 p-7 grace-rise grace-rise-delay-4 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Carry this with you</p>
            <p data-testid="text-affirmation" className="mt-5 max-w-2xl font-serif text-2xl leading-tight tracking-[-0.035em] md:text-3xl">“{affirmation}”</p>
          </article>
          <div className="flex items-center rounded-[26px] border border-border bg-card p-6 shadow-sm md:w-[245px] md:flex-col md:items-start md:justify-between md:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Need a little more room?</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">Rose is here to listen without rushing you.</p>
            </div>
            <Link href="/chat" data-testid="link-talk-with-grace" className="ml-5 flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-transform hover:-translate-y-1 md:ml-0 md:mt-5">
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Heart, MessageCircle, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck, getHealthCheckQueryKey } from '@/api-client';
import type { ReactNode } from 'react';

interface GraceShellProps {
  children: ReactNode;
}

export function GraceShell({ children }: GraceShellProps) {
  const [location] = useLocation();
  const health = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      staleTime: 60_000,
    },
  });
  const isChat = location === '/chat';

  return (
    <div className="grace-grain min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="relative flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Heart className="size-[18px] fill-current" strokeWidth={1.6} />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
          </div>
          <div>
            <p className="font-serif text-[22px] leading-none tracking-[-0.03em]">rose.ai</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">a softer place to land</p>
          </div>
        </div>

        <div className="mt-14 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your practice</p>
          <nav className="mt-4 space-y-2" aria-label="Primary navigation">
            <Link
              href="/"
              data-testid="link-today"
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                !isChat ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground'
              }`}
            >
              <Sparkles className="size-[17px]" strokeWidth={1.8} />
              <span>Today</span>
              {!isChat && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
            </Link>
            <Link
              href="/chat"
              data-testid="link-conversation"
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                isChat ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground'
              }`}
            >
              <MessageCircle className="size-[17px]" strokeWidth={1.8} />
              <span>Talk with Rose</span>
              {isChat && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
            </Link>
          </nav>
        </div>

        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground">
            <span className={`size-2 rounded-full ${health.isError ? 'bg-destructive' : 'bg-[hsl(var(--chart-5))]'}`} />
            {health.isError ? 'Taking a quiet pause' : 'Rose is here'}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">No fixing. No performing. Just one honest moment at a time.</p>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-border/70 bg-background/85 px-5 py-4 backdrop-blur-md md:hidden">
        <Link href="/" data-testid="link-mobile-logo" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="size-4 fill-current" strokeWidth={1.6} />
          </span>
          <span className="font-serif text-xl tracking-[-0.03em]">rose.ai</span>
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <Link href="/" data-testid="link-mobile-today" aria-label="Today" className={`rounded-full p-2 ${!isChat ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}>
            <Sparkles className="size-4" />
          </Link>
          <Link href="/chat" data-testid="link-mobile-chat" aria-label="Talk with Rose" className={`rounded-full p-2 ${isChat ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}>
            <MessageCircle className="size-4" />
          </Link>
        </div>
      </header>

      <main className="min-h-[100dvh] md:pl-[252px]">{children}</main>
    </div>
  );
}
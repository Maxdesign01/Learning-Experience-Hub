import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clock3,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Library,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Lesson, Project, Stage } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

export const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/learn', label: 'Curriculum', icon: BookOpen },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/resources', label: 'Resources', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={cn('group flex items-center gap-3', compact && 'gap-2')} data-testid="link-brand">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-primary text-primary-foreground shadow-[4px_4px_0_hsl(var(--foreground)/.12)]">
        <span className="font-display text-xl font-bold leading-none">V</span>
      </span>
      {!compact ? (
        <span className="font-display text-[1.13rem] font-bold tracking-[-.03em] text-sidebar-foreground">
          Vibe<span className="text-primary">Learn</span>
        </span>
      ) : null}
    </Link>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-muted', className)} aria-label={`${Math.round(value)} percent complete`}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const label = status.replaceAll('_', ' ');
  const tone = status === 'completed' ? 'bg-accent text-accent-foreground' : status === 'in_progress' ? 'bg-primary/12 text-primary' : status === 'needs_review' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground';
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-[.08em]', tone)} data-testid={`status-${status}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export function MetricCard({ label, value, note, icon: Icon, accent = 'primary' }: { label: string; value: string | number; note: string; icon: typeof Gauge; accent?: 'primary' | 'teal' | 'lime' }) {
  const iconClass = accent === 'teal' ? 'bg-secondary text-secondary-foreground' : accent === 'lime' ? 'bg-accent text-accent-foreground' : 'bg-primary/12 text-primary';
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_8px_24px_hsl(var(--foreground)/.035)]" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('grid h-9 w-9 place-items-center rounded-xl', iconClass)}><Icon size={17} /></span>
        <span className="font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">signal</span>
      </div>
      <p className="mt-5 font-display text-[1.75rem] font-bold tracking-[-.05em] text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-foreground">{title}</h2>
        {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="space-y-5 p-1" data-testid="status-loading">
      <div className="h-10 w-1/3 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /></div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      <p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{label}</p>
    </div>
  );
}

export function QueryError({ onRetry, message = 'We could not load this part of your workspace.' }: { onRetry?: () => void; message?: string }) {
  return <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-primary/40 bg-primary/[.04] p-8 text-center" data-testid="status-error"><CircleHelp className="mb-3 text-primary" size={24} /><p className="font-semibold">{message}</p><p className="mt-1 text-sm text-muted-foreground">Try again, or return to your dashboard.</p>{onRetry ? <button onClick={onRetry} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:translate-y-[-1px]" data-testid="button-retry">Retry</button> : null}</div>;
}

export function AppShell({ children, title, section }: { children: ReactNode; title?: string; section?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const initials = (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'V').toUpperCase();

  const side = (
    <aside className={cn('flex h-full min-h-[100dvh] flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground transition-[width] duration-200', collapsed ? 'w-[78px]' : 'w-[246px]')}>
      <div className={cn('flex items-center justify-between px-2', collapsed && 'justify-center')}><Brand compact={collapsed} />{!collapsed ? <button onClick={() => setCollapsed(true)} className="grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground" data-testid="button-collapse-sidebar"><PanelLeftClose size={16} /></button> : null}</div>
      {collapsed ? <button onClick={() => setCollapsed(false)} className="mx-auto mt-5 grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground" data-testid="button-expand-sidebar"><PanelLeftOpen size={16} /></button> : null}
      <div className={cn('mt-10 px-2 font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/40', collapsed && 'text-center')}>{collapsed ? '•••' : 'Workspace'}</div>
      <nav className="mt-3 space-y-1" aria-label="Primary navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href !== '/dashboard' && location.startsWith(`${href}/`));
          return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground', active && 'bg-sidebar-accent text-sidebar-foreground shadow-[inset_3px_0_hsl(var(--sidebar-primary))]', collapsed && 'justify-center px-2')} data-testid={`link-nav-${label.toLowerCase()}`}><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span className={cn(collapsed && 'sr-only')}>{label}</span>{active && !collapsed ? <ChevronRight className="ml-auto text-sidebar-primary" size={14} /> : null}</Link>;
        })}
      </nav>
      <div className="mt-auto">
        {!collapsed ? <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-3"><div className="flex items-center justify-between"><span className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-sidebar-foreground/55">Build mode</span><span className="h-2 w-2 rounded-full bg-accent" /></div><p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/70">Learn a concept. Ship the smallest proof.</p></div> : null}
        <button onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground', collapsed && 'justify-center px-2')} data-testid="button-sign-out"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</span>{!collapsed ? <span className="min-w-0"><span className="block truncate text-xs font-bold text-sidebar-foreground">{user?.firstName ?? 'Learner'}</span><span className="block truncate text-[10px] text-sidebar-foreground/45">Personal workspace</span></span> : null}</button>
      </div>
    </aside>
  );

  return <div className="noise-layer min-h-[100dvh] bg-background text-foreground"><div className="flex min-h-[100dvh]"><div className="hidden lg:block">{side}</div>{mobileOpen ? <div className="fixed inset-0 z-40 lg:hidden"><button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-foreground/35" data-testid="button-close-mobile-nav" /><div className="relative h-full w-[278px]">{side}</div></div> : null}<main className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-7"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden" data-testid="button-open-mobile-nav"><Menu size={18} /></button><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">{section ?? 'Personal learning OS'}</p>{title ? <p className="mt-0.5 text-sm font-bold">{title}</p> : null}</div></div><div className="flex items-center gap-3"><span className="hidden items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-accent-foreground" /> Local session</span><Link href="/settings" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-xs font-bold shadow-sm" data-testid="link-header-profile">{initials}</Link></div></header><div className="mx-auto max-w-[1420px] p-4 sm:p-7">{children}</div></main></div><nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-border bg-card/95 p-2 shadow-[0_10px_30px_hsl(var(--foreground)/.12)] backdrop-blur-md lg:hidden">{navItems.slice(0, 4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn('grid min-w-14 place-items-center gap-1 rounded-xl px-2 py-1.5 text-muted-foreground', location.startsWith(href) && 'bg-primary/10 text-primary')} data-testid={`link-mobile-${label.toLowerCase()}`}><Icon size={17} /><span className="text-[9px] font-bold">{label}</span></Link>)}</nav></div>;
}

export function LessonMeta({ lesson }: { lesson: Lesson }) {
  return <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{lesson.duration} min</span><span className="h-1 w-1 rounded-full bg-border" /><span className="capitalize">{lesson.difficulty}</span><span className="h-1 w-1 rounded-full bg-border" /><span>{lesson.topic}</span></div>;
}

export function NextLessonCard({ lesson, stage }: { lesson: Lesson; stage?: Stage }) {
  return <div className="relative overflow-hidden rounded-2xl bg-sidebar p-5 text-sidebar-foreground shadow-[0_14px_30px_hsl(var(--foreground)/.1)]"><div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border-[18px] border-primary/20" /><div className="absolute -right-5 -top-5 h-24 w-24 rounded-full border-[10px] border-accent/15" /><div className="relative"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary">Up next · Stage {stage?.number ?? lesson.stageNumber}</p><Target size={17} className="text-accent" /></div><h3 className="mt-4 max-w-lg font-display text-2xl font-bold tracking-[-.04em]">{lesson.title}</h3><p className="mt-2 max-w-lg text-sm leading-relaxed text-sidebar-foreground/65">{lesson.description}</p><div className="mt-5 flex flex-wrap items-center gap-3"><Link href={`/lessons/${lesson.id}`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:translate-y-[-1px]" data-testid={`link-continue-lesson-${lesson.id}`}>Continue lesson <ArrowRight size={15} /></Link><span className="font-mono-ui text-[10px] uppercase tracking-[.1em] text-sidebar-foreground/45">{lesson.progress.progress}% complete</span></div></div></div>;
}

export function ProjectChip({ project }: { project: Project }) {
  return <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground"><FolderKanban size={17} /></span><div><p className="text-sm font-bold">{project.title}</p><p className="text-xs text-muted-foreground">{project.completedTaskCount} of {project.taskCount} tasks · {project.progress}%</p></div></div>;
}
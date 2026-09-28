import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="noise-layer grid min-h-[100dvh] w-full place-items-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card shadow-[0_18px_50px_hsl(var(--foreground)/.08)]">
        <CardContent className="pt-6">
          <div className="mb-4 flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Compass size={20} /></span>
            <div>
              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-primary">Off the map</p>
              <h1 className="font-display text-2xl font-bold tracking-[-.04em]">
                This page is not in the build.
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The route you followed does not exist in this workspace.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-not-found-home"><ArrowLeft size={14} /> Return home</Link>
        </CardContent>
      </Card>
    </div>
  );
}

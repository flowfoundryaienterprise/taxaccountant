import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export default function Home() {
  return (
    <Container className="flex flex-col gap-10 py-16">
      <section className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-action">
          Phase 1 &middot; Day 1 foundation
        </p>
        <h1 className="max-w-2xl text-hero font-semibold text-navy">
          Public marketplace foundation is wired up.
        </h1>
        <p className="max-w-2xl text-lead text-slate">
          This is a smoke-test page confirming the Next.js App Router shell, Tailwind design
          tokens and Cloudflare Workers build are working together. The directory, profiles and
          CMS screens are built in later Phase 1 days per IMPLEMENTATION_PLAN.md.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Design token smoke test">
        <div className="rounded-card border border-border bg-white p-5">
          <h2 className="text-compact font-semibold text-navy">Navy / Action</h2>
          <div className="mt-3 flex gap-2">
            <span className="h-8 w-8 rounded-input bg-navy" aria-hidden />
            <span className="h-8 w-8 rounded-input bg-action" aria-hidden />
          </div>
        </div>
        <div className="rounded-card border border-border bg-tint p-5">
          <h2 className="text-compact font-semibold text-navy">Pale tint surface</h2>
          <p className="mt-3 text-compact text-slate">Section background token.</p>
        </div>
        <div className="rounded-card border border-border bg-white p-5">
          <h2 className="text-compact font-semibold text-navy">Button primitive</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" size="sm">
              Primary
            </Button>
            <Button variant="outline" size="sm">
              Outline
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-white p-5" aria-label="Backend status">
        <h2 className="text-compact font-semibold text-navy">Convex backend</h2>
        <p className="mt-2 text-compact text-slate">
          {convexConfigured
            ? "NEXT_PUBLIC_CONVEX_URL is set. Live query wiring lands once a dev deployment is provisioned."
            : "Not yet connected: NEXT_PUBLIC_CONVEX_URL is not configured in this environment. convex/schema.ts and convex/healthCheck.ts are written and ready for `npx convex dev`."}
        </p>
      </section>
    </Container>
  );
}

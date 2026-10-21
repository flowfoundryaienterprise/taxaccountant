import Link from "next/link";

import { Container } from "@/components/layout/container";

/**
 * Minimal Phase 1 shell header. Primary navigation (Find an Accountant,
 * Services, Countries, etc. per DESIGN.md section 6) is added once those
 * routes exist later in Phase 1 delivery, so no dead links ship today.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-white">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-heading-sm font-semibold text-navy">
          TaxAccountant<span className="text-action">.com</span>
        </Link>
      </Container>
    </header>
  );
}

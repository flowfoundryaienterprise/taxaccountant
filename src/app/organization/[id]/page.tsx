import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { MemberList } from "@/components/organization/member-list";
import { isAuthenticated } from "@/lib/auth/server";
import type { Id } from "@/convex/_generated/dataModel";

export const metadata: Metadata = {
  title: "Organization",
  robots: { index: false, follow: true },
};

interface OrganizationPageProps {
  params: Promise<{ id: string }>;
}

/**
 * `/organization/[id]` — an organization's member roster and invite form
 * (Phase 2, P2-W2).
 *
 * Same server-side redirect-before-render gate as `/organization/new`
 * (see that page's comment) — any signed-in `appUsers` identity may load
 * this route. Whether *this particular* identity may see *this particular*
 * organization's roster is a separate, narrower check: `MemberList` reads
 * `currentOrganizations` first to confirm the viewer has a membership in
 * `id` at all, and `listOrgMembers` (`convex/organizations.ts`) is itself
 * `requireOrgMember`-gated, so a signed-in caller who isn't a member of
 * this org can reach this route but never its data.
 *
 * `id` arrives as a plain route-param string; it's cast to
 * `Id<"organizations">` for the Convex call rather than re-validated here,
 * the same trust boundary `requireOrgMember` itself draws — an invalid or
 * foreign id simply fails to match any of the viewer's own memberships.
 */
export default async function OrganizationPage({ params }: OrganizationPageProps) {
  if (!(await isAuthenticated())) {
    redirect("/sign-in?intent=organization");
  }

  const { id } = await params;

  return (
    <section className="relative overflow-hidden">
      <Container className="relative flex flex-col gap-10 py-20 sm:py-28">
        <MemberList organizationId={id as Id<"organizations">} />
      </Container>
    </section>
  );
}

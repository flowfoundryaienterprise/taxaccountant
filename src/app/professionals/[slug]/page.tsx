import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { LiveProfile } from "@/components/professionals/live-profile";
import { publicConvexClient } from "@/lib/convex/public-client";
import { professionalHref } from "@/lib/marketplace/query-params";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await publicConvexClient().query(api.professionals.publicProfile, { slug });
  if (!profile) return { title: "Profile not found", robots: { index: false, follow: true } };
  return {
    title: profile.displayName,
    description: profile.bio.slice(0, 160),
    alternates: { canonical: professionalHref(slug) },
    robots: { index: true, follow: true },
  };
}

export default async function ProfessionalProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const profile = await publicConvexClient().query(api.professionals.publicProfile, { slug });
  if (!profile) notFound();
  return <LiveProfile profile={profile} />;
}

import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfessionalCard } from "@/components/shared/professional-card";
import { buttonVariants } from "@/components/ui/button";
import { toCardModel } from "@/lib/directory/card-model";
import { professionalHref } from "@/lib/marketplace/query-params";
import type { DirectoryProfessional } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

interface ProfessionalPreviewProps {
  professionals: DirectoryProfessional[];
  directoryHref: string;
  directoryLabel: string;
  subject: string;
  limit?: number;
  total?: number;
}

/** Public cards come from the same approved listings as the directory. */
export function ProfessionalPreview({ professionals, directoryHref, directoryLabel, subject, limit = 3, total }: ProfessionalPreviewProps) {
  if (professionals.length === 0) {
    return <EmptyState icon={UsersRound} title={`No professionals are listed for ${subject} yet`}
      description="You can widen the search in the directory, or check back once more professionals are published."
      actions={[{ label: "Open the full directory", href: "/find-accountant" }, { label: "Browse all services", href: "/services", variant: "outline" }]} />;
  }
  const shown = professionals.slice(0, limit);
  const matched = total ?? professionals.length;
  return <div className="flex flex-col gap-5">
    <p className="text-caption text-slate">{matched} approved {matched === 1 ? "profile" : "profiles"} found. Check each credential’s displayed review status before contacting a professional.</p>
    <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map(professional => <li key={professional.slug} className="flex">
        <ProfessionalCard professional={toCardModel(professional)} profileHref={professionalHref(professional.slug)} saveable={false} className="h-full w-full" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" />
      </li>)}
    </ol>
    <Link href={directoryHref} className={cn(buttonVariants({ variant: "outline", size: "md" }), "group h-auto max-w-full whitespace-normal px-4 py-3 text-left sm:w-fit")}>
      {directoryLabel}<ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  </div>;
}

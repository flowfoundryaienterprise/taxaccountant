import { AdminTableSkeleton } from "@/components/admin/admin-skeleton";

/**
 * Applies to `/admin` and, by nesting, to every CMS screen — all of which
 * share the same heading / filter-bar / table shape, so one skeleton holds
 * the layout for all of them.
 */
export default function AdminLoading() {
  return <AdminTableSkeleton />;
}

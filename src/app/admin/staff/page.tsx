import type { Metadata } from "next";

import { AdminStaffClient } from "@/components/admin/admin-staff-client";

export const metadata: Metadata = {
  title: "Staff",
};

/**
 * Thin server wrapper only — `metadata` cannot be exported from a Client
 * Component, and `AdminStaffClient` has to be one for the live
 * `useQuery`/`useMutation` calls. Same shape as `/admin/messages/page.tsx`.
 */
export default function AdminStaffPage() {
  return <AdminStaffClient />;
}

import type { Metadata } from "next";

import { AdminMessagesClient } from "@/components/admin/admin-messages-client";

export const metadata: Metadata = {
  title: "Messages",
};

/**
 * Thin server wrapper only — `metadata` cannot be exported from a Client
 * Component, and `AdminMessagesClient` has to be one for the live
 * `usePaginatedQuery`/`useMutation` calls. Every other admin page title
 * comes the same way, through the layout's `"%s | TaxAccountant.com CMS"`
 * template; this file is what supplies the `%s` for this route.
 */
export default function AdminMessagesPage() {
  return <AdminMessagesClient />;
}

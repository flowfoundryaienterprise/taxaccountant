import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth/server";

/** The existing applications screen supplies the listing review workflow. */
export default async function ListingReviewPage() {
  const staff = await fetchAuthQuery(api.staff.currentStaff, {});
  redirect(staff?.role === "cms_admin" ? "/admin/applications" : "/admin/dashboard");
}

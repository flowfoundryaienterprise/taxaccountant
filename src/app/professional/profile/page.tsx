import { redirect } from "next/navigation";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OwnedProfiles } from "@/components/professional/owned-profile";
export const metadata={title:"My professional profile",robots:{index:false,follow:false}};
export default async function ProfilePage() {
 if(!(await isAuthenticated()))redirect("/login");
 const user=await fetchAuthQuery(api.users.currentUser,{});
 if(!user||user.accountStatus!=="active")redirect("/login?reason=inactive");
 if(user.role!=="professional")redirect("/customer/dashboard");
 return <DashboardShell eyebrow="Professional console" title="My Profile" accountLabel={user.displayName??"Your account"} variant="professional"><div className="space-y-6"><h1 className="text-3xl font-bold">My profile</h1><OwnedProfiles /></div></DashboardShell>;
}

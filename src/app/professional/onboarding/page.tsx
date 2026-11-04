import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProfileOnboarding } from "@/components/professional/profile-onboarding";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
export const metadata = {title:"Complete your professional profile",robots:{index:false,follow:false}};
export default async function ProfessionalOnboardingPage() {
 if (!(await isAuthenticated())) redirect("/login");
 const user=await fetchAuthQuery(api.users.currentUser,{});
 if(!user || user.accountStatus!=="active") redirect("/login?reason=inactive");
 if(user.role!=="professional") redirect("/customer/dashboard");
 return <section className="bg-tint py-10"><Container><h1 className="text-3xl font-bold">Build your professional profile</h1><p className="mt-3 mb-8 text-slate">Make your expertise easy to find.</p><div className="rounded-panel border border-border bg-white p-5 sm:p-8"><ProfileOnboarding /></div></Container></section>;
}

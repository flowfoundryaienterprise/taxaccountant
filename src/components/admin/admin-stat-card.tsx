import Link from "next/link";
import { UsersRound, ClipboardCheck, MessageSquare, Newspaper, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";
const icons = { profiles: UsersRound, applications: ClipboardCheck, enquiries: MessageSquare, articles: Newspaper, account: CircleUserRound };
interface AdminStatCardProps {
  label: string; value: number | string; caption: string; href?: string; className?: string; icon?: keyof typeof icons;
}
export function AdminStatCard({label, value, caption, href, className, icon = "account"}: AdminStatCardProps) {
  const Icon = icons[icon];
  const content = <><Icon className="h-10 w-10 shrink-0 text-action" strokeWidth={1.5} aria-hidden /><div className="min-w-0"><p className="text-compact font-semibold text-navy">{label}</p><p className={cn("break-words font-bold tracking-tight tabular-nums text-navy",typeof value==="string" && value.length>10 ? "text-xl" : "text-4xl")}>{value}</p><p className="mt-1 text-caption text-slate">{caption}</p></div></>;
  const classes = cn("flex items-center gap-4 rounded-card border border-border bg-white p-5 shadow-sm", href && "transition-colors hover:border-action", className);
  return href ? <Link href={href} className={classes}>{content}</Link> : <div className={classes}>{content}</div>;
}

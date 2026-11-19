import Link from "next/link";
import { cn } from "@/lib/utils";
interface AdminStatCardProps {
  label: string; value: number | string; caption: string; href?: string; className?: string; icon?: "profiles" | "applications" | "enquiries" | "articles" | "account";
}
export function AdminStatCard({label, value, caption, href, className}: AdminStatCardProps) {
  const content = <div className="min-w-0"><p className="text-compact text-slate">{label}</p><p className={cn("mt-3 break-words font-semibold tracking-[-0.04em] tabular-nums text-navy",typeof value==="string" && value.length>10 ? "text-xl" : "text-[2.25rem]")}>{value}</p><p className="mt-2 text-caption text-slate">{caption}</p></div>;
  const classes = cn("workspace-stat flex items-start rounded-card border border-border bg-white p-5", href && "transition-colors hover:border-control", className);
  return href ? <Link href={href} className={classes}>{content}</Link> : <div className={classes}>{content}</div>;
}

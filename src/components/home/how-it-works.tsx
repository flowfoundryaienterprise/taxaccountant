import { Search, UsersRound, ClipboardCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
const steps = [
  {icon: Search, title: "Explore your options", description: "Choose the service and expertise you need."},
  {icon: UsersRound, title: "Compare professionals", description: "Review profiles, specialties and locations."},
  {icon: ClipboardCheck, title: "Submit an enquiry", description: "Direct professional enquiries are coming soon."},
];
export function HowItWorks() {
  return <section id="how-it-works" className="py-12"><Container>
    <SectionHeading eyebrow="How it works" title="Your next expert, in three simple steps." />
    <ol className="reference-steps mt-8 grid gap-8 md:grid-cols-3">{steps.map(({icon: Icon, title, description}, index) =>
      <li key={title} className="relative flex items-start gap-4"><Icon className="h-12 w-12 shrink-0 text-action" strokeWidth={1.5} aria-hidden /><div><span className="text-4xl font-bold text-action/50" aria-hidden>0{index + 1}</span><h3 className="font-semibold"><span className="sr-only">Step {index + 1}: </span>{title}</h3><p className="mt-1 text-compact text-slate">{description}</p></div></li>
    )}</ol>
  </Container></section>;
}

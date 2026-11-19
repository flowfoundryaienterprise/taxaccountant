import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";

const steps = [
  { title: "Search with intent", description: "Filter by service, country, tax jurisdiction and language." },
  { title: "Read the profile", description: "Compare services, experience and consultation options." },
  { title: "Start a conversation", description: "Sign in and send an enquiry to an available professional." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="editorial-process">
      <Container>
        <div className="editorial-process-heading">
          <h2>From question to conversation.</h2>
          <p>A clear path from a complex tax need to a professional who works in that area.</p>
        </div>
        <ol className="editorial-process-list">
          {steps.map((step, i) => (
            <Reveal key={step.title} delayMs={i * 100}>
              <li>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <Link href="/how-it-works" className="editorial-process-link">How it works <ArrowUpRight size={18} aria-hidden /></Link>
      </Container>
    </section>
  );
}

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { statsBand } from "@/lib/home-content";

export function MarketplaceTrust() {
  return (
    <section className="border-y border-border bg-white">
      <Container className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-5">
        {statsBand.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Reveal key={stat.label} delayMs={index * 80}>
              <div className="group flex flex-col items-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint text-action transition-transform duration-200 group-hover:-translate-y-0.5">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-heading-sm font-semibold text-navy">{stat.value}</span>
                <span className="text-caption text-slate">{stat.label}</span>
              </div>
            </Reveal>
          );
        })}
      </Container>
    </section>
  );
}

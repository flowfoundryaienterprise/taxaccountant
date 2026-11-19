import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";

const capabilities = [
  { title: "Service", detail: "Find the type of support you need" },
  { title: "Jurisdiction", detail: "Search where your tax matters sit" },
  { title: "Language", detail: "Connect in a language you use" },
  { title: "Consultation", detail: "Choose remote or in-person options" },
];

export function MarketplaceTrust() {
  return (
    <section className="editorial-proof" aria-labelledby="proof-title">
      <Container>
        <div className="editorial-proof-heading">
          <h2 id="proof-title">A more precise way to search.</h2>
          <p>Accounting needs rarely fit one label. Start with the details that matter to you.</p>
        </div>
        <div className="editorial-proof-stagger">
          {capabilities.map((item, i) => (
            <Reveal key={item.title} delayMs={i * 100} className="editorial-proof-item">
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

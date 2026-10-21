import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-tint">
      <Container className="py-8 text-compact text-slate">
        <p>&copy; {new Date().getFullYear()} TaxAccountant.com. All rights reserved.</p>
      </Container>
    </footer>
  );
}

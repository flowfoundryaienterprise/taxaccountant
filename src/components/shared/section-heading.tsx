import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      {/*
        Sentence case, slate, normal tracking. This was 12px semibold
        uppercase with wide tracking in action blue — the single most
        repeated styling tell on the site (nine components used it). Small
        text does not get tracked out and shouted; it gets read. The eyebrow
        is context, so it takes the muted role and leaves the accent to
        things that are actually actionable.
      */}
      {eyebrow ? <p className="text-caption text-slate">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{title}</h2>
      {description ? <p className="text-lead text-slate">{description}</p> : null}
    </div>
  );
}

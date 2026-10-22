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
      {eyebrow ? (
        <p className="text-caption font-semibold uppercase tracking-wide text-action">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-heading-lg font-semibold text-navy">{title}</h2>
      {description ? <p className="text-lead text-slate">{description}</p> : null}
    </div>
  );
}

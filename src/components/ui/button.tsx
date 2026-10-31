import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  /*
   * `transition-colors`, not `transition-colors`: this base class is on every
   * button on the site, and `all` animates layout properties too — width,
   * height and margins stutter on weak devices (ARCHITECTURE.md
   * performance guidance). A button's hover is a colour change and its
   * press is a 2% scale, so those are the only two things named.
   */
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-input text-compact font-medium transition-colors duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-action text-white hover:bg-[#0668c7]",
        secondary: "bg-tint text-navy hover:bg-[#dcecff]",
        outline: "border border-control bg-white text-navy hover:bg-tint",
        ghost: "text-navy hover:bg-tint",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-6 text-body",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

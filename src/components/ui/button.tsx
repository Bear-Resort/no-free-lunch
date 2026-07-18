import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white hover:bg-accent/85 shadow-[0_4px_16px_rgba(59,130,246,0.25)]",
        secondary:
          "bg-surface text-ink border border-edge hover:border-accent/50 hover:bg-accent-soft/40",
        ghost: "text-ink-muted hover:text-ink hover:bg-surface",
        destructive:
          "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
        gold: "bg-gold text-[#fff7e0] hover:bg-gold/90",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Explicit pending state per design rules — spinner + disabled. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

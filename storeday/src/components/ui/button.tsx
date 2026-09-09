"use client";
import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover border border-transparent",
  secondary: "bg-surface text-text border border-border hover:bg-surface-2",
  ghost: "bg-transparent text-text-2 hover:bg-surface-2 hover:text-text border border-transparent",
  danger: "bg-danger text-white hover:opacity-90 border border-transparent",
  success: "bg-success text-white hover:opacity-90 border border-transparent",
};
const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12.5px] rounded-md gap-1.5",
  md: "h-8.5 px-3 text-[13.5px] rounded-md gap-2",
  lg: "h-10 px-4 text-[14px] rounded-md gap-2",
  xl: "h-13 px-6 text-[16px] font-semibold rounded-lg gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, ...props }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-55 disabled:cursor-not-allowed",
        variants[variant], sizes[size], block && "w-full", className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

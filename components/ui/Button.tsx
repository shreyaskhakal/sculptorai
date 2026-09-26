import React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "cyan";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090A0F]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-[#F5792A] to-[#E0681B] text-white hover:from-[#FA8538] hover:to-[#EB7225] shadow-sm hover:shadow-glow-orange focus:ring-[#F5792A]",
      secondary:
        "bg-[#151822] text-[#E2E6F0] hover:bg-[#1C212E] border border-[#272D3E] hover:border-[#384158] focus:ring-[#384158]",
      outline:
        "bg-transparent text-[#CCD2E3] hover:text-white border border-[#2D3447] hover:border-[#4B5675] hover:bg-[#141723] focus:ring-[#4B5675]",
      ghost:
        "bg-transparent text-[#9DA7C0] hover:text-white hover:bg-[#161924] focus:ring-[#2D3447]",
      danger:
        "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 focus:ring-red-500",
      cyan:
        "bg-gradient-to-r from-[#00D4E6] to-[#00B4D8] text-[#05070B] font-semibold hover:from-[#1AE2F2] hover:to-[#0EBFE0] shadow-sm hover:shadow-glow-cyan focus:ring-[#00D4E6]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

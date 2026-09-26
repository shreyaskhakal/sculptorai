import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "orange" | "cyan" | "emerald" | "amber" | "rose";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-[#181C27] text-[#9EA8C2] border-[#293042]",
    orange: "bg-[#F5792A]/15 text-[#F78D47] border-[#F5792A]/30",
    cyan: "bg-[#00E5FF]/15 text-[#33E8FF] border-[#00E5FF]/30",
    emerald: "bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30",
    amber: "bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30",
    rose: "bg-[#F43F5E]/15 text-[#FB7185] border-[#F43F5E]/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  topAccent?: boolean;
  padding?: string;
  id?: string;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  topAccent = false,
  padding = "p-6",
  id,
}: GlassCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "glass-card",
        hover && "glass-card-hover",
        topAccent && "top-accent-border",
        padding,
        className
      )}
    >
      {children}
    </div>
  );
}

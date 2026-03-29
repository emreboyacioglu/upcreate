import React from "react";
import { cn } from "@/lib/utils";

interface FrostedCardProps {
  children: React.ReactNode;
  className?: string;
  chipLabel?: string;
  chipVariant?: "blue" | "violet" | "lime";
  icon?: React.ReactNode;
  hoverLift?: boolean;
  accentTop?: "blue" | "violet" | "lime" | "gradient" | false;
}

const chipVariantMap = {
  blue: "chip-blue",
  violet: "chip-violet",
  lime: "chip-lime",
};

const accentTopMap = {
  blue: "border-t-[#3B82F6]",
  violet: "border-t-[#8B5CF6]",
  lime: "border-t-[#A3E635]",
  gradient: "",
};

export default function FrostedCard({
  children,
  className,
  chipLabel,
  chipVariant = "blue",
  icon,
  hoverLift = true,
  accentTop = false,
}: FrostedCardProps) {
  return (
    <div
      className={cn(
        "frosted rounded-2xl p-6 relative overflow-hidden",
        hoverLift && "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        accentTop && accentTop !== "gradient" && `border-t-2 ${accentTopMap[accentTop]}`,
        className
      )}
      style={
        accentTop === "gradient"
          ? { borderTop: "2px solid transparent", backgroundClip: "padding-box" }
          : undefined
      }
    >
      {/* Gradient accent top border via pseudo-like element */}
      {accentTop === "gradient" && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }}
        />
      )}

      {/* Icon chip */}
      {(icon || chipLabel) && (
        <div className="flex items-center gap-2 mb-4">
          {icon && (
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl text-base font-semibold shrink-0",
                chipVariantMap[chipVariant]
              )}
            >
              {icon}
            </div>
          )}
          {chipLabel && (
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                chipVariantMap[chipVariant]
              )}
            >
              {chipLabel}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

import React from "react";
import Link from "next/link";

interface UpcreateLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function UpcreateLogo({ className = "", size = "md" }: UpcreateLogoProps) {
  const sizeMap = {
    sm: { icon: 20, text: "text-lg" },
    md: { icon: 26, text: "text-xl" },
    lg: { icon: 36, text: "text-3xl" },
  };
  const { icon, text } = sizeMap[size];

  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:rotate-12"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="upcreate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path
          d="M19 3L7 18H15L13 29L25 14H17L19 3Z"
          fill="url(#upcreate-grad)"
          stroke="none"
        />
      </svg>

      <span
        className={`${text} font-bold tracking-tight bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent`}
      >
        Upcreate
      </span>
    </Link>
  );
}

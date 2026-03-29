"use client";

import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, viewport } from "@/lib/motionVariants";

interface Step {
  number: number;
  title: string;
  description?: string;
}

interface StepModuleProps {
  steps: Step[];
  accentColors?: Array<"blue" | "violet" | "lime">;
}

const colorMap = {
  blue: {
    num: "text-[#3B82F6]",
    connector: "bg-[#3B82F6]",
    ring: "border-[#3B82F6]/40",
  },
  violet: {
    num: "text-[#8B5CF6]",
    connector: "bg-[#8B5CF6]",
    ring: "border-[#8B5CF6]/40",
  },
  lime: {
    num: "text-[#65a30d]",
    connector: "bg-[#A3E635]",
    ring: "border-[#A3E635]/50",
  },
};

export default function StepModule({
  steps,
  accentColors = ["blue", "violet", "lime"],
}: StepModuleProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className="relative space-y-0"
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={shouldReduce ? {} : staggerContainer}
    >
      {steps.map((step, i) => {
        const color = accentColors[i % accentColors.length];
        const c = colorMap[color];
        const isLast = i === steps.length - 1;

        return (
          <motion.div
            key={step.number}
            className="relative flex gap-5"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Number + vertical connector */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  frosted flex items-center justify-center w-11 h-11 rounded-xl shrink-0
                  border-2 ${c.ring}
                `}
              >
                <span className={`text-lg font-bold tabular-nums ${c.num}`}>
                  {String(step.number).padStart(2, "0")}
                </span>
              </div>
              {!isLast && (
                <div className="step-connector-v w-px flex-1 min-h-[32px] mt-1 mb-1 opacity-30" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${isLast ? "" : ""}`}>
              <p className="text-lg font-semibold leading-tight">{step.title}</p>
              {step.description && (
                <p className="mt-1 text-sm text-foreground/65 leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

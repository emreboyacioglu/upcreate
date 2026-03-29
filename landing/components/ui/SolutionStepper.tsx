"use client";

import { motion, useReducedMotion } from "framer-motion";
import { sequentialItem, sequentialArrow, viewport } from "@/lib/motionVariants";

interface Step {
  label: string;
  index: number;
  color: "blue" | "violet" | "lime";
}

const colorMap = {
  blue: {
    num: "text-[#3B82F6]",
    border: "border-[#3B82F6]/30",
    bg: "bg-[#3B82F6]/8",
    chip: "chip-blue",
  },
  violet: {
    num: "text-[#8B5CF6]",
    border: "border-[#8B5CF6]/30",
    bg: "bg-[#8B5CF6]/8",
    chip: "chip-violet",
  },
  lime: {
    num: "text-[#65a30d]",
    border: "border-[#A3E635]/40",
    bg: "bg-[#A3E635]/8",
    chip: "chip-lime",
  },
};

interface SolutionStepperProps {
  steps: Step[];
}

export default function SolutionStepper({ steps }: SolutionStepperProps) {
  const shouldReduce = useReducedMotion();

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
      {steps.map((step, i) => {
        const c = colorMap[step.color];
        const num = String(i + 1).padStart(2, "0");

        return (
          <div
            key={step.label}
            className="flex flex-col md:flex-row items-center w-full md:w-auto"
          >
            <motion.div
              className={`
                frosted relative flex-1 min-w-[160px] rounded-2xl border ${c.border} p-6 md:p-8 text-center
              `}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={shouldReduce ? {} : sequentialItem(step.index)}
            >
              <span className={`text-3xl font-bold tabular-nums ${c.num}`}>{num}</span>
              <p className="mt-2 text-base font-semibold leading-snug">{step.label}</p>
            </motion.div>

            {i < steps.length - 1 && (
              <motion.div
                className="my-2 md:my-0 md:mx-3 flex items-center justify-center"
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={shouldReduce ? {} : sequentialArrow(step.index)}
                style={{ originX: 0 }}
              >
                <svg
                  className="h-6 w-6 rotate-90 md:rotate-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="url(#stepper-grad)"
                >
                  <defs>
                    <linearGradient id="stepper-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

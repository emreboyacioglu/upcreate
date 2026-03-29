"use client";

import { motion, useReducedMotion } from "framer-motion";
import SolutionStepper from "@/components/ui/SolutionStepper";
import { HOME_CONTENT } from "@/lib/constants";
import { fadeUp, viewport } from "@/lib/motionVariants";

const flowSteps = [
  { label: "Creator content", index: 0, color: "blue" as const },
  { label: "Customer purchase", index: 2, color: "violet" as const },
  { label: "Creator commission", index: 4, color: "lime" as const },
];

export default function SolutionSection() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.section
      className="relative py-20 md:py-32 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewport}
      transition={{ duration: 0.3 }}
    >
      {/* Ambient blob */}
      <div className="pointer-events-none absolute inset-0">
        <div className="blob-violet absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Pill label */}
        <motion.div
          className="flex justify-center mb-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={shouldReduce ? {} : fadeUp}
        >
          <span className="chip-blue text-xs font-semibold px-3 py-1.5 rounded-full">
            Çözüm
          </span>
        </motion.div>

        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={shouldReduce ? {} : fadeUp}
        >
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
            {HOME_CONTENT.solution.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-foreground/70">
            {HOME_CONTENT.solution.body}
          </p>
        </motion.div>

        <div className="mt-16 mx-auto max-w-4xl">
          <SolutionStepper steps={flowSteps} />
        </div>
      </div>
    </motion.section>
  );
}

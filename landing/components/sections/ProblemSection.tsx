"use client";

import { motion, useReducedMotion } from "framer-motion";
import FrostedCard from "@/components/ui/FrostedCard";
import { HOME_CONTENT } from "@/lib/constants";
import { fadeUp, staggerContainer, staggerChild, viewport } from "@/lib/motionVariants";

const cardConfig = [
  {
    icon: "⚡",
    chipVariant: "blue" as const,
    accentTop: "blue" as const,
  },
  {
    icon: "📊",
    chipVariant: "violet" as const,
    accentTop: "violet" as const,
  },
  {
    icon: "🔍",
    chipVariant: "lime" as const,
    accentTop: "lime" as const,
  },
];

export default function ProblemSection() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.section
      className="relative py-20 md:py-32 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewport}
      transition={{ duration: 0.3 }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="blob-blue-violet absolute top-0 left-0 w-full h-full opacity-70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section pill */}
        <motion.div
          className="flex justify-center mb-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={shouldReduce ? {} : fadeUp}
        >
          <span className="chip-violet text-xs font-semibold px-3 py-1.5 rounded-full">
            Problem
          </span>
        </motion.div>

        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={shouldReduce ? {} : fadeUp}
        >
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
            {HOME_CONTENT.problem.title}
          </h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            {HOME_CONTENT.problem.subtitle}
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={shouldReduce ? {} : staggerContainer}
        >
          {HOME_CONTENT.problem.cards.map((card, index) => (
            <motion.div key={index} variants={shouldReduce ? {} : staggerChild}>
              <FrostedCard
                icon={cardConfig[index].icon}
                chipVariant={cardConfig[index].chipVariant}
                accentTop={cardConfig[index].accentTop}
                hoverLift
              >
                <h3 className="text-lg font-semibold leading-snug">{card.title}</h3>
                <p className="mt-2 text-sm text-foreground/65 leading-relaxed">
                  {card.description}
                </p>
              </FrostedCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

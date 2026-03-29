"use client";

import { motion, useReducedMotion } from "framer-motion";
import FrostedCard from "@/components/ui/FrostedCard";
import { HOME_CONTENT } from "@/lib/constants";
import { fadeUp, slideLeft, slideRight, viewport } from "@/lib/motionVariants";

export default function PlatformSection() {
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
        <div className="blob-blue absolute top-0 left-1/4 w-1/2 h-full opacity-60" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={shouldReduce ? {} : fadeUp}
        >
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
            {HOME_CONTENT.platform.title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={shouldReduce ? {} : slideLeft}
          >
            <FrostedCard
              icon="🏷️"
              chipVariant="blue"
              accentTop="gradient"
              hoverLift
              className="h-full p-10"
            >
              <h3 className="text-2xl font-semibold mt-2">{HOME_CONTENT.platform.brands.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-foreground/70">
                {HOME_CONTENT.platform.brands.description}
              </p>
            </FrostedCard>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={shouldReduce ? {} : slideRight}
          >
            <FrostedCard
              icon="✨"
              chipVariant="violet"
              accentTop="gradient"
              hoverLift
              className="h-full p-10"
            >
              <h3 className="text-2xl font-semibold mt-2">{HOME_CONTENT.platform.creators.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-foreground/70">
                {HOME_CONTENT.platform.creators.description}
              </p>
            </FrostedCard>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

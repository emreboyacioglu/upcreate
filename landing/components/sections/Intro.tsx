"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HOME_CONTENT } from "@/lib/constants";
import { fadeBlur, fadeUp, viewport } from "@/lib/motionVariants";

export default function Intro() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.section
      className="relative py-20 md:py-32 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewport}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-semibold leading-tight"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={shouldReduce ? {} : fadeBlur}
          >
            {HOME_CONTENT.intro.title}
          </motion.h2>
          <motion.p
            className="mt-6 text-lg leading-relaxed text-foreground/70"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={shouldReduce ? {} : fadeUp}
            transition={{ delay: 0.15 }}
          >
            {HOME_CONTENT.intro.body}
          </motion.p>

          {/* Decorative accent line */}
          <motion.div
            className="mt-10 mx-auto h-[2px] w-20 rounded-full"
            style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={viewport}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </div>
      </div>
    </motion.section>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import Button from "@/components/ui/Button";
import { HOME_CONTENT } from "@/lib/constants";
import { fadeUpDramatic, viewport } from "@/lib/motionVariants";

export default function FinalStatement() {
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
      <div className="pointer-events-none absolute inset-0 blob-blue-violet opacity-60" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={shouldReduce ? {} : fadeUpDramatic}
        >
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
            {HOME_CONTENT.finalStatement.title}
          </h2>
          <div className="mt-8">
            <Button href="/brands" variant="primary" className="text-base px-8 py-4">
              {HOME_CONTENT.finalStatement.cta}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

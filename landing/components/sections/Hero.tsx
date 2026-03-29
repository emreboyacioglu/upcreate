"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import AnimatedContentGrid from "@/components/AnimatedContentGrid";
import { HOME_CONTENT } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="blob-blue-violet absolute inset-0 w-full h-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Eyebrow chip */}
            <motion.span
              className="chip-blue text-xs font-semibold px-3 py-1.5 rounded-full inline-block mb-6"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              Creator Commerce
            </motion.span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              {HOME_CONTENT.hero.title.line1}
              <br />
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                {HOME_CONTENT.hero.title.line2}
              </span>
            </h1>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button href="/brands" variant="primary">
                {HOME_CONTENT.hero.cta.brands}
              </Button>
              <Button href="/creators" variant="secondary">
                {HOME_CONTENT.hero.cta.creators}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <AnimatedContentGrid />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

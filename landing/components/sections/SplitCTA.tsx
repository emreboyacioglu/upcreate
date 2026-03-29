"use client";

import { motion, useReducedMotion } from "framer-motion";
import Button from "@/components/ui/Button";
import { HOME_CONTENT } from "@/lib/constants";
import { scaleUp, viewport } from "@/lib/motionVariants";

export default function SplitCTA() {
  const shouldReduce = useReducedMotion();
  const baseVariant = shouldReduce ? {} : scaleUp;

  return (
    <motion.section
      className="py-20 md:py-32"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewport}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brands panel — frosted light */}
          <motion.div
            className="frosted relative overflow-hidden rounded-3xl p-12 flex flex-col justify-between"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={baseVariant}
          >
            {/* Gradient top border */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
              style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6)" }}
            />
            <div>
              <span className="chip-blue text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-4">
                Brands
              </span>
              <h3 className="text-3xl font-semibold">{HOME_CONTENT.splitCta.brands.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-foreground/70">
                {HOME_CONTENT.splitCta.brands.description}
              </p>
            </div>
            <div className="mt-8">
              <Button href="/brands" variant="secondary">
                {HOME_CONTENT.splitCta.brands.cta}
              </Button>
            </div>
          </motion.div>

          {/* Creators panel — dark frosted */}
          <motion.div
            className="frosted-dark relative overflow-hidden rounded-3xl p-12 flex flex-col justify-between"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={shouldReduce ? {} : {
              ...scaleUp,
              visible: {
                ...scaleUp.visible,
                transition: { ...(scaleUp.visible as { transition?: object }).transition, delay: 0.15 },
              },
            }}
          >
            {/* Gradient top border */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
              style={{ background: "linear-gradient(90deg, #8B5CF6, #A3E635)" }}
            />
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-4"
                style={{ background: "rgba(163,230,53,0.15)", color: "#A3E635", border: "1px solid rgba(163,230,53,0.3)" }}>
                Creators
              </span>
              <h3 className="text-3xl font-semibold text-white">{HOME_CONTENT.splitCta.creators.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-white/70">
                {HOME_CONTENT.splitCta.creators.description}
              </p>
            </div>
            <div className="mt-8">
              <Button href="/creators" variant="secondary" className="text-white hover:text-[#A3E635]">
                {HOME_CONTENT.splitCta.creators.cta}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

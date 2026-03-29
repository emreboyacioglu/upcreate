"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  title: string;
  description: string;
  number?: number;
  children?: ReactNode;
}

export default function Card({ title, description, number }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
    >
      {number && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
          {number}
        </div>
      )}
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-foreground/70">{description}</p>
    </motion.div>
  );
}

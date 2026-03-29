"use client";

import { motion } from "framer-motion";

const contentTiles = [
  {
    id: 1,
    gradient: "from-[#3B82F6] to-[#8B5CF6]",
    label: "Revenue",
    value: "+127%",
    icon: "📈",
  },
  {
    id: 2,
    gradient: "from-[#8B5CF6] to-[#A3E635]",
    label: "Creator",
    value: "@upcreate",
    icon: "✨",
  },
  {
    id: 3,
    gradient: "from-[#A3E635] to-[#3B82F6]",
    label: "Sales",
    value: "243 orders",
    icon: "🛍️",
  },
  {
    id: 4,
    gradient: "from-[#3B82F6] to-[#06b6d4]",
    label: "Commission",
    value: "₺4,200",
    icon: "💰",
  },
  {
    id: 5,
    gradient: "from-[#8B5CF6] to-[#ec4899]",
    label: "Campaign",
    value: "Active",
    icon: "⚡",
  },
  {
    id: 6,
    gradient: "from-[#A3E635] to-[#84cc16]",
    label: "Reach",
    value: "18.4K",
    icon: "🔍",
  },
  {
    id: 7,
    gradient: "from-[#06b6d4] to-[#3B82F6]",
    label: "Clicks",
    value: "3,721",
    icon: "🖱️",
  },
  {
    id: 8,
    gradient: "from-[#ec4899] to-[#8B5CF6]",
    label: "ROAS",
    value: "4.2x",
    icon: "🎯",
  },
  {
    id: 9,
    gradient: "from-[#84cc16] to-[#A3E635]",
    label: "Brands",
    value: "12 live",
    icon: "🏷️",
  },
  {
    id: 10,
    gradient: "from-[#3B82F6] to-[#8B5CF6]",
    label: "Conversion",
    value: "6.8%",
    icon: "📊",
  },
  {
    id: 11,
    gradient: "from-[#8B5CF6] to-[#3B82F6]",
    label: "Growth",
    value: "+38%",
    icon: "🚀",
  },
  {
    id: 12,
    gradient: "from-[#A3E635] to-[#3B82F6]",
    label: "Payout",
    value: "₺12,540",
    icon: "💳",
  },
];

export default function AnimatedContentGrid() {
  const duplicatedTiles = [...contentTiles, ...contentTiles];
  const colTiles = [
    duplicatedTiles.slice(0, 8),
    duplicatedTiles.slice(4, 12),
    duplicatedTiles.slice(8, 16),
  ];

  return (
    <div className="relative h-[600px] overflow-hidden rounded-3xl">
      <div className="grid grid-cols-3 gap-3 h-full">
        {[0, 1, 2].map((col) => (
          <motion.div
            key={col}
            className="flex flex-col gap-3"
            animate={{ y: [0, -960] }}
            transition={{
              duration: 28 + col * 6,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {colTiles[col].map((tile, idx) => (
              <div
                key={`${tile.id}-${idx}`}
                className={`relative h-44 shrink-0 rounded-2xl bg-gradient-to-br ${tile.gradient} shadow-lg overflow-hidden`}
              >
                {/* Frosted overlay with mock UI snippet */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.30)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{tile.icon}</span>
                      <span className="text-xs font-medium text-white/80">{tile.label}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{tile.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Top + bottom fade */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );
}

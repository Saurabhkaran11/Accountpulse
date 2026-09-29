"use client";
/**
 * Motion graphics that give AccountPulse its identity:
 *  - AmbientBackground: slow-drifting colour glows behind the glass panels.
 *  - PulseLine: the heartbeat line used in the logo and overview hero.
 * Both respect "reduce motion" through the MotionConfig in Providers.
 */
import { motion } from "framer-motion";

export function AmbientBackground() {
  const blobs = [
    { color: "var(--color-lilac)", size: 520, x: ["-10%", "8%", "-10%"], y: ["-8%", "6%", "-8%"], top: "-10%", left: "-5%" },
    { color: "var(--color-sky)", size: 460, x: ["0%", "-12%", "0%"], y: ["0%", "10%", "0%"], top: "30%", left: "60%" },
    { color: "var(--color-peach)", size: 380, x: ["0%", "10%", "0%"], y: ["0%", "-12%", "0%"], top: "65%", left: "15%" },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-60 blur-3xl"
          style={{ background: b.color, width: b.size, height: b.size, top: b.top, left: b.left }}
          animate={{ x: b.x, y: b.y }}
          transition={{ duration: 22 + i * 6, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* Fine grain so the glass has something to blur */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(28,35,64,0.05)_1px,transparent_1px)] [background-size:22px_22px]" />
    </div>
  );
}

/**
 * Heartbeat line. `beat` makes it redraw on a loop (used in the hero);
 * without it, it draws once (used in the logo).
 */
export function PulseLine({
  width = 120,
  height = 32,
  color = "var(--color-pulse)",
  beat = false,
  strokeWidth = 2.5,
}: {
  width?: number;
  height?: number;
  color?: string;
  beat?: boolean;
  strokeWidth?: number;
}) {
  const h = height;
  const w = width;
  const d = `M0,${h * 0.6} L${w * 0.28},${h * 0.6} L${w * 0.36},${h * 0.15} L${w * 0.46},${h * 0.95} L${w * 0.55},${h * 0.35} L${w * 0.62},${h * 0.6} L${w},${h * 0.6}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="overflow-visible">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={
          beat
            ? { duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }
            : { duration: 1.2, ease: "easeInOut" }
        }
      />
    </svg>
  );
}

/** Logo mark: clay tile with the pulse line inside. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span className="clay-primary grid shrink-0 place-items-center rounded-xl" style={{ width: size, height: size }}>
      <PulseLine width={size * 0.62} height={size * 0.42} color="#ffffff" strokeWidth={2.2} />
    </span>
  );
}

"use client";
/**
 * Shared UI building blocks.
 * Glass = containers that hold information.
 * Clay  = controls you press or toggle.
 */
import { animate, motion, useInView, useMotionValue, useTransform, type Variants } from "framer-motion";
import clsx from "clsx";
import { Sparkles, ShieldCheck, ShieldAlert } from "lucide-react";
import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { riskLevel, type SignalSource } from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Containers                                                          */
/* ------------------------------------------------------------------ */

export function GlassPanel({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return <Tag className={clsx("glass rounded-[22px] p-5", className)}>{children}</Tag>;
}

/** Page title block used at the top of every dashboard page. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Clay controls                                                       */
/* ------------------------------------------------------------------ */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "clay" | "primary";
  icon?: ReactNode;
};

export function ClayButton({ variant = "clay", icon, className, children, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={clsx(
        "focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold",
        variant === "primary" ? "clay-primary" : "clay text-ink",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/** Square clay button for icons. Always pass an aria-label. */
export function ClayIconButton({
  label,
  children,
  className,
  active,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      title={label}
      className={clsx(
        "focus-ring grid size-10 shrink-0 place-items-center rounded-2xl text-ink",
        active ? "clay-pressed bg-[#eef1f8] text-pulse" : "clay",
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
}

/** Clay on/off switch with a springy knob. */
export function ClayToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "focus-ring relative h-8 w-14 shrink-0 rounded-full transition-colors",
        checked ? "bg-pulse/90 shadow-[inset_3px_3px_6px_rgba(20,20,120,0.35)]" : "clay-inset",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
        className={clsx("clay absolute top-1 size-6 rounded-full", checked ? "right-1" : "left-1")}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Risk + evidence                                                     */
/* ------------------------------------------------------------------ */

const riskStyles = {
  high: { text: "text-coral", bg: "bg-coral/12", stroke: "#e5485a", label: "High risk" },
  medium: { text: "text-amber", bg: "bg-amber/14", stroke: "#d98a1c", label: "Watch" },
  low: { text: "text-mint", bg: "bg-mint/12", stroke: "#1a9e70", label: "Healthy" },
} as const;

export function RiskBadge({ score }: { score: number }) {
  const s = riskStyles[riskLevel(score)];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", s.bg, s.text)}>
      <span className="size-1.5 rounded-full bg-current" />
      {score} · {s.label}
    </span>
  );
}

/** Animated circular gauge for a 0-100 risk score. */
export function RiskRing({ score, size = 88 }: { score: number; size?: number }) {
  const s = riskStyles[riskLevel(score)];
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(155,165,200,0.25)" strokeWidth={8} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={s.stroke}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={clsx("font-display text-xl font-bold", s.text)}>
          <AnimatedNumber value={score} />
        </span>
      </div>
    </div>
  );
}

/** Shows which data source produced a piece of evidence. */
export function SourceChip({ source }: { source: SignalSource }) {
  return (
    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate ring-1 ring-white">
      {source}
    </span>
  );
}

/** Tells the user whether the second AI model agreed with the verdict. */
export function CriticBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint">
      <ShieldCheck className="size-3.5" aria-hidden /> Double-checked by a second AI
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber">
      <ShieldAlert className="size-3.5" aria-hidden /> Low confidence, review before acting
    </span>
  );
}

export function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-pulse-soft px-2 py-0.5 text-[11px] font-bold text-pulse">
      <Sparkles className="size-3" aria-hidden /> AI
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Motion helpers                                                      */
/* ------------------------------------------------------------------ */

/** Counts up to a number the first time it scrolls into view. */
export function AnimatedNumber({
  value,
  format = (n: number) => Math.round(n).toString(),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, value, mv]);

  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Tiny line chart of the last 8 weeks. Draws itself on mount. */
export function Sparkline({ data, width = 110, height = 34 }: { data: number[]; width?: number; height?: number }) {
  const max = 100;
  const step = width / (data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`).join(" ");
  const last = data[data.length - 1];
  const s = riskStyles[riskLevel(last)];
  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <motion.path
        d={d}
        fill="none"
        stroke={s.stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}

/** Staggered list: children fade up one after another, once. */
export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

/** Shows where the numbers on a page come from: live sponsors, backend sample mode, or demo data. */
export function DataBadge({
  source,
  scannedAt,
  loading,
}: {
  source: "live" | "mock" | "demo";
  scannedAt?: string | null;
  loading?: boolean;
}) {
  if (loading)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-slate ring-1 ring-white">
        <span className="size-2 animate-pulse rounded-full bg-amber" /> Loading live scan
      </span>
    );
  const time = scannedAt ? new Date(scannedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
  const label =
    source === "live" ? `Live${time ? ` · scanned ${time}` : ""}` : source === "mock" ? "Backend sample mode" : "Demo data";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-white",
        source === "live" ? "bg-mint/12 text-mint" : "bg-white/70 text-slate",
      )}
    >
      <span className={clsx("size-2 rounded-full", source === "live" ? "animate-pulse bg-mint" : "bg-slate/40")} />
      {label}
    </span>
  );
}

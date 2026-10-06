import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

// Usage: <KpiCard label="Churn rate" value={26.5} suffix="%" decimals={1} />
export default function KpiCard({ label, value, prefix = "", suffix = "", decimals = 0, hint }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => `${prefix}${v.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`);

  useEffect(() => {
    if (reduce) { mv.set(value); return; }
    const controls = animate(mv, value, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <motion.p className="mt-1 text-3xl font-semibold tabular-nums text-neutral-50">{text}</motion.p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

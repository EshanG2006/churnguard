import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

// probability: 0..1 from your FastAPI /predict response
// Usage: <ChurnGauge probability={result.churn_probability} />
const R = 80;
const ARC = Math.PI * R; // length of the semicircle

function riskColor(p) {
  if (p < 0.33) return "#22c55e"; // low
  if (p < 0.66) return "#f59e0b"; // medium
  return "#ef4444";               // high
}

export default function ChurnGauge({ probability = 0 }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? probability : 0);

  // Smoothly tween whenever a slider changes the prediction
  useEffect(() => {
    if (reduce) { mv.set(probability); return; }
    const c = animate(mv, probability, { type: "spring", stiffness: 90, damping: 18 });
    return () => c.stop();
  }, [probability, reduce, mv]);

  const dashOffset = useTransform(mv, (v) => ARC * (1 - Math.min(Math.max(v, 0), 1)));
  const pct = useTransform(mv, (v) => `${Math.round(v * 100)}%`);
  const stroke = useTransform(mv, riskColor);
  const label = probability < 0.33 ? "Low risk" : probability < 0.66 ? "Medium risk" : "High risk";

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Churn probability ${Math.round(probability * 100)} percent, ${label}`}>
      <svg viewBox="0 0 200 110" className="w-64">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="currentColor"
              className="text-white/10" strokeWidth="14" strokeLinecap="round" />
        <motion.path d="M20 100 A80 80 0 0 1 180 100" fill="none" strokeWidth="14" strokeLinecap="round"
              style={{ stroke, strokeDasharray: ARC, strokeDashoffset: dashOffset }} />
      </svg>
      <motion.span className="-mt-14 text-4xl font-semibold tabular-nums text-neutral-50">{pct}</motion.span>
      <span className="mt-2 text-sm text-neutral-400">{label}</span>
    </div>
  );
}

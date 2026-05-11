import { cn } from "@/lib/utils";

const map: Record<string, { label: string; cls: string }> = {
  low: { label: "Low risk", cls: "bg-success/15 text-success border-success/30" },
  medium: { label: "Medium risk", cls: "bg-warning/15 text-warning border-warning/30" },
  high: { label: "High risk", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  critical: { label: "Critical risk", cls: "bg-destructive/25 text-destructive border-destructive/40" },
};

export function RiskBadge({ level }: { level: string }) {
  const m = map[level] ?? map.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        m.cls
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

type Variant = "danger" | "success" | "mock" | "neutral" | "dark";

export function StatusBadge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: Variant }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

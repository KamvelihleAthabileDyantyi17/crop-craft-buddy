import type { ReactNode, ButtonHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-surface p-5 ${className}`}>{children}</div>;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const base =
    "tap-target inline-flex items-center justify-center gap-2 px-5 rounded-[10px] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-primary text-[color:var(--color-primary-foreground)] hover:brightness-110"
      : variant === "secondary"
        ? "bg-[color:var(--surface-alt)] text-foreground border border-border hover:bg-surface"
        : variant === "danger"
          ? "bg-[color:var(--rust)] text-foreground hover:brightness-110"
          : "text-[color:var(--soft)] hover:text-foreground hover:bg-surface";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full min-h-32 rounded-[10px] bg-[color:var(--surface-alt)] border border-border px-4 py-3 text-base text-foreground placeholder:text-[color:var(--faint)] focus:outline-none focus:ring-2 focus:ring-primary/60 ${props.className ?? ""}`}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full tap-target rounded-[10px] bg-[color:var(--surface-alt)] border border-border px-4 text-base text-foreground placeholder:text-[color:var(--faint)] focus:outline-none focus:ring-2 focus:ring-primary/60 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full tap-target rounded-[10px] bg-[color:var(--surface-alt)] border border-border px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 ${props.className ?? ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[color:var(--soft)] mb-2">
      {children}
    </label>
  );
}

export function PriorityPill({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Urgent: "bg-[color:var(--rust)]/20 text-[color:var(--rust)] border border-[color:var(--rust)]/40",
    High: "bg-[color:var(--amber)]/20 text-[color:var(--amber)] border border-[color:var(--amber)]/40",
    Medium: "bg-[color:var(--primary)]/20 text-[color:var(--primary)] border border-[color:var(--primary)]/40",
    Low: "bg-[color:var(--faint)]/20 text-[color:var(--soft)] border border-border",
  };
  return <span className={`pill ${map[priority] ?? map.Low}`}>{priority}</span>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? (
    <div className="mt-3 text-sm text-[color:var(--rust)]">{children}</div>
  ) : null;
}

export function Loader({ label = "Working…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[color:var(--soft)]">
      <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      {label}
    </div>
  );
}

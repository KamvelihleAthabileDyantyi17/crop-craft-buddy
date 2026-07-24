import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  MessageCircle,
  CalendarCheck,
  BookOpen,
  ClipboardList,
  Mail,
  Menu,
  X,
  Leaf,
  MapPin,
  PackageOpen,
  Sun,
  Moon,
} from "lucide-react";
import { PROVINCES, useProvince } from "@/hooks/use-province";
import { useTheme } from "@/hooks/use-theme";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chatbot", label: "AI Chatbot", icon: MessageCircle },
  { to: "/planner", label: "Task Planner", icon: CalendarCheck },
  { to: "/research", label: "Research", icon: BookOpen },
  { to: "/meetings", label: "Meeting Notes", icon: ClipboardList },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/stock", label: "Stock Tracker", icon: PackageOpen },
] as const;

function ProvincePicker({ compact = false }: { compact?: boolean }) {
  const { province, setProvince } = useProvince();
  const [pulse, setPulse] = useState(false);
  return (
    <label
      className={`flex items-center gap-2 rounded-[10px] border accent-select px-3 ${compact ? "h-10" : "h-11"} text-sm transition-all ${pulse ? "scale-[1.02]" : ""}`}
    >
      <MapPin className="w-4 h-4 text-primary" />
      <span className="text-[color:var(--soft)] hidden sm:inline">Location</span>
      <select
        value={province}
        onChange={(e) => {
          setProvince(e.target.value);
          setPulse(true);
          setTimeout(() => setPulse(false), 220);
        }}
        className="bg-transparent focus:outline-none text-foreground pr-1"
      >
        {PROVINCES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </label>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="tap-target min-w-11 h-11 px-3 flex items-center justify-center gap-2 rounded-[10px] border border-border bg-[color:var(--surface-alt)] text-[color:var(--soft)] hover:text-foreground hover:bg-surface text-sm"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}

export function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-[color:var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="font-semibold">Agri-Assist</span>
        </div>
        <div className="flex items-center gap-2">
          <ProvincePicker compact />
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="tap-target min-w-12 flex items-center justify-center rounded-md hover:bg-surface"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`${open ? "block" : "hidden"} md:block md:w-64 md:min-h-screen bg-[color:var(--sidebar-bg)] border-r border-border md:sticky md:top-0`}
      >
        <div className="hidden md:flex items-center gap-2 px-5 h-16 border-b border-border">
          <Leaf className="w-6 h-6 text-primary" />
          <div>
            <div className="font-semibold text-base leading-tight">Agri-Assist</div>
            <div className="text-xs text-[color:var(--soft)]">Workspace</div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`tap-target flex items-center gap-3 px-4 rounded-md text-sm font-medium duration-200 ease-out ${
                  active
                    ? "accent-select text-foreground"
                    : "text-[color:var(--soft)] hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden md:flex items-center justify-between px-8 pt-6 gap-3">
          <div />
          <div className="flex items-center gap-2">
            <ProvincePicker />
            <ThemeToggle />
          </div>
        </div>
        <main className="flex-1 px-4 md:px-8 py-6 md:py-6 max-w-5xl w-full mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold mb-6">{title}</h1>
          {children}
        </main>
        <footer className="border-t border-border px-4 md:px-8 py-4 text-xs md:text-sm text-[color:var(--faint)] text-center">
          Responsible AI: verify AI advice with an agricultural expert before acting on it.
        </footer>
      </div>
    </div>
  );
}

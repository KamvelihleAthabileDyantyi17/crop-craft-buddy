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
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chatbot", label: "AI Chatbot", icon: MessageCircle },
  { to: "/planner", label: "Task Planner", icon: CalendarCheck },
  { to: "/research", label: "Research", icon: BookOpen },
  { to: "/meetings", label: "Meeting Notes", icon: ClipboardList },
  { to: "/email", label: "Email Generator", icon: Mail },
] as const;

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
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="tap-target min-w-12 flex items-center justify-center rounded-md hover:bg-surface"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
                className={`tap-target flex items-center gap-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-[color:var(--deep-green)] text-foreground"
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
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-5xl w-full mx-auto">
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

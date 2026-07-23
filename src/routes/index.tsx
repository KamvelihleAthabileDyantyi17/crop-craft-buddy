import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { MessageCircle, CalendarCheck, BookOpen, ClipboardList, Mail, PackageOpen, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Agri-Assist Workspace" },
      { name: "description", content: "Your farm AI workspace: chat, plan tasks, read research, summarize meetings, draft emails, and track stock." },
      { property: "og:title", content: "Dashboard | Agri-Assist Workspace" },
      { property: "og:description", content: "Your farm AI workspace: chat, plan tasks, read research, summarize meetings, draft emails, and track stock." },
    ],
  }),
  component: Dashboard,
});

const FEATURES = [
  { to: "/chatbot", icon: MessageCircle, title: "AI chatbot", desc: "Ask about crop health, pests, weather prep.", accent: "accent-bar-green" },
  { to: "/planner", icon: CalendarCheck, title: "Task planner", desc: "Turn pending tasks into a weekly schedule.", accent: "accent-bar-amber" },
  { to: "/research", icon: BookOpen, title: "Research assistant", desc: "Look up crop science and market trends.", accent: "accent-bar-blue" },
  { to: "/meetings", icon: ClipboardList, title: "Meeting notes", desc: "Capture and summarize field team check-ins.", accent: "accent-bar-rust" },
  { to: "/email", icon: Mail, title: "Email generator", desc: "Draft emails with the right tone in seconds.", accent: "accent-bar-deep" },
  { to: "/stock", icon: PackageOpen, title: "Stock tracker", desc: "Animals & grain — sold vs bought, monthly.", accent: "accent-bar-amber" },
] as const;

function Dashboard() {
  return (
    <AppLayout title="Welcome back">
      <div className="hero-dots mb-6">
        <div className="hero-dots-inner" />
        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">Welcome back</h2>
          <p className="text-[color:var(--soft)] max-w-xl">
            Six helpers ready for your day on the farm. Pick where to start — everything speaks Rand (R) and your chosen province.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map(({ to, icon: Icon, title, desc, accent }) => (
          <Link key={to} to={to} className="block group">
            <div className={`accent-card ${accent} h-full hover:-translate-y-[1px] hover:border-[color:var(--primary)]/50`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[color:var(--surface-alt)] border border-border flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {title}
                    <ArrowRight className="w-4 h-4 text-[color:var(--faint)] group-hover:text-primary transition-colors" />
                  </h3>
                  <p className="text-sm text-[color:var(--soft)] mt-1">{desc}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}

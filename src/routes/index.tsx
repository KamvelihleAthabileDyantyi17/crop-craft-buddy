import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { MessageCircle, CalendarCheck, BookOpen, ClipboardList, Mail, PackageOpen } from "lucide-react";

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

type Accent = "green" | "amber" | "blue" | "rust";

const ACCENT_HEX: Record<Accent, string> = {
  green: "#8AA96F",
  amber: "#D9A24B",
  blue: "#5AA8C7",
  rust: "#D97757",
};

const FEATURES: { to: string; icon: typeof MessageCircle; title: string; desc: string; accent: Accent }[] = [
  { to: "/chatbot", icon: MessageCircle, title: "AI chatbot", desc: "Ask about crop health, pests, and weather prep.", accent: "green" },
  { to: "/planner", icon: CalendarCheck, title: "Task planner", desc: "Turn pending tasks into a weekly schedule.", accent: "amber" },
  { to: "/research", icon: BookOpen, title: "Research assistant", desc: "Summarize reports and pricing bulletins.", accent: "blue" },
  { to: "/meetings", icon: ClipboardList, title: "Meeting notes", desc: "Capture and summarize field team check-ins.", accent: "rust" },
  { to: "/email", icon: Mail, title: "Email generator", desc: "Draft emails with the right tone in seconds.", accent: "green" },
  { to: "/stock", icon: PackageOpen, title: "Stock tracker", desc: "Animals and grain — sold vs bought, monthly.", accent: "amber" },
];

function Dashboard() {
  return (
    <AppLayout title="Welcome back">
      <div className="hero-dots mb-6">
        <div className="hero-crop-rows" />
        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-medium mb-2">Welcome back</h2>
          <p className="text-[color:var(--soft)] max-w-xl text-sm md:text-[15px]">
            Six helpers ready for your day on the farm. Pick where to start — everything speaks Rand (R) and your chosen province.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map(({ to, icon: Icon, title, desc, accent }) => {
          const color = ACCENT_HEX[accent];
          return (
            <Link key={to} to={to} className="block group">
              <div
                className="flat-card h-full hover:bg-[color:var(--surface-alt)]"
                style={{ borderLeftColor: color }}
              >
                <Icon
                  className="w-5 h-5 mb-3"
                  strokeWidth={1.5}
                  style={{ color }}
                />
                <h3 className="text-[15px] font-medium">{title}</h3>
                <p className="text-[13px] text-[color:var(--soft)] mt-1 leading-snug">{desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </AppLayout>
  );
}

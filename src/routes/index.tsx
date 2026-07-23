import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui-bits";
import { MessageCircle, CalendarCheck, BookOpen, ClipboardList, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Agri-Assist Workspace" },
      {
        name: "description",
        content: "Your farm AI workspace: chat, plan tasks, read research, summarize meetings, and draft emails.",
      },
      { property: "og:title", content: "Dashboard | Agri-Assist Workspace" },
      {
        property: "og:description",
        content: "Your farm AI workspace: chat, plan tasks, read research, summarize meetings, and draft emails.",
      },
    ],
  }),
  component: Dashboard,
});

const FEATURES = [
  { to: "/chatbot", icon: MessageCircle, title: "AI Chatbot", desc: "Ask about crop health, pests, weather prep." },
  { to: "/planner", icon: CalendarCheck, title: "Task Planner", desc: "Turn pending tasks into a weekly schedule." },
  { to: "/research", icon: BookOpen, title: "Research Assistant", desc: "Summarize reports, bulletins, pricing sheets." },
  { to: "/meetings", icon: ClipboardList, title: "Meeting Notes", desc: "Extract action items and decisions." },
  { to: "/email", icon: Mail, title: "Email Generator", desc: "Draft emails with the right tone in seconds." },
] as const;

function Dashboard() {
  return (
    <AppLayout title="Welcome back">
      <p className="text-[color:var(--soft)] mb-6 text-base md:text-lg">
        Five AI helpers ready for your day on the farm. Pick where to start.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="block group">
            <Card className="h-full hover:border-primary transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-[color:var(--deep-green)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {title}
                    <ArrowRight className="w-4 h-4 text-[color:var(--faint)] group-hover:text-primary transition-colors" />
                  </h3>
                  <p className="text-sm text-[color:var(--soft)] mt-1">{desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <h3 className="text-base font-semibold mb-2">Tip for today</h3>
        <p className="text-sm text-[color:var(--soft)]">
          Use plain language when you ask the AI a question — describe your field, crop, and what's going wrong.
          You'll get a more useful answer. All prices are in Rand (R).
        </p>
      </Card>
    </AppLayout>
  );
}

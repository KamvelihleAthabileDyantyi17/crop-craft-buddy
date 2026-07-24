import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Card, Button, Input, Select, Label, ErrorText } from "@/components/ui-bits";
import { addStockEntry, deleteStockEntry, listStockEntries } from "@/lib/stock.functions";
import { Plus, Trash2, PackageOpen, Beef, Wheat, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock Tracker | Agri-Assist" },
      { name: "description", content: "Track animals and grain — sold vs bought — with monthly totals in Rand." },
      { property: "og:title", content: "Stock Tracker | Agri-Assist" },
      { property: "og:description", content: "Track animals and grain — sold vs bought — with monthly totals in Rand." },
    ],
  }),
  component: StockPage,
});

type Entry = {
  id: string;
  category: "animals" | "grain";
  item_name: string;
  action: "bought" | "sold";
  quantity: number;
  unit_price_rands: number;
  entry_month: string;
  notes: string | null;
  created_at: string;
};

const rand = (n: number) =>
  "R" + Math.round(n).toLocaleString("en-ZA");

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function StockPage() {
  const add = useServerFn(addStockEntry);
  const remove = useServerFn(deleteStockEntry);

  const [category, setCategory] = useState<"animals" | "grain">("animals");
  const [itemName, setItemName] = useState("");
  const [action, setAction] = useState<"bought" | "sold">("sold");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("0");
  const [month, setMonth] = useState(thisMonth());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tab, setTab] = useState<"animals" | "grain">("animals");
  const [err, setErr] = useState("");

  const list = useServerFn(listStockEntries);
  const refresh = async () => {
    const data = await list();
    setEntries((data as Entry[]) ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const onAdd = async () => {
    setErr("");
    if (!itemName.trim()) { setErr("Add an item name."); return; }
    try {
      await add({
        data: {
          category,
          item_name: itemName.trim(),
          action,
          quantity: Number(quantity) || 0,
          unit_price_rands: Number(price) || 0,
          entry_month: month,
          notes: "",
        },
      });
      setItemName("");
      setQuantity("1");
      setPrice("0");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save that entry.");
    }
  };

  const onRemove = async (id: string) => {
    await remove({ data: { id } });
    setEntries((e) => e.filter((x) => x.id !== id));
  };

  const filtered = entries.filter((e) => e.category === tab);

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; bought: number; sold: number }>();
    for (const e of filtered) {
      const key = e.entry_month;
      const row = map.get(key) ?? { month: key, bought: 0, sold: 0 };
      const total = e.quantity * e.unit_price_rands;
      if (e.action === "bought") row.bought += total; else row.sold += total;
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [filtered]);

  const totals = monthly.reduce((acc, m) => ({ bought: acc.bought + m.bought, sold: acc.sold + m.sold }), { bought: 0, sold: 0 });
  const maxVal = Math.max(1, ...monthly.flatMap((m) => [m.bought, m.sold]));

  return (
    <AppLayout title="Stock Tracker">
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="accent-card accent-bar-rust">
          <div className="flex items-center gap-3">
            <ArrowDownCircle className="w-6 h-6 text-[color:var(--rust)]" />
            <div>
              <div className="text-xs text-[color:var(--soft)] uppercase">Bought (last 6 months)</div>
              <div className="text-2xl font-semibold">{rand(totals.bought)}</div>
            </div>
          </div>
        </div>
        <div className="accent-card accent-bar-green">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-6 h-6 text-primary" />
            <div>
              <div className="text-xs text-[color:var(--soft)] uppercase">Sold (last 6 months)</div>
              <div className="text-2xl font-semibold">{rand(totals.sold)}</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          {(["animals", "grain"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tap-target px-4 rounded-[10px] text-sm font-medium inline-flex items-center gap-2 border ${
                tab === t
                  ? "accent-select text-foreground"
                  : "bg-[color:var(--surface-alt)] text-[color:var(--soft)] border-border"
              }`}
            >
              {t === "animals" ? <Beef className="w-4 h-4" /> : <Wheat className="w-4 h-4" />}
              {t === "animals" ? "Animals" : "Grain"}
            </button>
          ))}
        </div>

        <h3 className="text-base font-semibold mb-3">Sold vs Bought — {tab === "animals" ? "Animals" : "Grain"}</h3>
        {monthly.length === 0 ? (
          <p className="text-sm text-[color:var(--faint)]">No entries yet. Add one below to see the graph.</p>
        ) : (
          <div className="space-y-3">
            {monthly.map((m) => (
              <div key={m.month}>
                <div className="flex justify-between text-xs text-[color:var(--soft)] mb-1">
                  <span>{m.month}</span>
                  <span>
                    <span className="text-primary">{rand(m.sold)}</span>
                    <span className="text-[color:var(--faint)]"> sold · </span>
                    <span className="text-[color:var(--rust)]">{rand(m.bought)}</span>
                    <span className="text-[color:var(--faint)]"> bought</span>
                  </span>
                </div>
                <div className="flex gap-1 h-6">
                  <div className="h-full rounded-l-[6px] bg-[color:var(--primary)]" style={{ width: `${(m.sold / maxVal) * 50}%` }} />
                  <div className="h-full rounded-r-[6px] bg-[color:var(--rust)]" style={{ width: `${(m.bought / maxVal) * 50}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="text-base font-semibold mb-3 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add stock entry
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as "animals" | "grain")}>
              <option value="animals">Animals</option>
              <option value="grain">Grain</option>
            </Select>
          </div>
          <div>
            <Label>Item</Label>
            <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder={category === "animals" ? "Cattle" : "Maize"} />
          </div>
          <div>
            <Label>Action</Label>
            <Select value={action} onChange={(e) => setAction(e.target.value as "bought" | "sold")}>
              <option value="sold">Sold</option>
              <option value="bought">Bought</option>
            </Select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <Label>Unit price (R)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label>Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={onAdd}><Plus className="w-4 h-4" /> Save entry</Button>
        </div>
        <ErrorText>{err}</ErrorText>
      </Card>

      <Card>
        <h3 className="text-base font-semibold mb-3 inline-flex items-center gap-2">
          <PackageOpen className="w-4 h-4" /> Recent entries — {tab === "animals" ? "Animals" : "Grain"}
        </h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-[color:var(--faint)]">Nothing here yet.</p>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 20).map((e) => {
              const total = e.quantity * e.unit_price_rands;
              return (
                <div key={e.id} className="rounded-[10px] border border-border bg-[color:var(--surface-alt)] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {e.item_name} <span className="text-[color:var(--faint)]">· {e.entry_month}</span>
                    </div>
                    <div className="text-xs text-[color:var(--soft)]">
                      {e.action === "sold" ? "Sold" : "Bought"} {e.quantity} × R{e.unit_price_rands.toLocaleString("en-ZA")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${e.action === "sold" ? "text-primary" : "text-[color:var(--rust)]"}`}>
                      {e.action === "sold" ? "+" : "−"}{rand(total)}
                    </div>
                    <button
                      onClick={() => onRemove(e.id)}
                      className="text-xs text-[color:var(--faint)] hover:text-[color:var(--rust)] inline-flex items-center gap-1 mt-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}

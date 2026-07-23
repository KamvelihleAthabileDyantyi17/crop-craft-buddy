import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const StockInput = z.object({
  category: z.enum(["animals", "grain"]),
  item_name: z.string().min(1),
  action: z.enum(["bought", "sold"]),
  quantity: z.number().nonnegative(),
  unit_price_rands: z.number().nonnegative(),
  entry_month: z.string().min(4),
  notes: z.string().optional().default(""),
});

export const addStockEntry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => StockInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("stock_entries")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteStockEntry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("stock_entries").delete().eq("id", data.id);
    return { ok: true };
  });

import { createServerFn as _csf2 } from "@tanstack/react-start";
export const listStockEntries = _csf2({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("stock_entries")
      .select("*")
      .order("entry_month", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Admin back-office server functions.
 *
 * Every function is authenticated (`requireSupabaseAuth`) AND authorized
 * (`has_role(uid, 'admin')`) before touching data with the service-role
 * client. Nothing here is reachable by anonymous visitors.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const ORDER_STATUSES = [
  "novo",
  "em_analise",
  "cotacao_enviada",
  "aguardando_pagamento",
  "pago",
  "emitido",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  cotacao_enviada: "Cotação enviada",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  emitido: "Emitido",
  cancelado: "Cancelado",
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const isAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data), userId: context.userId };
  });

const ORDER_SELECT = `
  id, protocol, status, origin_iata, destination_iata, depart_date, return_date,
  adults, children, infants, cabin, preferred_airline, preferred_program,
  flexible_dates, budget_brl, notes, quoted_price_brl, real_price_brl,
  miles_required, miles_price_brl, markup_applied_brl, airport_tax_brl,
  final_price_brl, internal_notes, locator, created_at, updated_at,
  customers ( id, full_name, email, phone )
`;

export type AdminOrder = {
  id: string;
  protocol: string;
  status: string;
  origin_iata: string;
  destination_iata: string;
  depart_date: string;
  return_date: string | null;
  adults: number;
  children: number;
  infants: number;
  cabin: string;
  preferred_airline: string | null;
  preferred_program: string | null;
  flexible_dates: boolean;
  budget_brl: number | null;
  notes: string | null;
  quoted_price_brl: number | null;
  real_price_brl: number | null;
  miles_required: number | null;
  miles_price_brl: number | null;
  markup_applied_brl: number | null;
  airport_tax_brl: number | null;
  final_price_brl: number | null;
  internal_notes: string | null;
  locator: string | null;
  created_at: string;
  updated_at: string;
  customers: { id: string; full_name: string; email: string; phone: string } | null;
};

const listSchema = z.object({
  status: z.string().optional(),
  q: z.string().trim().max(120).optional(),
  origin: z.string().trim().max(3).optional(),
  destination: z.string().trim().max(3).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.number().int().min(1).max(500).optional(),
  pageSize: z.number().int().min(5).max(100).optional(),
});

export const listOrdersFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 15;
    const fromIdx = (page - 1) * pageSize;

    let customerIds: string[] | null = null;
    if (data.q) {
      const like = `%${data.q}%`;
      const { data: cust } = await supabaseAdmin
        .from("customers")
        .select("id")
        .or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
        .limit(200);
      customerIds = (cust ?? []).map((c) => c.id as string);
    }

    let query = supabaseAdmin
      .from("orders")
      .select(ORDER_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(fromIdx, fromIdx + pageSize - 1);

    if (data.status) query = query.eq("status", data.status);
    if (data.origin) query = query.eq("origin_iata", data.origin.toUpperCase());
    if (data.destination) query = query.eq("destination_iata", data.destination.toUpperCase());
    if (data.from) query = query.gte("created_at", `${data.from}T00:00:00Z`);
    if (data.to) query = query.lte("created_at", `${data.to}T23:59:59Z`);
    if (customerIds) {
      if (customerIds.length === 0) return { rows: [] as AdminOrder[], total: 0, page, pageSize };
      query = query.in("customer_id", customerIds);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return {
      rows: (rows ?? []) as unknown as AdminOrder[],
      total: count ?? 0,
      page,
      pageSize,
    };
  });

export const getAdminStatsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select("status, final_price_brl, miles_price_brl, created_at")
      .limit(5000);
    if (error) throw new Error(error.message);

    const byStatus: Record<string, number> = {};
    let revenue = 0;
    for (const r of rows ?? []) {
      const s = String(r.status);
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      const value = Number(r.final_price_brl ?? r.miles_price_brl ?? 0);
      if (["pago", "emitido"].includes(s)) revenue += value;
    }
    return { total: (rows ?? []).length, byStatus, revenue };
  });

export const getOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const { data: history } = await supabaseAdmin
      .from("order_status_history")
      .select("id, from_status, to_status, changed_by, note, created_at")
      .eq("order_id", data.id)
      .order("created_at", { ascending: false });

    return {
      order: order as unknown as AdminOrder,
      history: (history ?? []) as {
        id: string;
        from_status: string | null;
        to_status: string;
        changed_by: string | null;
        note: string | null;
        created_at: string;
      }[],
    };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ORDER_STATUSES).optional(),
  statusNote: z.string().trim().max(500).optional(),
  realPriceBRL: z.number().min(0).max(1_000_000).nullable().optional(),
  milesRequired: z.number().min(0).max(100_000_000).nullable().optional(),
  milesPriceBRL: z.number().min(0).max(1_000_000).nullable().optional(),
  markupBRL: z.number().min(0).max(1_000_000).nullable().optional(),
  airportTaxBRL: z.number().min(0).max(1_000_000).nullable().optional(),
  finalPriceBRL: z.number().min(0).max(1_000_000).nullable().optional(),
  internalNotes: z.string().trim().max(4000).nullable().optional(),
  locator: z.string().trim().max(20).nullable().optional(),
});

export const updateOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current, error: curErr } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", data.id)
      .single();
    if (curErr) throw new Error(curErr.message);

    const patch: Record<string, unknown> = {};
    if (data.status) patch['status'] = data.status;
    if (data.realPriceBRL !== undefined) patch['real_price_brl'] = data.realPriceBRL;
    if (data.milesRequired !== undefined) patch['miles_required'] = data.milesRequired;
    if (data.milesPriceBRL !== undefined) patch['miles_price_brl'] = data.milesPriceBRL;
    if (data.markupBRL !== undefined) patch['markup_applied_brl'] = data.markupBRL;
    if (data.airportTaxBRL !== undefined) patch['airport_tax_brl'] = data.airportTaxBRL;
    if (data.finalPriceBRL !== undefined) patch['final_price_brl'] = data.finalPriceBRL;
    if (data.internalNotes !== undefined) patch['internal_notes'] = data.internalNotes;
    if (data.locator !== undefined) patch['locator'] = data.locator;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    if (data.status && data.status !== current.status) {
      await supabaseAdmin.from("order_status_history").insert({
        order_id: data.id,
        from_status: current.status as string,
        to_status: data.status,
        changed_by: "admin",
        note: data.statusNote ?? null,
      });
    }

    return { ok: true };
  });

/**
 * Prepared for a future transactional-email provider (Resend/Postmark).
 * Today it only queues the intent in `email_logs`; nothing is sent.
 */
export const queueETicketEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, protocol, locator, customers ( email )")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const email = (order as unknown as { customers?: { email?: string } }).customers?.email;
    if (!email) throw new Error("Cliente sem e-mail cadastrado");

    const { error: logErr } = await supabaseAdmin.from("email_logs").insert({
      order_id: data.id,
      to_email: email,
      template: "eticket",
      subject: `Seu e-ticket — ${order.protocol}`,
      status: "queued",
    });
    if (logErr) throw new Error(logErr.message);
    return { ok: true, queuedTo: email };
  });

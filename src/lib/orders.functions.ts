/**
 * Public "solicitação de emissão com milhas" intake.
 *
 * The public form never touches the Data API directly: all writes go through
 * this server function using the service-role client. The order tables have
 * RLS enabled with no public policies, so nobody can list customers/orders
 * from the browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { orderRequestSchema, type OrderCreated } from "@/lib/orders/schema";

export const createOrderFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderRequestSchema.parse(input))
  .handler(async ({ data }): Promise<OrderCreated> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.toLowerCase();

    // 1. Reuse or create the customer (email is the natural key).
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);

    let customerId = existing?.id as string | undefined;

    if (customerId) {
      const { error } = await supabaseAdmin
        .from("customers")
        .update({ full_name: data.fullName, phone: data.phone })
        .eq("id", customerId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("customers")
        .insert({ full_name: data.fullName, email, phone: data.phone })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      customerId = created.id as string;
    }

    // 2. Unique protocol.
    const { data: protocolData, error: protoErr } = await supabaseAdmin.rpc(
      "next_order_protocol",
    );
    if (protoErr) throw new Error(protoErr.message);
    const protocol = String(protocolData);

    // 3. Create the order.
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        protocol,
        customer_id: customerId,
        status: "novo",
        origin_iata: data.origin.toUpperCase(),
        destination_iata: data.destination.toUpperCase(),
        depart_date: data.departDate,
        return_date: data.returnDate ?? null,
        adults: data.adults,
        children: data.children ?? 0,
        infants: data.infants ?? 0,
        cabin: data.cabin,
        preferred_airline: data.preferredAirline ?? null,
        preferred_program: data.preferredProgram ?? null,
        flexible_dates: data.flexibleDates ?? false,
        budget_brl: data.budgetBRL ?? null,
        notes: data.notes ?? null,
      })
      .select("id, protocol, status, created_at")
      .single();
    if (orderErr) throw new Error(orderErr.message);

    // 4. Status history (best-effort — the order itself is already saved).
    await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id,
      from_status: null,
      to_status: "novo",
      changed_by: "public_form",
      note: "Solicitação criada pelo formulário público",
    });

    // 5. Notify the TRIPmoc business WhatsApp from the backend (best-effort).
    try {
      const { notifyBusinessWhatsApp } = await import("@/lib/orders/notify.server");
      const pax =
        `${data.adults} adulto(s)` +
        (data.children ? `, ${data.children} criança(s)` : "") +
        (data.infants ? `, ${data.infants} bebê(s)` : "");
      const result = await notifyBusinessWhatsApp({
        id: order.id as string,
        protocol: order.protocol as string,
        fullName: data.fullName,
        phone: data.phone,
        email,
        origin: data.origin.toUpperCase(),
        destination: data.destination.toUpperCase(),
        departDate: data.departDate,
        returnDate: data.returnDate,
        passengers: pax,
        notes: data.notes,
        createdAt: order.created_at as string,
      });
      if (!result.sent) {
        console.warn("[orders] WhatsApp notification not sent:", result.transport, result.error);
      }
      await supabaseAdmin.from("email_logs").insert({
        order_id: order.id,
        to_email: (process.env["WHATSAPP_BUSINESS_NUMBER"] || "553120940901").replace(/\D/g, ""),
        template: "whatsapp_order",
        subject: `Nova solicitação ${order.protocol}`,
        status: result.sent ? "sent" : "failed",
        error: result.sent ? null : `${result.transport}: ${result.error ?? "erro desconhecido"}`,
        sent_at: result.sent ? new Date().toISOString() : null,
      });
    } catch (err) {
      console.warn("[orders] WhatsApp notification failed", err);
      await supabaseAdmin.from("email_logs").insert({
        order_id: order.id,
        to_email: "whatsapp",
        template: "whatsapp_order",
        subject: `Nova solicitação ${order.protocol}`,
        status: "failed",
        error: err instanceof Error ? err.message : "erro desconhecido",
      });
    }


    return {
      protocol: order.protocol as string,
      status: order.status as string,
      createdAt: order.created_at as string,
      summary: {
        origin: data.origin.toUpperCase(),
        destination: data.destination.toUpperCase(),
        departDate: data.departDate,
        returnDate: data.returnDate,
        adults: data.adults,
        children: data.children ?? 0,
        infants: data.infants ?? 0,
        cabin: data.cabin,
      },
    };
  });

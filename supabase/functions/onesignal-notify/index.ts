import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ONESIGNAL_APP_ID = "36658d3c-f616-4b23-a25b-d5835fa3cff5"
const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_API_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { subscription_id, titulo, cuerpo, send_after } = await req.json()

    if (!subscription_id || !cuerpo) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400, headers: corsHeaders })
    }

    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      include_subscription_ids: [subscription_id],
      headings: { es: titulo || "MisGastos — Recordatorio" },
      contents: { es: cuerpo },
      url: "https://misgastos-opal.vercel.app",
    }

    if (send_after) {
      payload.send_after = send_after // formato ISO: "2026-04-10 09:00:00 GMT-0300"
    }

    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})

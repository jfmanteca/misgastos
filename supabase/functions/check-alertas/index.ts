import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ONESIGNAL_APP_ID = "36658d3c-f616-4b23-a25b-d5835fa3cff5"
const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const fARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    // Hora actual en Argentina (UTC-3, sin DST)
    const now = new Date()
    const argNow = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    const hhmm = argNow.toISOString().substring(11, 16)         // "HH:MM"
    const today = argNow.toISOString().substring(0, 10)         // "YYYY-MM-DD"
    const todayDay = parseInt(today.split("-")[2], 10)           // día del mes
    const todayMMDD = today.substring(5)                         // "MM-DD"
    const todayDow = argNow.getDay()                             // 0=Dom … 6=Sáb

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Traer todas las alertas activas que tienen subscription_id guardado
    const { data: alertas, error } = await supabase
      .from("alertas")
      .select("*")
      .eq("activa", true)
      .not("onesignal_sub_id", "is", null)

    if (error) throw error
    if (!alertas?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })

    let sent = 0
    const results: unknown[] = []

    for (const a of alertas) {
      // 1. Verificar hora exacta
      const alertaHora = (a.hora || "09:00").substring(0, 5)
      if (alertaHora !== hhmm) continue

      // 2. Verificar que no se disparó hoy ya
      if (a.ultima_notificacion) {
        const lastDate = a.ultima_notificacion.substring(0, 10)
        if (lastDate === today) continue
      }

      // 3. Verificar frecuencia
      let shouldFire = false
      const frec = a.frecuencia || "unica"

      if (frec === "unica") {
        shouldFire = a.fecha === today
      } else if (frec === "diaria") {
        shouldFire = true
      } else if (frec === "mensual") {
        const diaMes = a.dia_mes ?? parseInt((a.fecha || "01").split("-")[2], 10)
        shouldFire = diaMes === todayDay
      } else if (frec === "semanal") {
        if (a.fecha) {
          // Comparar día de semana de la fecha original con hoy
          const alertDate = new Date(a.fecha + "T12:00:00Z")
          shouldFire = alertDate.getDay() === todayDow
        }
      } else if (frec === "anual") {
        if (a.fecha) shouldFire = a.fecha.substring(5) === todayMMDD
      }

      if (!shouldFire) continue

      // 4. Armar cuerpo de la notificación
      const nombre = a.subcategoria || a.categoria || "pago"
      let cuerpo = `Recordá que hoy tenés que hacer un pago: ${nombre}.`
      if (a.importe) cuerpo += `\nImporte: ${fARS(a.importe)}.`
      if (a.nota) cuerpo += `\n${a.nota}`

      // 5. Enviar via OneSignal
      const payload = {
        app_id: ONESIGNAL_APP_ID,
        include_subscription_ids: [a.onesignal_sub_id],
        headings: { es: "MisGastos — Recordatorio de pago" },
        contents: { es: cuerpo },
        url: "https://misgastos-opal.vercel.app",
      }

      const res = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Key ${ONESIGNAL_API_KEY}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await supabase
          .from("alertas")
          .update({ ultima_notificacion: now.toISOString() })
          .eq("id", a.id)
        sent++
        results.push({ id: a.id, categoria: a.categoria, status: "sent" })
      } else {
        const errText = await res.text()
        results.push({ id: a.id, status: "error", error: errText })
      }
    }

    return new Response(JSON.stringify({ sent, hhmm, today, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

-- ============================================================
-- PASO 1: Agregar columna onesignal_sub_id a la tabla alertas
-- ============================================================
alter table alertas add column if not exists onesignal_sub_id text;


-- ============================================================
-- PASO 2: Habilitar extensiones necesarias (si no están ya)
-- ============================================================
create extension if not exists pg_net  schema extensions;
create extension if not exists pg_cron schema extensions;


-- ============================================================
-- PASO 3: Crear el cron job que dispara check-alertas cada minuto
-- Reemplazá SERVICE_ROLE_KEY con tu clave real (Settings > API)
-- ============================================================
select cron.schedule(
  'check-alertas-every-minute',
  '* * * * *',
  $$
  select extensions.http_post(
    url    := 'https://cmyyvqbttapiuqgdzymu.supabase.co/functions/v1/check-alertas',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_KEY'
    ),
    body   := '{}'::jsonb
  )
  $$
);


-- ============================================================
-- Para verificar que el cron se creó:
-- select * from cron.job;
--
-- Para eliminarlo si querés:
-- select cron.unschedule('check-alertas-every-minute');
-- ============================================================

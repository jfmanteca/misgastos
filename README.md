# MisGastos

App de control de gastos personales con sincronización en tiempo real.

## Requisitos previos

- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [GitHub](https://github.com) (gratis)

## Paso 1: Configurar Supabase

1. Ya creaste el proyecto "misgastos" en Supabase
2. Andá a **SQL Editor** → **New Query**
3. Pegá el contenido de `supabase-schema.sql` y ejecutalo (botón Run)
4. Después pegá el contenido de `migration-data.sql`:
   - Antes de ejecutar, reemplazá `TU_USER_ID` con tu User ID real
   - Lo encontrás en **Authentication** → **Users** → click en tu usuario → copiá el UUID

## Paso 2: Subir a GitHub

1. Creá un repositorio nuevo en GitHub (ej: `misgastos`)
2. Subí todos los archivos de este proyecto al repositorio

Desde terminal:
```bash
cd misgastos
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/misgastos.git
git push -u origin main
```

## Paso 3: Deploy en Vercel

1. Andá a [vercel.com](https://vercel.com) e ingresá con GitHub
2. Click en **Add New** → **Project**
3. Seleccioná el repositorio `misgastos`
4. Vercel detecta que es Vite automáticamente
5. Click en **Deploy**
6. En ~1 minuto tenés tu app en `misgastos.vercel.app`

## Paso 4: Instalar en el celular (PWA)

1. Abrí `https://misgastos.vercel.app` en Chrome (Android) o Safari (iPhone)
2. **Android**: Tocá el menú (⋮) → "Agregar a pantalla de inicio"
3. **iPhone**: Tocá el botón compartir (↑) → "Agregar a pantalla de inicio"
4. Se instala como una app con ícono, sin barra del navegador

## Uso desde PC

Simplemente entrá a `https://misgastos.vercel.app` desde cualquier navegador.

Los datos se sincronizan automáticamente entre todos los dispositivos.

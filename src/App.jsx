import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "./supabase.js"
import OneSignal from "react-onesignal"

// ── CONSTANTS ──
const EGRESO_CATS=["Salidas","Compras","Departamento","Auto","Apps","Entrenamiento","Transporte","Préstamo","Boca Juniors","Módulo","Cuidado Personal","Regalos","Comida laboral","Estudios","Pago deuda","Gastos Tarjeta","Otros"]
const EGRESO_SUBS={"Salidas":["Comidas / Bares","Boliches / Fiestas","Recitales","Otras"],"Compras":["Supermercado","Delivery","Ropa","Farmacia","Verdulería","Carnicería","Dietética","Departamento","Otros"],"Departamento":["Cuota Hipotecario","Metrogas","Edesur","Internet","Expensas","Seguro"],"Auto":["Nafta","Seguro","Peajes","Cochera","Lavadero","Multa","Cuota Préstamo"],"Apps":["Spotify","YouTube","Netflix","LinkedIn","Adobe"],"Entrenamiento":["Gimnasio"],"Transporte":["UBER","SUBE","Estacionamiento"],"Préstamo":["Préstamo","Fapa","Chino","Andi","Coco","Marcos","Gabriela","Andino"],"Boca Juniors":["Cuota Socio","Cancha"],"Módulo":["Módulo Sanitario"],"Cuidado Personal":["Proteína","Peluquería","Terapia","Creatina"],"Regalos":["Edgardo","Nancy","Otros"],"Comida laboral":["Almuerzo"],"Estudios":["Inglés","Coderhouse"],"Pago deuda":["Edgardo"],"Gastos Tarjeta":["Impuestos e intereses"],"Otros":["Apuestas","Otros"]}
const INGRESO_CATS=["Sueldo","Incentivado / SAC","Inversiones - Intereses Ganados","Otros Ingresos"]
const INV_TYPES=["Compra/venta USD","CEDEARs / Acciones","Caución / Plazo fijo","Crypto / Otros"]
const COLORS=["#3b82f6","#8b5cf6","#f59e0b","#ef4444","#10b981","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16","#06b6d4","#e11d48","#a3e635","#7c3aed","#fb923c","#2dd4bf","#c084fc","#facc15","#f43f5e","#34d399"]

const f$=(n,u)=>{const a=Math.abs(n||0);return u?`USD ${a.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})}`:`$${a.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})}`}
const fS=(n,u)=>{const p=u?"U$":"";return n>=1e6?`${p}${(n/1e6).toFixed(1)}M`:n>=1e3?`${p}${(n/1e3).toFixed(0)}K`:`${p}${Math.round(n)}`}
const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
const monthOf=d=>d?.slice(0,7)||""
const Ic=({d,s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
const IC={home:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",plus:"M12 5v14M5 12h14",list:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",chart:"M18 20V10M12 20V4M6 20v-6",debt:"M1 4h22v16H1zM1 10h22",upload:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",left:"M15 18l-6-6 6-6",right:"M9 18l6-6-6-6",logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",eyeOff:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22",edit:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",settings:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",menu:"M3 12h18M3 6h18M3 18h18",close:"M18 6L6 18M6 6l12 12",sun:"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6z",moon:"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",bell:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"}
const mo={fontFamily:"'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',monospace"}
// Category emoji icons for visual identification
const CAT_ICON={"Salidas":"🍻","Compras":"🛒","Departamento":"🏠","Auto":"🚗","Apps":"📱","Entrenamiento":"💪","Transporte":"🚇","Préstamo":"🤝","Boca Juniors":"⚽","Módulo":"🏗️","Cuidado Personal":"💇","Regalos":"🎁","Comida laboral":"🍽️","Estudios":"📚","Pago deuda":"💳","Gastos Tarjeta":"🏦","Otros":"📌","Sueldo":"💰","Inversiones":"📈","Traspaso":"↔️","Inversiones - Intereses Ganados":"📊","Incentivado / SAC":"🎯","Otros Ingresos":"💵"}
const catIcon=c=>{for(const[k,v] of Object.entries(CAT_ICON)){if(c?.includes(k))return v};return"📌"}
// Account icons: favicon URL para los que funciona bien, badge de iniciales+color para el resto
const ACC_FAVICON={
  "Mercado Pago":"mercadopago.com",
  "Mercado":"mercadopago.com",
  "Brubank":"brubank.com",
  "Ualá":"uala.com.ar",
  "Lemon":"lemon.me",
  "Naranja":"naranjax.com",
  "Personal Pay":"personal.com.ar",
  "Prex":"prexcard.com",
  "Banco Ciudad":"bancociudad.com.ar",
  "Ciudad":"bancociudad.com.ar",
  "Banco Nación":"bna.com.ar",
  "Galicia":"galicia.com.ar",
  "Santander":"santander.com.ar",
  "BBVA":"bbva.com.ar",
  "Frances":"bbva.com.ar",
  "HSBC":"hsbc.com.ar",
  "Macro":"macro.com.ar",
  "Supervielle":"supervielle.com.ar",
  "Patagonia":"bancopatagonia.com.ar",
  "ICBC":"icbc.com.ar",
  "Comafi":"comafi.com.ar",
  "Credicoop":"creditocooperativo.coop",
  "Wilobank":"wilobank.com",
}
const ACC_BADGE={
  "Banco Provincia": {label:"BP", bg:"#006341", color:"#fff"},
  "BAPRO":           {label:"BP", bg:"#006341", color:"#fff"},
}
const ACC_EMOJI={"Efectivo":"💵"}
const AccIcon=({name,size=30})=>{
  const n=name||""
  const faviconDomain=Object.entries(ACC_FAVICON).find(([k])=>n.toLowerCase().includes(k.toLowerCase()))?.[1]
  const badge=Object.entries(ACC_BADGE).find(([k])=>n.toLowerCase().includes(k.toLowerCase()))?.[1]
  const emoji=Object.entries(ACC_EMOJI).find(([k])=>n.toLowerCase().includes(k.toLowerCase()))?.[1]
  const[err,setErr]=useState(false)
  const r=Math.round(size*.35)
  if(faviconDomain&&!err)
    return<img src={`https://www.google.com/s2/favicons?domain=${faviconDomain}&sz=64`} onError={()=>setErr(true)} alt={n} style={{width:size,height:size,borderRadius:6,objectFit:"contain"}}/>
  if(badge)
    return<div style={{width:size,height:size,borderRadius:8,background:badge.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:r,fontWeight:800,color:badge.color,letterSpacing:-.5,fontFamily:"sans-serif"}}>{badge.label}</div>
  if(emoji)
    return<span style={{fontSize:Math.round(size*.65)}}>{emoji}</span>
  return<div style={{width:size,height:size,borderRadius:8,background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:r,fontWeight:800,color:"#fff"}}>{n.slice(0,2).toUpperCase()}</div>
}
// Category color map for badges
const CAT_COLORS={"Salidas":"#f97316","Compras":"#3b82f6","Departamento":"#8b5cf6","Auto":"#ef4444","Apps":"#06b6d4","Entrenamiento":"#10b981","Transporte":"#f59e0b","Préstamo":"#64748b","Boca Juniors":"#facc15","Módulo":"#14b8a6","Cuidado Personal":"#ec4899","Regalos":"#a78bfa","Comida laboral":"#fb923c","Estudios":"#6366f1","Pago deuda":"#7f1d1d","Gastos Tarjeta":"#475569","Otros":"#334155","Sueldo":"#22c55e","Inversiones":"#eab308","Traspaso":"#60a5fa"}
const catColor=c=>CAT_COLORS[c]||"#475569"
const S={
  sec:{fontSize:14,fontWeight:700,letterSpacing:1,color:"var(--text-muted)",marginBottom:14},
  crd:{background:"var(--card-bg)",borderRadius:20,border:"1px solid var(--card-border)",overflow:"hidden",boxShadow:"var(--card-shadow)"},
  crdP:{background:"var(--card-bg)",borderRadius:20,padding:20,border:"1px solid var(--card-border)",boxShadow:"var(--card-shadow)"},
  lbl:{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:8,fontWeight:600},
  inp:{width:"100%",padding:"14px 18px",background:"var(--inp-bg)",border:"1px solid var(--inp-border)",borderRadius:14,color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",transition:"border .2s"},
  btn:(active,color)=>({padding:"9px 16px",borderRadius:24,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:active?color:"var(--btn-bg)",color:active?"#fff":"var(--text-secondary)",transition:"all .15s",boxShadow:active?`0 2px 12px ${color}44`:"none"}),
}

// ══════════════ AUTH ══════════════
function LoginPage({darkMode=true}){
  const[email,setEmail]=useState("")
  const[pass,setPass]=useState("")
  const[err,setErr]=useState("")
  const[loading,setLoading]=useState(false)
  const[mode,setMode]=useState("login") // "login" | "register"

  const goEmail=async()=>{
    setLoading(true);setErr("")
    const fn=mode==="register"
      ?supabase.auth.signUp({email,password:pass})
      :supabase.auth.signInWithPassword({email,password:pass})
    const{error}=await fn
    if(error)setErr(error.message)
    else if(mode==="register")setErr("✓ Revisá tu email para confirmar el registro.")
    setLoading(false)
  }

  const goGoogle=async()=>{
    setLoading(true);setErr("")
    const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}})
    if(error){setErr(error.message);setLoading(false)}
  }

  const bg=darkMode?"#0b1120":"#f0f4f8"
  const cardBorder=darkMode?"rgba(255,255,255,.06)":"rgba(0,0,0,.09)"
  const txtPrimary=darkMode?"#e2e8f0":"#0f172a"
  const txtMuted=darkMode?"#475569":"#64748b"
  const inpBg=darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.03)"
  const inpBorder=darkMode?"rgba(255,255,255,.1)":"rgba(0,0,0,.14)"
  const dividerBg=darkMode?"rgba(255,255,255,.06)":"rgba(0,0,0,.08)"
  const loginInp={width:"100%",padding:"14px 18px",background:inpBg,border:`1px solid ${inpBorder}`,borderRadius:14,color:txtPrimary,fontSize:14,outline:"none",boxSizing:"border-box"}
  const loginLbl={fontSize:11,color:txtMuted,textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:8,fontWeight:600}

  return(
    <div style={{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:360}}>
        <h1 style={{fontSize:32,fontWeight:800,textAlign:"center",marginBottom:8,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MisGastos</h1>
        <p style={{color:txtMuted,textAlign:"center",fontSize:14,marginBottom:32}}>{mode==="register"?"Creá tu cuenta":"Iniciá sesión para continuar"}</p>

        {/* Google */}
        <button onClick={goGoogle} disabled={loading} style={{width:"100%",padding:14,borderRadius:14,border:`1px solid ${cardBorder}`,fontSize:15,fontWeight:600,cursor:"pointer",background:"#fff",color:"#1e293b",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?.6:1}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar con Google
        </button>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{flex:1,height:1,background:dividerBg}}/>
          <span style={{fontSize:12,color:txtMuted}}>o con email</span>
          <div style={{flex:1,height:1,background:dividerBg}}/>
        </div>

        {err&&<div style={{background:err.startsWith("✓")?"rgba(74,222,128,.08)":"rgba(239,68,68,.1)",border:`1px solid ${err.startsWith("✓")?"rgba(74,222,128,.2)":"rgba(239,68,68,.2)"}`,borderRadius:12,padding:"10px 14px",marginBottom:16,color:err.startsWith("✓")?"#4ade80":"#f87171",fontSize:13}}>{err}</div>}

        <div style={{marginBottom:12}}>
          <label style={loginLbl}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={loginInp}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={loginLbl}>Contraseña</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={loginInp} onKeyDown={e=>e.key==="Enter"&&goEmail()}/>
        </div>
        <button onClick={goEmail} disabled={loading} style={{width:"100%",padding:16,borderRadius:16,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",opacity:loading?.6:1,boxShadow:"0 6px 20px rgba(59,130,246,.3)",marginBottom:14}}>
          {loading?"...":(mode==="register"?"Registrarse":"Ingresar")}
        </button>
        <div style={{textAlign:"center"}}>
          <button onClick={()=>{setMode(m=>m==="login"?"register":"login");setErr("")}} style={{background:"none",border:"none",color:"#60a5fa",fontSize:13,cursor:"pointer",textDecoration:"underline"}}>
            {mode==="login"?"¿No tenés cuenta? Registrate":"¿Ya tenés cuenta? Ingresá"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════ HOME ══════════════
function HomePage({cuentas,movimientos}){
  const[hide,setHide]=useState(false)
  const tP=cuentas.filter(c=>c.moneda!=="USD").reduce((s,c)=>s+c.saldo,0)
  const tU=cuentas.filter(c=>c.moneda==="USD").reduce((s,c)=>s+c.saldo,0)
  const curMonth=monthOf(today())
  const recent=movimientos.filter(m=>monthOf(m.fecha)<=curMonth).slice(0,12)
  const h=v=>hide?"••••••":v
  // Group accounts by name — each row shows $ and USD side by side
  const grupos=[]
  const seen={}
  cuentas.forEach(c=>{
    const key=c.nombre.toLowerCase()
    if(!(key in seen)){seen[key]=grupos.length;grupos.push({nombre:c.nombre,ars:null,usd:null})}
    if(c.moneda==="USD")grupos[seen[key]].usd=c
    else grupos[seen[key]].ars=c
  })

  return(
    <div className="page-inner">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={S.sec}>Patrimonio Total</div>
        <button onClick={()=>setHide(!hide)} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:4}}>
          <Ic d={hide?IC.eyeOff:IC.eye} s={18}/>
        </button>
      </div>
      <div className="patrimonio-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:28}}>
        <div style={{background:"linear-gradient(135deg,#0c1929 0%,#1e40af 50%,#7c3aed 100%)",borderRadius:20,padding:"22px 18px",border:"1px solid rgba(96,165,250,.15)",boxShadow:"0 8px 32px rgba(37,99,235,.15)"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:6,fontWeight:600,letterSpacing:1}}>PESOS</div>
          <div style={{fontSize:24,fontWeight:800,color:"#fff",...mo}}>{h(f$(tP))}</div>
        </div>
        <div style={{background:"linear-gradient(135deg,#052e16 0%,#059669 50%,#14b8a6 100%)",borderRadius:20,padding:"22px 18px",border:"1px solid rgba(74,222,128,.15)",boxShadow:"0 8px 32px rgba(5,150,105,.15)"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:6,fontWeight:600,letterSpacing:1}}>DÓLARES</div>
          <div style={{fontSize:24,fontWeight:800,color:"#fff",...mo}}>{h(f$(tU,true))}</div>
        </div>
      </div>

      <div style={S.sec}>Cuentas</div>
      <div style={{...S.crd,marginBottom:28}}>
        {/* Header */}
        <div style={{display:"flex",padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{width:30,flexShrink:0}}/>
          <div style={{flex:1}}/>
          <div style={{width:110,textAlign:"right",fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>$</div>
          <div style={{width:100,textAlign:"right",fontSize:10,color:"#34d399",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>USD</div>
        </div>
        {grupos.length===0&&<div style={{padding:24,textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Sin cuentas. Agregá una en Configuración.</div>}
        {grupos.map((g,i)=>(
          <div key={g.nombre} style={{display:"flex",alignItems:"center",padding:"12px 10px",gap:8,borderBottom:i<grupos.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
            <div style={{width:30,height:30,borderRadius:8,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(96,165,250,.08)"}}><AccIcon name={g.nombre} size={30}/></div>
            <div style={{flex:1,minWidth:0,fontSize:13,color:"var(--text-primary)",fontWeight:600,lineHeight:1.3}}>{g.nombre}</div>
            <div style={{width:110,textAlign:"right",flexShrink:0}}><div style={{fontSize:12,fontWeight:700,color:"var(--text-primary)",...mo}}>{g.ars?h(f$(g.ars.saldo)):<span style={{color:"#334155"}}>—</span>}</div></div>
            <div style={{width:100,textAlign:"right",flexShrink:0}}><div style={{fontSize:12,fontWeight:700,color:"#a7f3d0",...mo}}>{g.usd?h(f$(g.usd.saldo,true)):<span style={{color:"#334155"}}>—</span>}</div></div>
          </div>
        ))}
      </div>

      <div style={S.sec}>Últimos Movimientos</div>
      <div style={S.crd}>
        {recent.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Sin movimientos. Cargá tu primer gasto.</div>}
        {recent.map((e,i)=>{
          const enUSD=cuentas.find(c=>c.id===e.cuenta_id)?.moneda==="USD"
          const cuentaNom=cuentas.find(c=>c.id===e.cuenta_id)?.nombre||""
          const devolucion=e.tipo==="egreso"&&e.monto<0
          const col=e.tipo==="ingreso"||devolucion?"#4ade80":e.tipo==="traspaso"?"#60a5fa":"#f87171"
          const sign=e.tipo==="ingreso"||devolucion?"+":e.tipo==="egreso"?"-":"↔"
          const monto=sign+f$(Math.abs(e.monto),enUSD)
          return(
          <div key={e.id} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:i<recent.length-1?"1px solid var(--card-border)":"none",gap:10,overflow:"hidden"}}>
            <div style={{width:34,height:34,borderRadius:9,background:`${catColor(e.categoria)}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
              {catIcon(e.categoria)}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:"var(--text-primary)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.subcategoria||e.categoria}</div>
              <div style={{fontSize:10,color:"var(--text-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.fecha?.slice(5)||""} · {cuentaNom}</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:col,...mo,whiteSpace:"nowrap",flexShrink:0}}>{hide?"••••":monto}</div>
          </div>)
        })}
      </div>
    </div>
  )
}

// ══════════════ CARGAR ══════════════
function AddPage({cuentas,movimientos=[],userId,onSaved,egresoCats,egresoSubs,ingresoCats,invTypes}){
  const[mt,setMt]=useState("egreso")
  const[fm,setFm]=useState({date:today(),cat:"",sub:"",tc:"",cuenta:"",amt:"",it:"",from:"",to:"",tcDolar:"",nota:""})
  const[ok,setOk]=useState(false)
  const[saving,setSaving]=useState(false)
  const[usdCalc,setUsdCalc]=useState(null)
  const[showConfirm,setShowConfirm]=useState(false)
  const[recupero,setRecupero]=useState(false)
  const[opUSD,setOpUSD]=useState(false)
  const[catSort,setCatSort]=useState("uso") // "uso" | "az"
  const subs=egresoSubs[fm.cat]||[]
  const isUSD=mt==="inversion"&&fm.it.toLowerCase().includes("usd")

  // Conteo de uso por categoría y por cuenta
  const catUsage={}
  const cuentaUsage={}
  movimientos.forEach(m=>{
    if(m.categoria){catUsage[m.categoria]=(catUsage[m.categoria]||0)+1}
    if(m.cuenta_id){cuentaUsage[m.cuenta_id]=(cuentaUsage[m.cuenta_id]||0)+1}
  })

  // Ordenar categorías según modo seleccionado
  const sortCats=cats=>catSort==="az"?[...cats].sort((a,b)=>a.localeCompare(b,"es")):[...cats].sort((a,b)=>(catUsage[b]||0)-(catUsage[a]||0))

  useEffect(()=>{
    if(cuentas.length>0&&!fm.cuenta){
      // Buscar explícitamente la cuenta ARS por nombre para evitar confusión con cuentas USD homónimas
      const arsCuentas=cuentas.filter(c=>c.moneda!=="USD")
      const usdCuentas=cuentas.filter(c=>c.moneda==="USD")
      // Prioridad: BAPRO ARS > primera ARS disponible (NO depende de movimientos para evitar race condition)
      const defARS=arsCuentas.find(c=>c.nombre.toLowerCase().includes("bapro"))||arsCuentas[0]
      const defUSD=usdCuentas.find(c=>c.nombre.toLowerCase().includes("efectivo"))||usdCuentas[0]
      if(defARS)setFm(f=>({...f,cuenta:defARS.id,from:defARS.id,to:defUSD?.id||""}))
    }
  },[cuentas])

  const go=async()=>{
    if(saving)return;setSaving(true)
    try{
      if(mt==="traspaso"){
        if(!fm.amt||fm.from===fm.to){setSaving(false);return}
        const amt=parseFloat(fm.amt)
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"traspaso",categoria:"Traspaso",subcategoria:`${cuentas.find(c=>c.id===fm.from)?.nombre} → ${cuentas.find(c=>c.id===fm.to)?.nombre}`,monto:amt,cuenta_id:fm.from,cuenta_destino_id:fm.to})
        const{data:fromFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.from).single()
        const{data:toFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.to).single()
        if(fromFresh)await supabase.from("cuentas").update({saldo:fromFresh.saldo-amt}).eq("id",fm.from)
        if(toFresh)await supabase.from("cuentas").update({saldo:toFresh.saldo+amt}).eq("id",fm.to)
      }else if(mt==="inversion"){
        if(!fm.amt||!fm.it){setSaving(false);return}
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"inversion",categoria:"Inversiones",subcategoria:fm.it,monto:parseFloat(fm.amt),cuenta_id:fm.cuenta})
      }else{
        if(!fm.amt||!fm.cat){setSaving(false);return}
        const rawAmt=parseFloat(fm.amt)
        const amt=mt==="egreso"&&recupero?-Math.abs(rawAmt):(mt==="ingreso"?Math.abs(rawAmt):rawAmt)
        const tcDolar=fm.tcDolar?parseFloat(fm.tcDolar):null
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:mt,categoria:fm.cat,subcategoria:fm.sub||null,monto:amt,cuenta_id:fm.cuenta,tc:fm.tc||null,tc_dolar:tcDolar,nota:fm.nota||null})
        const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.cuenta).single()
        if(fresh){
          // egreso: resta (amt puede ser negativo si es recupero, en ese caso suma)
          // ingreso: siempre suma el monto absoluto
          const delta=mt==="egreso"?-amt:Math.abs(amt)
          await supabase.from("cuentas").update({saldo:fresh.saldo+delta}).eq("id",fm.cuenta)
        }
        if(mt==="egreso"&&fm.cat==="Pago deuda"&&fm.sub==="Edgardo"){
          const{data:lastDeuda}=await supabase.from("deuda_edgardo").select("saldo_usd,saldo").order("fecha",{ascending:false}).order("created_at",{ascending:false}).limit(1)
          const lastSaldoUSD=lastDeuda?.[0]?.saldo_usd!=null?lastDeuda[0].saldo_usd:(lastDeuda?.[0]?.saldo||0)
          const montoUSD=tcDolar&&tcDolar>0?Math.abs(amt)/tcDolar:Math.abs(amt)
          await supabase.from("deuda_edgardo").insert({user_id:userId,fecha:fm.date,descripcion:"Pago por deuda",monto:-Math.abs(amt),monto_usd:-montoUSD,saldo:0,saldo_usd:lastSaldoUSD-montoUSD,tc_dolar:tcDolar})
        }
      }
      setOk(true);await onSaved()
      setTimeout(()=>{setOk(false);setFm(f=>({...f,cat:"",sub:"",amt:"",tc:"",it:"",tcDolar:"",nota:""}))},1200)
    }catch(e){console.error(e)}
    setSaving(false)
  }

  const calcularUSD=()=>{
    if(!fm.amt||!fm.tc||parseFloat(fm.tc)<=0)return
    setUsdCalc(parseFloat(fm.amt)/parseFloat(fm.tc))
    setShowConfirm(true)
  }

  const confirmarUSD=async()=>{
    if(saving)return;setSaving(true);setShowConfirm(false)
    try{
      const importePesos=parseFloat(fm.amt)
      const importeUSD=usdCalc
      await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"inversion",categoria:"Inversiones",subcategoria:fm.it,monto:importePesos,cuenta_id:fm.from,cuenta_destino_id:fm.to,detalle:`TC:${fm.tc}`})
      const{data:fromFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.from).single()
      if(fromFresh)await supabase.from("cuentas").update({saldo:fromFresh.saldo-importePesos}).eq("id",fm.from)
      const{data:toFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.to).single()
      if(toFresh)await supabase.from("cuentas").update({saldo:toFresh.saldo+importeUSD}).eq("id",fm.to)
      setOk(true);setUsdCalc(null);await onSaved()
      setTimeout(()=>{setOk(false);setFm(f=>({...f,amt:"",tc:"",it:""}))},1200)
    }catch(e){console.error(e)}
    setSaving(false)
  }

  const cn=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const tabC={egreso:"#dc2626",ingreso:"#16a34a",traspaso:"#3b82f6",inversion:"#f59e0b"}
  const tabL={egreso:"Egreso",ingreso:"Ingreso",traspaso:"Traspaso",inversion:"Inversiones"}

  return(
    <div className="page-inner">
      {/* Confirm modal for Compra USD */}
      {showConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#141c28",borderRadius:20,padding:28,width:"100%",maxWidth:360,border:"1px solid rgba(245,158,11,.2)"}}>
          <div style={{fontSize:16,fontWeight:700,color:"#f59e0b",marginBottom:20,textAlign:"center"}}>Confirmar Compra USD</div>
          <div style={{background:"#0b1120",borderRadius:12,padding:16,marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:"var(--text-muted)"}}>Debitás</span>
              <span style={{fontSize:15,fontWeight:700,color:"#f87171",...mo}}>- {f$(parseFloat(fm.amt))}</span>
            </div>
            <div style={{fontSize:11,color:"var(--text-muted)",textAlign:"right"}}>{cn(fm.from)}</div>
            <div style={{borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:"var(--text-muted)"}}>Acreditás</span>
              <span style={{fontSize:15,fontWeight:700,color:"#4ade80",...mo}}>+ {f$(usdCalc,true)}</span>
            </div>
            <div style={{fontSize:11,color:"var(--text-muted)",textAlign:"right"}}>{cn(fm.to)}</div>
            <div style={{borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:10,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:"var(--text-muted)"}}>TC</span>
              <span style={{fontSize:13,color:"var(--text-secondary)",...mo}}>{f$(parseFloat(fm.tc))}</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>setShowConfirm(false)} style={{padding:14,borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"var(--text-secondary)",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
            <button onClick={confirmarUSD} disabled={saving} style={{padding:14,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#b45309)",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer"}}>{saving?"Guardando...":"Confirmar"}</button>
          </div>
        </div>
      </div>}

      <div style={S.sec}>Nuevo Movimiento</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
        {["egreso","ingreso","traspaso","inversion"].map(t=><button key={t} onClick={()=>{setMt(t);setFm(f=>({...f,cat:"",sub:"",it:""}));setUsdCalc(null);setRecupero(false);setOpUSD(false)}} style={{padding:"12px 0",borderRadius:12,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:mt===t?tabC[t]:"var(--btn-bg)",color:mt===t?"#fff":"var(--text-muted)"}}>{tabL[t]}</button>)}
      </div>

      {/* Generic fields for non-inversion tabs */}
      {mt!=="inversion"&&<>
        {mt==="egreso"&&<label style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,padding:"12px 14px",borderRadius:12,background:recupero?"rgba(74,222,128,.06)":"rgba(220,38,38,.04)",border:`1px solid ${recupero?"rgba(74,222,128,.2)":"rgba(220,38,38,.1)"}`,cursor:"pointer"}}>
          <input type="checkbox" checked={recupero} onChange={e=>setRecupero(e.target.checked)} style={{width:16,height:16,accentColor:"#4ade80",cursor:"pointer",flexShrink:0}}/>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:recupero?"#4ade80":"#fca5a5"}}>¿Recupero de dinero?</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>Sumará como un ingreso por devolución</div>
          </div>
        </label>}
        {mt!=="traspaso"&&<label style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"12px 14px",borderRadius:12,background:opUSD?"rgba(52,211,153,.06)":"rgba(255,255,255,.02)",border:`1px solid ${opUSD?"rgba(52,211,153,.2)":"rgba(255,255,255,.06)"}`,cursor:"pointer"}}>
          <input type="checkbox" checked={opUSD} onChange={e=>setOpUSD(e.target.checked)} style={{width:16,height:16,accentColor:"#34d399",cursor:"pointer",flexShrink:0}}/>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:opUSD?"#34d399":"#64748b"}}>Operación en dólares</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>Muestra solo cuentas en USD</div>
          </div>
        </label>}
        <div style={{marginBottom:16}}><label style={S.lbl}>Importe</label><input type="text" inputMode="decimal" value={fm.amt} onChange={e=>setFm(f=>({...f,amt:e.target.value}))} placeholder="0" style={{...S.inp,fontSize:24,fontWeight:700,...mo}}/></div>
        <div style={{marginBottom:16}}><label style={S.lbl}>Fecha</label><input type="date" value={fm.date} onChange={e=>setFm(f=>({...f,date:e.target.value}))} style={{...S.inp,display:"block",width:"100%",WebkitAppearance:"none"}}/></div>
      </>}

      {mt==="egreso"&&<>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <label style={{...S.lbl,marginBottom:0}}>Categoría</label>
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>setCatSort("uso")} style={{padding:"4px 10px",borderRadius:8,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:catSort==="uso"?"#3b82f6":"var(--btn-bg)",color:catSort==="uso"?"#fff":"var(--text-muted)"}}>Más usadas</button>
              <button onClick={()=>setCatSort("az")} style={{padding:"4px 10px",borderRadius:8,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:catSort==="az"?"#3b82f6":"var(--btn-bg)",color:catSort==="az"?"#fff":"var(--text-muted)"}}>A-Z</button>
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sortCats(egresoCats).map(c=><button key={c} onClick={()=>setFm(f=>({...f,cat:c,sub:""}))} style={S.btn(fm.cat===c,"#3b82f6")}>{c}</button>)}</div>
        </div>
        {subs.length>0&&<div style={{marginBottom:16}}><label style={S.lbl}>Detalle</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{subs.map(s=><button key={s} onClick={()=>setFm(f=>({...f,sub:s}))} style={S.btn(fm.sub===s,"#8b5cf6")}>{s}</button>)}</div></div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12,marginBottom:16}}>
          <div><label style={S.lbl}>TC</label><select value={fm.tc} onChange={e=>setFm(f=>({...f,tc:e.target.value}))} style={S.inp}><option value="">—</option><option value="V">V</option><option value="M">M</option></select></div>
          <div><label style={S.lbl}>Cuenta</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.filter(a=>opUSD?a.moneda==="USD":a.moneda!=="USD").map(a=><option key={a.id} value={a.id}>{a.nombre} ({a.moneda})</option>)}</select></div>
        </div>
        {fm.cat==="Pago deuda"&&fm.sub==="Edgardo"&&<div style={{marginBottom:16}}>
          <label style={S.lbl}>TC Dólar (para convertir a USD en Deuda)</label>
          <input type="text" inputMode="decimal" value={fm.tcDolar} onChange={e=>setFm(f=>({...f,tcDolar:e.target.value}))} placeholder="Ej: 1450" style={{...S.inp,...mo}}/>
          {fm.amt&&fm.tcDolar&&parseFloat(fm.tcDolar)>0&&<div style={{marginTop:8,padding:"10px 14px",borderRadius:10,background:"rgba(52,211,153,.05)",border:"1px solid rgba(52,211,153,.15)",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:"var(--text-muted)"}}>Pago en USD</span>
            <span style={{fontSize:16,fontWeight:700,color:"#34d399",...mo}}>{f$(Math.abs(parseFloat(fm.amt))/parseFloat(fm.tcDolar),true)}</span>
          </div>}
        </div>}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>Nota adicional</label>
          <textarea value={fm.nota} onChange={e=>setFm(f=>({...f,nota:e.target.value}))} placeholder="Opcional — cualquier detalle extra" rows={2} style={{...S.inp,resize:"vertical",lineHeight:1.5}}/>
        </div>
      </>}
      {mt==="ingreso"&&<>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <label style={{...S.lbl,marginBottom:0}}>Categoría</label>
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>setCatSort("uso")} style={{padding:"4px 10px",borderRadius:8,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:catSort==="uso"?"#16a34a":"var(--btn-bg)",color:catSort==="uso"?"#fff":"var(--text-muted)"}}>Más usadas</button>
              <button onClick={()=>setCatSort("az")} style={{padding:"4px 10px",borderRadius:8,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:catSort==="az"?"#16a34a":"var(--btn-bg)",color:catSort==="az"?"#fff":"var(--text-muted)"}}>A-Z</button>
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sortCats(ingresoCats).map(c=><button key={c} onClick={()=>setFm(f=>({...f,cat:c}))} style={S.btn(fm.cat===c,"#16a34a")}>{c}</button>)}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:16}}>
          <div><label style={S.lbl}>Cuenta destino</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.filter(a=>opUSD?a.moneda==="USD":a.moneda!=="USD").map(a=><option key={a.id} value={a.id}>{a.nombre} ({a.moneda})</option>)}</select></div>
          <div><label style={S.lbl}>TC Dólar</label><input type="text" inputMode="decimal" value={fm.tcDolar} onChange={e=>setFm(f=>({...f,tcDolar:e.target.value}))} placeholder="Ej: 1450" style={{...S.inp,...mo}}/></div>
        </div>
        {fm.amt&&fm.tcDolar&&parseFloat(fm.tcDolar)>0&&<div style={{...S.crdP,marginBottom:16,background:"rgba(52,211,153,.05)",border:"1px solid rgba(52,211,153,.15)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:"var(--text-muted)"}}>Equivalente en USD</span>
            <span style={{fontSize:18,fontWeight:700,color:"#34d399",...mo}}>{f$(parseFloat(fm.amt)/parseFloat(fm.tcDolar),true)}</span>
          </div>
        </div>}
      </>}
      {mt==="traspaso"&&<div style={{marginBottom:16}}>
        <label style={S.lbl}>Cuenta Origen</label><select value={fm.from} onChange={e=>setFm(f=>({...f,from:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre} ({a.moneda})</option>)}</select>
        <div style={{textAlign:"center",padding:"10px 0",color:"#3b82f6",fontSize:20}}>↓</div>
        <label style={S.lbl}>Cuenta Destino</label><select value={fm.to} onChange={e=>setFm(f=>({...f,to:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre} ({a.moneda})</option>)}</select>
      </div>}

      {mt==="inversion"&&<>
        {/* Step 1: Type selector */}
        <div style={{marginBottom:20}}>
          <label style={S.lbl}>Tipo de Inversión</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {invTypes.map(t=><button key={t} onClick={()=>{const isUsdType=t.toLowerCase().includes("usd");setFm(f=>({...f,it:t,amt:"",tc:"",...(isUsdType?{from:cuentas.find(c=>c.nombre==="BAPRO $")?.id||cuentas.find(c=>c.moneda!=="USD")?.id||f.from,to:cuentas.find(c=>c.nombre==="Efectivo USD")?.id||cuentas.find(c=>c.moneda==="USD")?.id||f.to}:{})}));setUsdCalc(null)}} style={{...S.btn(fm.it===t,"#f59e0b"),padding:"12px 16px",fontSize:13}}>{t}</button>)}
          </div>
        </div>

        {/* Step 2a: Standard inversion form */}
        {fm.it&&!isUSD&&<>
          <div style={{marginBottom:16}}><label style={S.lbl}>Importe</label><input type="text" inputMode="decimal" value={fm.amt} onChange={e=>setFm(f=>({...f,amt:e.target.value}))} placeholder="0" style={{...S.inp,fontSize:24,fontWeight:700,...mo}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Fecha</label><input type="date" value={fm.date} onChange={e=>setFm(f=>({...f,date:e.target.value}))} style={{...S.inp,display:"block",width:"100%",WebkitAppearance:"none"}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Cuenta</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre} ({a.moneda})</option>)}</select></div>
        </>}

        {/* Step 2b: Compra USD form */}
        {fm.it&&isUSD&&<>
          <div style={{marginBottom:16}}><label style={S.lbl}>Fecha</label><input type="date" value={fm.date} onChange={e=>setFm(f=>({...f,date:e.target.value}))} style={{...S.inp,display:"block",width:"100%",WebkitAppearance:"none"}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Importe en Pesos</label><input type="text" inputMode="decimal" value={fm.amt} onChange={e=>{setFm(f=>({...f,amt:e.target.value}));setUsdCalc(null)}} placeholder="0" style={{...S.inp,fontSize:24,fontWeight:700,...mo}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Tipo de Cambio</label><input type="text" inputMode="decimal" value={fm.tc} onChange={e=>{setFm(f=>({...f,tc:e.target.value}));setUsdCalc(null)}} placeholder="0" style={{...S.inp,fontSize:20,fontWeight:700,...mo}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Cuenta a Debitar</label><select value={fm.from} onChange={e=>setFm(f=>({...f,from:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre} ({a.moneda})</option>)}</select></div>
          <div style={{marginBottom:20}}><label style={S.lbl}>Cuenta a Acreditar</label><select value={fm.to} onChange={e=>setFm(f=>({...f,to:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre} ({a.moneda})</option>)}</select></div>
          {usdCalc!==null&&<div style={{...S.crdP,marginBottom:16,textAlign:"center",border:"1px solid rgba(245,158,11,.25)"}}>
            <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",marginBottom:4}}>Resultado</div>
            <div style={{fontSize:26,fontWeight:800,color:"#f59e0b",...mo}}>{f$(usdCalc,true)}</div>
          </div>}
          <button onClick={calcularUSD} disabled={!fm.amt||!fm.tc||!fm.from||fm.from===fm.to} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#f59e0b,#b45309)",color:"#000",opacity:fm.amt&&fm.tc?1:.4,marginBottom:8}}>Calcular</button>
        </>}
      </>}

      {/* Save button (hidden for Compra USD — uses modal confirm instead) */}
      {!isUSD&&<button onClick={go} disabled={saving} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:ok?"#16a34a":"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff",opacity:ok||fm.amt?1:.4}}>{ok?"✓ Guardado":saving?"Guardando...":"Guardar"}</button>}
    </div>
  )
}

// ══════════════ DASHBOARD ══════════════
function DashboardPage({movimientos,onViewMonth,onViewMonthInv,onViewMonthIng,cuentas,subEgreso}){
  const[pi,setPi]=useState(0)
  const[expandedCat,setExpandedCat]=useState(null)
  const[showUSD,setShowUSD]=useState(false)
  const[hoveredCat,setHoveredCat]=useState(null)
  const[selFijoMk,setSelFijoMk]=useState(null)
  const isUSDCuenta=id=>cuentas.find(c=>c.id===id)?.moneda==="USD"
  // Group by month
  const monthly={}
  movimientos.forEach(m=>{
    const k=monthOf(m.fecha);if(!monthly[k])monthly[k]={egP:0,egU:0,ingP:0,ingU:0,inv:0}
    const isUSD=isUSDCuenta(m.cuenta_id)
    if(m.tipo==="egreso"&&m.categoria!=="Inversiones"){if(isUSD)monthly[k].egU+=m.monto;else monthly[k].egP+=m.monto}
    if(m.tipo==="ingreso"){if(isUSD)monthly[k].ingU+=m.monto;else monthly[k].ingP+=m.monto}
    if(m.tipo==="inversion"||(m.tipo==="egreso"&&m.categoria==="Inversiones"))monthly[k].inv+=m.monto
  })
  const months=Object.keys(monthly).sort()
  const[bo,setBo]=useState(0)
  const vb=6,si=Math.max(0,months.length-vb-bo),ei=si+vb
  const vis=months.slice(si,ei)

  // Sueldo con fecha <= día 15 cuenta para ese mes; > día 15 cuenta para el mes siguiente
  const dayN=d=>parseInt((d||"").split("-")[2],10)
  const getMonthIngresos=(k)=>{
    const prevK=(()=>{const[y2,m2]=k.split("-").map(Number);const pm=m2===1?12:m2-1;const py=m2===1?y2-1:y2;return`${py}-${String(pm).padStart(2,"0")}`})()
    // Sueldos del mes anterior cobrados después del 15 → cuentan para este mes
    const sueldosPrevForThis=movimientos.filter(m=>monthOf(m.fecha)===prevK&&m.tipo==="ingreso"&&m.categoria==="Sueldo"&&dayN(m.fecha)>15)
    const sueldoPrev=sueldosPrevForThis.reduce((s,m)=>s+m.monto,0)
    const allThisMonth=movimientos.filter(m=>monthOf(m.fecha)===k)
    // Ingresos de este mes: todos excepto sueldos cobrados después del día 15 (esos son del mes siguiente)
    const ingThisMonth=allThisMonth.filter(m=>m.tipo==="ingreso"&&(m.categoria!=="Sueldo"||dayN(m.fecha)<=15)).reduce((s,m)=>s+m.monto,0)
    return sueldoPrev+ingThisMonth
  }
  const getEg=k=>showUSD?(monthly[k]?.egU||0):(monthly[k]?.egP||0)
  const getIng=k=>showUSD?(monthly[k]?.ingU||0):getMonthIngresos(k)
  const maxBar=Math.max(...vis.map(k=>Math.max(getEg(k),getIng(k))),1)
  const maxI=Math.max(...Object.values(monthly).map(m=>m.inv),1)

  // Pie chart
  const allMonths=months.length>0?months:[monthOf(today())]
  const pieIdx=Math.max(0,Math.min(pi,allMonths.length-1))
  const pk=allMonths[pieIdx]||monthOf(today())
  const pe=movimientos.filter(m=>m.tipo==="egreso"&&m.categoria!=="Inversiones"&&monthOf(m.fecha)===pk)
  const pc={};pe.forEach(e=>{pc[e.categoria]=(pc[e.categoria]||0)+e.monto})
  const ps=Object.entries(pc).sort((a,b)=>b[1]-a[1])
  const pt=ps.reduce((s,[,v])=>s+v,0)
  let ca=-Math.PI/2
  const arcs=ps.map(([cat,val],i)=>{const ang=(val/Math.max(pt,1))*Math.PI*2;const x1=70*Math.cos(ca),y1=70*Math.sin(ca),x2=70*Math.cos(ca+ang),y2=70*Math.sin(ca+ang);const r={cat,val,c:COLORS[i%COLORS.length],d:`M0,0 L${x1},${y1} A70,70 0 ${ang>Math.PI?1:0},1 ${x2},${y2} Z`};ca+=ang;return r})

  const fmtMonth=k=>{const[y,m]=k.split("-");const ml=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];return`${ml[parseInt(m)-1]} ${y.slice(2)}`}
  const NavBtn=({dir,dis,fn})=><button onClick={fn} disabled={dis} style={{width:28,height:28,borderRadius:8,border:"none",background:dis?"transparent":"#1e293b",color:dis?"#1e293b":"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={dir==="l"?IC.left:IC.right} s={14}/></button>

  useEffect(()=>{
    const curMonth=monthOf(today())
    const idx=allMonths.indexOf(curMonth)
    setPi(idx>=0?idx:allMonths.length-1)
  },[allMonths.length])

  return(
    <div className="page-inner">
      <div style={S.sec}>Dashboard</div>

      {/* Ingresos vs Egresos */}
      <div style={{...S.crdP,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1}}>Ingresos vs Egresos</div>
            <div style={{display:"flex",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:"#4ade80"}}/><span style={{fontSize:10,color:"var(--text-muted)"}}>Ing</span></div>
              <div style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:"#f87171"}}/><span style={{fontSize:10,color:"var(--text-muted)"}}>Eg</span></div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* USD Switch */}
            <div onClick={()=>setShowUSD(!showUSD)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"4px 10px",borderRadius:20,background:showUSD?"rgba(52,211,153,.12)":"rgba(255,255,255,.04)",border:"1px solid "+(showUSD?"rgba(52,211,153,.3)":"rgba(255,255,255,.08)")}}>
              <span style={{fontSize:11,fontWeight:600,color:showUSD?"#34d399":"#64748b"}}>{showUSD?"USD":"$"}</span>
              <div style={{width:28,height:16,borderRadius:8,background:showUSD?"#059669":"#1e293b",position:"relative",transition:"all .2s"}}>
                <div style={{width:12,height:12,borderRadius:6,background:"#fff",position:"absolute",top:2,left:showUSD?14:2,transition:"all .2s"}}/>
              </div>
            </div>
            <NavBtn dir="l" dis={si<=0} fn={()=>setBo(o=>Math.min(o+4,months.length-vb))}/>
            <NavBtn dir="r" dis={bo<=0} fn={()=>setBo(o=>Math.max(o-4,0))}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:210}}>
          {vis.map((k,i)=>{
            const last=si+i===months.length-1
            const eg=getEg(k),ing=getIng(k)
            const hEg=Math.max(4,(eg/maxBar)*160)
            const hIng=Math.max(4,(ing/maxBar)*160)
            return(
              <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{display:"flex",gap:4,justifyContent:"center",width:"100%",flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:"#4ade80",fontWeight:600,...mo}}>{fS(ing,showUSD)}</span>
                  <span style={{fontSize:10,color:"#f87171",fontWeight:600,...mo}}>{fS(eg,showUSD)}</span>
                </div>
                <div style={{display:"flex",gap:3,width:"100%",alignItems:"flex-end",height:160}}>
                  <div onClick={()=>onViewMonthIng(k)} style={{flex:1,height:hIng,borderRadius:"4px 4px 2px 2px",cursor:"pointer",background:last?"linear-gradient(180deg,#4ade80,#16a34a)":"linear-gradient(180deg,#166534,#14532d)"}}/>
                  <div onClick={()=>onViewMonth(k)} style={{flex:1,height:hEg,borderRadius:"4px 4px 2px 2px",cursor:"pointer",background:last?"linear-gradient(180deg,#f87171,#dc2626)":"linear-gradient(180deg,#7f1d1d,#450a0a)"}}/>
                </div>
                <div style={{fontSize:11,color:last?"#60a5fa":"#94a3b8",fontWeight:last?700:500}}>{fmtMonth(k)}</div>
              </div>
            )
          })}
        </div>
        {vis.length>0&&<div style={{fontSize:10,color:"#334155",textAlign:"center",marginTop:8}}>Tocá una barra para ver movimientos</div>}
      </div>

      {/* Inversiones + % debajo de cada mes */}
      {vis.some(k=>monthly[k]?.inv>0)&&<div style={{...S.crdP,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1}}>Inversiones mensuales</div>
          <div style={{display:"flex",gap:4}}>
            <NavBtn dir="l" dis={si<=0} fn={()=>setBo(o=>Math.min(o+4,months.length-vb))}/>
            <NavBtn dir="r" dis={bo<=0} fn={()=>setBo(o=>Math.max(o-4,0))}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140}}>
          {vis.map(k=>{
            const invH=monthly[k]?.inv>0?(monthly[k].inv/maxI)*110:4
            return(
            <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}} onClick={()=>onViewMonthInv(k)}>
              {monthly[k]?.inv>0&&<div style={{fontSize:13,color:"#f59e0b",fontWeight:600,...mo}}>{fS(monthly[k].inv)}</div>}
              <div style={{width:"100%",height:invH,borderRadius:"6px 6px 2px 2px",background:monthly[k]?.inv>0?"linear-gradient(180deg,#f59e0b,#b45309)":"#0f1a2a"}}/>
              <div style={{fontSize:11,color:"var(--text-secondary)",fontWeight:500}}>{fmtMonth(k)}</div>
            </div>)
          })}
        </div>
        {/* % cards below each month */}
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {vis.map(k=>{
            const ing=(monthly[k]?.ingP||0)+(monthly[k]?.ingU||0)
            const inv=monthly[k]?.inv||0
            const pct=ing>0?Math.round((inv/ing)*100):0
            const isGood=pct>=20
            return(
              <div key={k} style={{flex:1,textAlign:"center",padding:"6px 2px",borderRadius:10,background:pct===0?"rgba(255,255,255,.02)":isGood?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",border:`1px solid ${pct===0?"transparent":isGood?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)"}`}}>
                <div style={{fontSize:14,fontWeight:700,color:pct===0?"#334155":isGood?"#4ade80":"#f87171",...mo}}>{pct}%</div>
                <div style={{fontSize:9,color:"var(--text-muted)"}}>vs ing</div>
              </div>
            )
          })}
        </div>
        {vis.length>0&&<div style={{fontSize:10,color:"#334155",textAlign:"center",marginTop:8}}>Tocá una barra para ver inversiones del mes</div>}
      </div>}

      {/* Proyección Gastos Fijos */}
      {(()=>{
        const fijoSubs=(subEgreso||[]).filter(s=>s.es_fijo)
        if(fijoSubs.length===0)return null
        const fijoNombres=new Set(fijoSubs.map(s=>s.nombre))
        const nowD=new Date()
        const last6=[]
        for(let i=5;i>=0;i--){const d=new Date(nowD.getFullYear(),nowD.getMonth()-i,1);last6.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`)}
        const ml2=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
        const fmtMk=mk=>{const[,m]=mk.split("-");return ml2[parseInt(m)-1]}
        const mData=last6.map(mk=>{
          const movs=movimientos.filter(m=>m.tipo==="egreso"&&m.monto>0&&fijoNombres.has(m.subcategoria)&&monthOf(m.fecha)===mk)
          return{mk,total:movs.reduce((s,m)=>s+m.monto,0),movs}
        })
        // SVG geometry only — labels are HTML
        const cW=280,cH=70,pX=10,pYt=5,pYb=5
        const step=(cW-2*pX)/(last6.length-1)
        const maxV=Math.max(...mData.map(d=>d.total),1)
        const pts=mData.map((d,i)=>({
          x:pX+i*step, y:pYt+(1-d.total/maxV)*(cH-pYt-pYb),
          leftPct:(pX+i*step)/cW*100, ...d
        }))
        const linePts=pts.map(p=>`${p.x},${p.y}`).join(" ")
        const selData=mData.find(d=>d.mk===selFijoMk)
        const breakdown=selData?fijoSubs.map(s=>{
          const movs=selData.movs.filter(m=>m.subcategoria===s.nombre)
          return{sub:s.nombre,monto:movs.reduce((sum,m)=>sum+m.monto,0),cat:movs[0]?.categoria||""}
        }).filter(i=>i.monto>0).sort((a,b)=>b.monto-a.monto):[]
        const selTotal=selData?.total||0
        const maxBreak=Math.max(...breakdown.map(i=>i.monto),1)
        return(
          <div style={{...S.crdP,marginBottom:20}}>
            <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Gastos Fijos — últimos 6 meses</div>
            <div style={{fontSize:10,color:"#334155",marginBottom:10}}>Tocá un mes para ver el discriminado</div>
            {/* Chart wrapper: padding-top reserves space for HTML amount labels */}
            <div style={{position:"relative",paddingTop:18,marginBottom:4}}>
              {/* Amount labels — HTML, positioned absolutely over SVG */}
              {pts.map((p,i)=>p.total>0?(
                <div key={i} style={{position:"absolute",top:0,left:`${p.leftPct}%`,transform:"translateX(-50%)",fontSize:10,fontWeight:600,color:p.mk===selFijoMk?"#fbbf24":"#94a3b8",whiteSpace:"nowrap",pointerEvents:"none",...mo}}>
                  {fS(p.total)}
                </div>
              ):null)}
              {/* SVG — geometry only, no text */}
              <svg viewBox={`0 0 ${cW} ${cH}`} style={{width:"100%",display:"block"}}>
                <polygon points={`${pts[0].x},${cH-pYb} ${linePts} ${pts[pts.length-1].x},${cH-pYb}`} fill="rgba(251,191,36,.07)"/>
                <polyline points={linePts} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                {pts.map((p,i)=>{
                  const isSel=p.mk===selFijoMk
                  return(
                    <g key={i} onClick={()=>setSelFijoMk(isSel?null:p.mk)} style={{cursor:"pointer"}}>
                      {isSel&&<circle cx={p.x} cy={p.y} r="9" fill="rgba(251,191,36,.15)"/>}
                      <circle cx={p.x} cy={p.y} r={isSel?5:3.5} fill={p.total>0?"#fbbf24":"#1e293b"} stroke="#fbbf24" strokeWidth={isSel?1.5:1}/>
                    </g>
                  )
                })}
              </svg>
            </div>
            {/* Month labels — HTML flex, matching style of other charts */}
            <div style={{display:"flex",marginBottom:selData?0:0}}>
              {last6.map((mk,i)=>(
                <div key={i} onClick={()=>setSelFijoMk(mk===selFijoMk?null:mk)} style={{flex:1,textAlign:"center",fontSize:11,color:mk===selFijoMk?"#fbbf24":"#94a3b8",fontWeight:mk===selFijoMk?700:500,cursor:"pointer"}}>
                  {fmtMk(mk)}
                </div>
              ))}
            </div>
            {/* Breakdown */}
            {selData&&<div style={{marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:12,color:"var(--text-secondary)",fontWeight:600}}>{fmtMk(selFijoMk)} — discriminado</span>
                <span style={{fontSize:14,fontWeight:700,color:"#fbbf24",...mo}}>{f$(selTotal)}</span>
              </div>
              {breakdown.length===0
                ?<div style={{fontSize:12,color:"var(--text-muted)",textAlign:"center",padding:8}}>Sin movimientos de gastos fijos en este mes</div>
                :breakdown.map((item,i)=>(
                  <div key={i} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13}}>{catIcon(item.cat)}</span>
                        <span style={{fontSize:12,color:"var(--text-primary)"}}>{item.sub}</span>
                        {item.cat&&<span style={{fontSize:10,color:"var(--text-muted)"}}>{item.cat}</span>}
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:"#fbbf24",...mo}}>{f$(item.monto)}</span>
                    </div>
                    <div style={{height:3,background:"#0f1a2a",borderRadius:2}}><div style={{width:`${(item.monto/maxBreak)*100}%`,height:"100%",background:"linear-gradient(90deg,#92400e,#fbbf24)",borderRadius:2}}/></div>
                  </div>
                ))
              }
            </div>}
          </div>
        )
      })()}

      {/* Pie */}
      <div style={S.crdP}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1}}>Gastos por categoría</div>
          <select value={pieIdx} onChange={e=>setPi(parseInt(e.target.value))} style={{...S.inp,width:"auto",padding:"8px 14px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,.04)"}}>
            {allMonths.map((m,idx)=><option key={m} value={idx}>{fmtMonth(m)}</option>)}
          </select>
        </div>
        {ps.length===0?<div style={{textAlign:"center",color:"var(--text-muted)",padding:30,fontSize:13}}>Sin datos</div>:<>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:20}}>
            <div style={{position:"relative"}}>
              <svg width="260" height="260" viewBox="-95 -95 190 190">
                {arcs.map((a,i)=><path key={i} d={a.d} fill={hoveredCat===a.cat?`${a.c}`:a.c} stroke="#0b1120" strokeWidth={hoveredCat===a.cat?"2":"1"} style={{cursor:"pointer",opacity:hoveredCat&&hoveredCat!==a.cat?.5:1,transition:"opacity .15s"}} onMouseEnter={()=>setHoveredCat(a.cat)} onMouseLeave={()=>setHoveredCat(null)} onClick={()=>setHoveredCat(hoveredCat===a.cat?null:a.cat)}/>)}
                <circle cx="0" cy="0" r="40" fill="#141c28"/>
                {hoveredCat?<>
                  <text x="0" y="-10" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="600">{hoveredCat}</text>
                  <text x="0" y="8" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="700" style={mo}>{f$(pc[hoveredCat]||0)}</text>
                  <text x="0" y="22" textAnchor="middle" fill="#64748b" fontSize="10">{pt>0?((pc[hoveredCat]||0)/pt*100).toFixed(1):0}%</text>
                </>:<>
                  <text x="0" y="5" textAnchor="middle" fill="#64748b" fontSize="11">TOTAL</text>
                </>}
              </svg>
            </div>
            <div style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",...mo,marginTop:8}}>{f$(pt)}</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>Total egresos del mes</div>
          </div>
          {ps.map(([cat,total],i)=>{
            const pct=pt>0?((total/pt)*100).toFixed(1):0
            const isExpanded=expandedCat===cat
            // Get subcategory breakdown
            const subTotals={}
            pe.filter(e=>e.categoria===cat).forEach(e=>{const s=e.subcategoria||"Sin detalle";subTotals[s]=(subTotals[s]||0)+e.monto})
            const subSorted=Object.entries(subTotals).sort((a,b)=>b[1]-a[1])
            return(
            <div key={cat} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,cursor:"pointer"}} onClick={()=>setExpandedCat(isExpanded?null:cat)}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:16}}>{catIcon(cat)}</div>
                  <div style={{width:12,height:12,borderRadius:3,background:COLORS[i%COLORS.length]}}/>
                  <span style={{fontSize:15,color:"var(--text-primary)",fontWeight:500}}>{cat}</span>
                  <Ic d={isExpanded?IC.left:IC.right} s={12}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:14,color:"var(--text-secondary)",fontWeight:500}}>{pct}%</span>
                  <span style={{fontSize:16,fontWeight:700,color:total<0?"#4ade80":"#e2e8f0",...mo}}>{total<0?"-":""}{f$(total)}</span>
                </div>
              </div>
              <div style={{height:6,background:"#0f1a2a",borderRadius:3}}><div style={{width:`${Math.max(0,pct)}%`,height:"100%",background:COLORS[i%COLORS.length],borderRadius:3}}/></div>
              {isExpanded&&<div style={{marginTop:10,marginLeft:38,borderLeft:`2px solid ${COLORS[i%COLORS.length]}33`,paddingLeft:14}}>
                {subSorted.map(([sub,subTotal])=>{
                  const subPct=Math.abs(total)>0?((subTotal/Math.abs(total))*100).toFixed(0):0
                  return(
                    <div key={sub} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:13,color:"var(--text-secondary)"}}>{sub}</span>
                        <span style={{fontSize:11,color:subTotal<0?"#4ade80":"#475569"}}>{subPct}%</span>
                      </div>
                      <span style={{fontSize:14,fontWeight:600,color:subTotal<0?"#4ade80":"#cbd5e1",...mo}}>{subTotal<0?"-":""}{f$(subTotal)}</span>
                    </div>
                  )
                })}
              </div>}
            </div>
          )})}
        </>}
      </div>
    </div>
  )
}

// ══════════════ MONTH DETAIL ══════════════
function MonthDetail({monthKey:mk2,filterTipo,movimientos,cuentas,onBack}){
  const isInv=filterTipo==="inversion"
  const isUSDCuenta=id=>cuentas.find(c=>c.id===id)?.moneda==="USD"
  const allMonth=movimientos.filter(m=>monthOf(m.fecha)===mk2).sort((a,b)=>b.fecha.localeCompare(a.fecha)||(b.created_at||"").localeCompare(a.created_at||""))
  const me=isInv
    ?allMonth.filter(m=>m.tipo==="inversion"||(m.tipo==="egreso"&&m.categoria==="Inversiones"))
    :allMonth.filter(m=>m.tipo==="egreso"&&m.categoria!=="Inversiones")
  const mePesos=me.filter(e=>!isUSDCuenta(e.cuenta_id))
  const meUSD=me.filter(e=>isUSDCuenta(e.cuenta_id))
  const totalPesos=mePesos.reduce((s,m)=>s+m.monto,0)
  const totalUSD=meUSD.reduce((s,m)=>s+m.monto,0)
  const totalInv=me.reduce((s,m)=>s+m.monto,0)
  const cuentaNombre=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const fmtMonth=k=>{const[y,m]=k.split("-");const ml=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];return`${ml[parseInt(m)-1]} ${y}`}

  return(
    <div className="page-inner">
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#60a5fa",fontSize:13,cursor:"pointer",marginBottom:16,padding:0}}><Ic d={IC.left} s={16}/> Dashboard</button>
      <div style={S.sec}>{isInv?"Inversiones":"Gastos"} — {fmtMonth(mk2)}</div>
      {isInv
        ?<div style={{...S.crdP,marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase"}}>Total inversiones</div>
            <div style={{fontSize:22,fontWeight:700,color:"#f59e0b",...mo,marginTop:4}}>{f$(totalInv)}</div>
          </div>
        :<div style={{display:"grid",gridTemplateColumns:totalUSD>0?"1fr 1fr":"1fr",gap:10,marginBottom:20}}>
            <div style={{...S.crdP,textAlign:"center"}}>
              <div style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase"}}>Total pesos</div>
              <div style={{fontSize:20,fontWeight:700,color:"var(--text-primary)",...mo,marginTop:4}}>{f$(totalPesos)}</div>
            </div>
            {totalUSD>0&&<div style={{...S.crdP,textAlign:"center",border:"1px solid rgba(52,211,153,.15)"}}>
              <div style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase"}}>Total USD</div>
              <div style={{fontSize:20,fontWeight:700,color:"#34d399",...mo,marginTop:4}}>{f$(totalUSD,true)}</div>
            </div>}
          </div>
      }
      <div style={S.crd}>
        {me.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Sin {isInv?"inversiones":"gastos"}</div>}
        {me.map((e,i)=>{
          const enUSD=isUSDCuenta(e.cuenta_id)
          return(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:i<me.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:13,color:"var(--text-primary)",fontWeight:500}}>{e.subcategoria||e.categoria}</span>
                {enUSD&&<span style={{fontSize:9,fontWeight:700,color:"#34d399",background:"rgba(52,211,153,.12)",padding:"2px 5px",borderRadius:4}}>USD</span>}
              </div>
              <div style={{fontSize:11,color:"var(--text-muted)"}}>{e.fecha} · {e.categoria} · {cuentaNombre(e.cuenta_id)}</div>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:isInv?"#f59e0b":e.monto<0?"#4ade80":"#f87171",...mo}}>
              {isInv?"📈":e.monto<0?"+":"-"}{f$(Math.abs(e.monto),enUSD)}
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}

// ══════════════ DEUDA ══════════════
function DebtPage({deuda}){
  const hist=[...deuda].sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.created_at||"").localeCompare(b.created_at||""))
  const getMontoUSD=e=>e.monto_usd!=null?e.monto_usd:e.monto
  // Calcular saldo corrido dinámicamente para evitar errores en saldo_usd almacenado en DB
  let runSaldo=0
  const histConSaldo=hist.map(e=>{runSaldo+=getMontoUSD(e);return{...e,_saldo:runSaldo}})
  const saldoUSD=runSaldo
  const totalPrestadoUSD=hist.filter(e=>getMontoUSD(e)>0).reduce((s,p)=>s+getMontoUSD(p),0)
  const totalPagadoUSD=Math.abs(hist.filter(e=>getMontoUSD(e)<0).reduce((s,p)=>s+getMontoUSD(p),0))

  return(
    <div className="page-inner">
      <div style={S.sec}>Deuda Edgardo</div>
      <div style={{background:"linear-gradient(135deg,#450a0a 0%,#991b1b 100%)",borderRadius:24,padding:32,marginBottom:24,border:"1px solid rgba(239,68,68,.2)",textAlign:"center",boxShadow:"0 8px 40px rgba(153,27,27,.2)"}}>
        <div style={{fontSize:14,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:3,marginBottom:12,fontWeight:600}}>Saldo Actual</div>
        <div style={{fontSize:44,fontWeight:800,color:"#fca5a5",...mo,letterSpacing:-1}}>{f$(saldoUSD,true)}</div>
        <div style={{display:"flex",justifyContent:"center",gap:48,marginTop:24}}>
          <div><div style={{fontSize:13,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Prestado</div><div style={{fontSize:22,fontWeight:700,color:"#ef4444",...mo}}>{f$(totalPrestadoUSD,true)}</div></div>
          <div><div style={{fontSize:13,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Pagado</div><div style={{fontSize:22,fontWeight:700,color:"#4ade80",...mo}}>{f$(totalPagadoUSD,true)}</div></div>
        </div>
      </div>
      <div style={{...S.crdP,marginBottom:16,background:"#0f1724",border:"1px solid rgba(255,255,255,.03)"}}><div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6}}>Los pagos se cargan desde <span style={{color:"#60a5fa"}}>Cargar → Egreso → Pago deuda → Edgardo</span>. Indicá el TC Dólar para la conversión.</div></div>
      <div style={S.crd}>
        <div style={{display:"flex",padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",gap:8}}>
          <div style={{flex:1,fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",fontWeight:600}}>Descripción</div>
          <div style={{width:90,textAlign:"center",fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",fontWeight:600}}>Pesos</div>
          <div style={{width:90,textAlign:"center",fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",fontWeight:600}}>USD</div>
          <div style={{width:80,textAlign:"center",fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",fontWeight:600}}>Saldo USD</div>
        </div>
        <div style={{maxHeight:500,overflowY:"auto"}}>
          {[...histConSaldo].reverse().map((e)=>{
            const montoUSD=getMontoUSD(e)
            const sUSD=e._saldo
            return(
            <div key={e.id} style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.02)",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:"var(--text-primary)",fontWeight:500}}>{e.descripcion}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{e.fecha}{e.tc_dolar?` · TC ${f$(e.tc_dolar)}`:""}</div>
              </div>
              <div style={{width:90,textAlign:"center",fontSize:14,fontWeight:600,color:"var(--text-muted)",...mo}}>—</div>
              <div style={{width:90,textAlign:"center",fontSize:14,fontWeight:600,color:montoUSD>0?"#f87171":"#4ade80",...mo}}>{montoUSD>0?"+":""}{f$(montoUSD,true)}</div>
              <div style={{width:80,textAlign:"center",fontSize:13,color:"var(--text-secondary)",...mo}}>{f$(sUSD,true)}</div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}

// ══════════════ MOVIMIENTOS ══════════════
function MovimientosPage({movimientos,cuentas,onSaved}){
  const[selMonth,setSelMonth]=useState(monthOf(today()))
  const[filterTipo,setFilterTipo]=useState("")
  const[filterCat,setFilterCat]=useState("")
  const[filterSub,setFilterSub]=useState("")
  const[filterCuenta,setFilterCuenta]=useState("")
  const[filterFrom,setFilterFrom]=useState("")
  const[filterTo,setFilterTo]=useState("")
  const[searched,setSearched]=useState(false)
  const[editId,setEditId]=useState(null)
  const[editForm,setEditForm]=useState({})
  const[showIngDet,setShowIngDet]=useState(false)
  const[page,setPage]=useState(0)
  const perPage=20
  const cuentaNombre=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const isUSDCuenta=id=>cuentas.find(c=>c.id===id)?.moneda==="USD"

  const allMonths=[...new Set(movimientos.map(m=>monthOf(m.fecha)))].sort().reverse()
  const fmtMonthFull=k=>{const[y,m]=k.split("-");const ml=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];return`${ml[parseInt(m)-1]} ${y}`}

  const prevMonth=(k)=>{const[y,m]=k.split("-").map(Number);const pm=m===1?12:m-1;const py=m===1?y-1:y;return`${py}-${String(pm).padStart(2,"0")}`}

  let filtered=movimientos.filter(m=>monthOf(m.fecha)===selMonth)
  if(searched){
    if(filterTipo) filtered=filtered.filter(m=>m.tipo===filterTipo)
    if(filterCat) filtered=filtered.filter(m=>m.categoria===filterCat)
    if(filterSub) filtered=filtered.filter(m=>(m.subcategoria||"")=== filterSub)
    if(filterCuenta) filtered=filtered.filter(m=>m.cuenta_id===filterCuenta)
    if(filterFrom) filtered=filtered.filter(m=>m.fecha>=filterFrom)
    if(filterTo) filtered=filtered.filter(m=>m.fecha<=filterTo)
  }
  filtered.sort((a,b)=>b.fecha.localeCompare(a.fecha)||(b.created_at||"").localeCompare(a.created_at||""))

  const cats=[...new Set(movimientos.filter(m=>monthOf(m.fecha)===selMonth&&(!filterTipo||m.tipo===filterTipo)).map(m=>m.categoria))].sort()
  const subs=[...new Set(movimientos.filter(m=>monthOf(m.fecha)===selMonth&&(!filterTipo||m.tipo===filterTipo)&&(!filterCat||m.categoria===filterCat)&&m.subcategoria).map(m=>m.subcategoria))].sort()
  const egresosFiltrados=filtered.filter(m=>m.tipo==="egreso")
  const totalEgresos=egresosFiltrados.filter(m=>!isUSDCuenta(m.cuenta_id)).reduce((s,m)=>s+m.monto,0)
  const totalEgresosUSD=egresosFiltrados.filter(m=>isUSDCuenta(m.cuenta_id)).reduce((s,m)=>s+m.monto,0)
  const totalInversiones=filtered.filter(m=>m.tipo==="inversion").reduce((s,m)=>s+m.monto,0)
  const totalIngresosUSD=filtered.filter(m=>m.tipo==="ingreso"&&isUSDCuenta(m.cuenta_id)).reduce((s,m)=>s+m.monto,0)

  const prevMk=prevMonth(selMonth)
  const allThisMonth=movimientos.filter(m=>monthOf(m.fecha)===selMonth)
  const dayNM=d=>parseInt((d||"").split("-")[2],10)
  // Sueldos del mes anterior cobrados después del día 15 → cuentan para este mes
  const sueldosPrevForThis=movimientos.filter(m=>monthOf(m.fecha)===prevMk&&m.tipo==="ingreso"&&m.categoria==="Sueldo"&&dayNM(m.fecha)>15)
  const sueldoPrevMonth=sueldosPrevForThis.reduce((s,m)=>s+m.monto,0)
  // Ingresos de este mes: todos excepto sueldos después del día 15 (esos son del mes siguiente)
  const ingresosThisItems=allThisMonth.filter(m=>m.tipo==="ingreso"&&(m.categoria!=="Sueldo"||dayNM(m.fecha)<=15))
  const ingresosThisMonth=ingresosThisItems.reduce((s,m)=>s+m.monto,0)
  const totalIngresos=sueldoPrevMonth+ingresosThisMonth
  const saldoDelMes=totalIngresos-totalEgresos-totalInversiones
  const ingresoDesglose=[...sueldosPrevForThis.map(m=>({label:`Sueldo mes ant. (${m.fecha})`,monto:m.monto})),...ingresosThisItems.map(m=>({label:`${m.subcategoria||m.categoria} (${m.fecha})`,monto:m.monto}))]

  const startEdit=(e)=>{setEditId(e.id);setEditForm({fecha:e.fecha,tipo:e.tipo,categoria:e.categoria,subcategoria:e.subcategoria||"",monto:e.monto,cuenta_id:e.cuenta_id,nota:e.nota||""})}
  const cancelEdit=()=>{setEditId(null);setEditForm({})}
  const saveEdit=async()=>{
    const orig=movimientos.find(m=>m.id===editId)
    const newMonto=parseFloat(editForm.monto)
    const newCuentaId=editForm.cuenta_id
    const cuentaChanged=newCuentaId!==orig.cuenta_id
    // Reverse old effect on original account
    if(orig?.cuenta_id){
      const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",orig.cuenta_id).single()
      if(fresh){
        const reversal=orig.tipo==="egreso"?orig.monto:orig.tipo==="ingreso"?-orig.monto:0
        const newDelta=cuentaChanged?0:(editForm.tipo==="egreso"?-newMonto:editForm.tipo==="ingreso"?newMonto:0)
        if(reversal!==0||newDelta!==0)
          await supabase.from("cuentas").update({saldo:fresh.saldo+reversal+newDelta}).eq("id",orig.cuenta_id)
      }
    }
    // If account changed, apply new effect on new account
    if(cuentaChanged){
      const{data:freshNew}=await supabase.from("cuentas").select("saldo").eq("id",newCuentaId).single()
      if(freshNew){
        const newDelta=editForm.tipo==="egreso"?-newMonto:editForm.tipo==="ingreso"?newMonto:0
        if(newDelta!==0)
          await supabase.from("cuentas").update({saldo:freshNew.saldo+newDelta}).eq("id",newCuentaId)
      }
    }
    await supabase.from("movimientos").update({fecha:editForm.fecha,tipo:editForm.tipo,categoria:editForm.categoria,subcategoria:editForm.subcategoria||null,monto:newMonto,cuenta_id:newCuentaId,nota:editForm.nota||null}).eq("id",editId)
    setEditId(null);setEditForm({});onSaved()
  }
  const deleteRow=async(id)=>{
    if(!confirm("¿Eliminar este movimiento?"))return
    // Find the movement to reverse its saldo impact
    const mov=movimientos.find(m=>m.id===id)
    if(mov&&mov.cuenta_id){
      // Compra USD (inversion con cuenta_destino_id): revierte ambas cuentas
      if(mov.tipo==="inversion"&&mov.cuenta_destino_id){
        const{data:freshFrom}=await supabase.from("cuentas").select("saldo").eq("id",mov.cuenta_id).single()
        if(freshFrom) await supabase.from("cuentas").update({saldo:freshFrom.saldo+mov.monto}).eq("id",mov.cuenta_id)
        const tcMatch=mov.detalle?.match(/TC:([\d.]+)/)
        if(tcMatch){
          const tc=parseFloat(tcMatch[1])
          const importeUSD=mov.monto/tc
          const{data:freshDest}=await supabase.from("cuentas").select("saldo").eq("id",mov.cuenta_destino_id).single()
          if(freshDest) await supabase.from("cuentas").update({saldo:freshDest.saldo-importeUSD}).eq("id",mov.cuenta_destino_id)
        }
      } else {
        const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",mov.cuenta_id).single()
        if(fresh){
          let reversal=0
          if(mov.tipo==="egreso") reversal=mov.monto  // egreso was -monto, so add it back
          else if(mov.tipo==="ingreso") reversal=-mov.monto  // ingreso was +monto, so subtract
          if(reversal!==0) await supabase.from("cuentas").update({saldo:fresh.saldo+reversal}).eq("id",mov.cuenta_id)
        }
        // If traspaso, also reverse the destination
        if(mov.tipo==="traspaso"&&mov.cuenta_destino_id){
          const{data:freshDest}=await supabase.from("cuentas").select("saldo").eq("id",mov.cuenta_destino_id).single()
          if(freshDest) await supabase.from("cuentas").update({saldo:freshDest.saldo-mov.monto}).eq("id",mov.cuenta_destino_id)
        }
      }
    }
    await supabase.from("movimientos").delete().eq("id",id);onSaved()
  }

  const doSearch=()=>{setSearched(true);setPage(0)}
  const clearFilters=()=>{setFilterTipo("");setFilterCat("");setFilterSub("");setFilterCuenta("");setFilterFrom("");setFilterTo("");setSearched(false);setPage(0)}

  return(
    <div className="page-inner">
      <div style={S.sec}>Movimientos</div>

      <div style={{marginBottom:16}}>
        <select value={selMonth} onChange={e=>{setSelMonth(e.target.value);setSearched(false);setPage(0)}} style={{...S.inp,fontSize:16,fontWeight:600}}>
          {allMonths.map(m=><option key={m} value={m}>{fmtMonthFull(m)}</option>)}
        </select>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
        <div style={{...S.crdP,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",cursor:"pointer"}} onClick={()=>setShowIngDet(v=>!v)}>
          <div style={{fontSize:11,color:"#4ade80",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Ingresos ▾</div>
          <div style={{fontSize:18,fontWeight:700,color:"#4ade80",...mo}}>{f$(totalIngresos)}</div>
        </div>
        <div style={{...S.crdP,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"}}>
          <div style={{fontSize:11,color:"#f87171",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Egresos $</div>
          <div style={{fontSize:18,fontWeight:700,color:totalEgresos<0?"#4ade80":"#f87171",...mo}}>{totalEgresos<0?"+":"-"}{f$(Math.abs(totalEgresos))}</div>
        </div>
        {(()=>{const saldoMes=totalIngresos-totalEgresos;const pos=saldoMes>=0;return(
        <div style={{...S.crdP,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",border:`1px solid ${pos?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`,background:pos?"rgba(74,222,128,.04)":"rgba(248,113,113,.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{fontSize:11,color:pos?"#4ade80":"#f87171",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Saldo del Mes</div>
            <span style={{fontSize:13}}>{pos?"📈":"📉"}</span>
          </div>
          <div style={{fontSize:18,fontWeight:700,color:pos?"#4ade80":"#f87171",...mo}}>{pos?"+":""}{f$(saldoMes)}</div>
        </div>
        )})()}
        <div style={{...S.crdP,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",border:"1px solid rgba(248,113,113,.15)"}}>
          <div style={{fontSize:11,color:"#f87171",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Egresos USD</div>
          <div style={{fontSize:18,fontWeight:700,color:totalEgresosUSD<0?"#4ade80":"#f87171",...mo}}>{totalEgresosUSD<0?"+":"-"}{f$(Math.abs(totalEgresosUSD),true)}</div>
        </div>
        <div style={{...S.crdP,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",border:"1px solid rgba(245,158,11,.15)"}}>
          <div style={{fontSize:11,color:"#f59e0b",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Inversiones</div>
          <div style={{fontSize:18,fontWeight:700,color:"#f59e0b",...mo}}>-{f$(Math.abs(totalInversiones))}</div>
        </div>
        <div style={{...S.crdP,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",border:`1px solid ${saldoDelMes>=0?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`}}>
          <div style={{fontSize:11,color:saldoDelMes>=0?"#4ade80":"#f87171",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Saldo del mes</div>
          <div style={{fontSize:18,fontWeight:700,color:saldoDelMes>=0?"#4ade80":"#f87171",...mo}}>{saldoDelMes>=0?"+":""}{f$(saldoDelMes)}</div>
        </div>
        {totalIngresosUSD>0&&<div style={{...S.crdP,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",border:"1px solid rgba(74,222,128,.15)"}}>
          <div style={{fontSize:11,color:"#4ade80",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Ingresos USD</div>
          <div style={{fontSize:18,fontWeight:700,color:"#4ade80",...mo}}>+{f$(Math.abs(totalIngresosUSD),true)}</div>
        </div>}
      </div>
      {showIngDet&&<div style={{...S.crdP,marginBottom:12,marginTop:-12}}>
        {ingresoDesglose.map((d,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:13}}>
          <span style={{color:"var(--text-secondary)"}}>{d.label}</span>
          <span style={{color:"#4ade80",fontWeight:600,...mo}}>{f$(d.monto)}</span>
        </div>)}
      </div>}

      <div style={{...S.crdP,marginBottom:20}}>
        <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Filtros</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
          {[{v:"",l:"Todos"},{v:"egreso",l:"Egresos"},{v:"ingreso",l:"Ingresos"},{v:"traspaso",l:"Traspasos"},{v:"inversion",l:"Inversiones"}].map(t=>(
            <button key={t.v} onClick={()=>setFilterTipo(t.v)} style={{padding:"7px 12px",borderRadius:10,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",
              background:filterTipo===t.v?(t.v==="egreso"?"#dc2626":t.v==="ingreso"?"#16a34a":t.v==="traspaso"?"#3b82f6":t.v==="inversion"?"#f59e0b":"#3b82f6"):"rgba(255,255,255,.04)",
              color:filterTipo===t.v?"#fff":"#64748b"}}>{t.l}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <label style={S.lbl}>Categoría</label>
            <select value={filterCat} onChange={e=>{setFilterCat(e.target.value);setFilterSub("")}} style={{...S.inp,fontSize:12}}>
              <option value="">Todas</option>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Subcategoría</label>
            <select value={filterSub} onChange={e=>setFilterSub(e.target.value)} style={{...S.inp,fontSize:12}}>
              <option value="">Todas</option>
              {subs.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:6}}>
          <label style={S.lbl}>Cuenta</label>
          <select value={filterCuenta} onChange={e=>setFilterCuenta(e.target.value)} style={{...S.inp,fontSize:13}}>
            <option value="">Todas</option>
            {cuentas.map(c=><option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div style={{minWidth:0}}>
            <label style={S.lbl}>Desde</label>
            <input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} style={{...S.inp,fontSize:12,display:"block",width:"100%",WebkitAppearance:"none"}}/>
          </div>
          <div style={{minWidth:0}}>
            <label style={S.lbl}>Hasta</label>
            <input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} style={{...S.inp,fontSize:12,display:"block",width:"100%",WebkitAppearance:"none"}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={doSearch} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff"}}>Buscar</button>
          {searched&&<button onClick={clearFilters} style={{padding:"10px 16px",borderRadius:10,border:"none",fontSize:12,cursor:"pointer",background:"#1e293b",color:"var(--text-secondary)"}}>Limpiar</button>}
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,color:"var(--text-muted)"}}>{filtered.length} movimientos</div>
        {filtered.length>perPage&&<div style={{fontSize:12,color:"var(--text-muted)"}}>Pág {page+1} de {Math.ceil(filtered.length/perPage)}</div>}
      </div>

      <div style={S.crd}>
        {filtered.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--text-muted)",fontSize:14}}>Sin movimientos</div>}
        {filtered.slice(page*perPage,(page+1)*perPage).map((e,i)=>(
          editId===e.id?
          <div key={e.id} style={{padding:14,borderBottom:"1px solid rgba(255,255,255,.04)",background:"rgba(59,130,246,.05)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div style={{minWidth:0,overflow:"hidden"}}><input type="date" value={editForm.fecha} onChange={ev=>setEditForm(f=>({...f,fecha:ev.target.value}))} style={{...S.inp,fontSize:12,maxWidth:"100%",width:"100%"}}/></div>
              <input type="text" inputMode="decimal" value={editForm.monto} onChange={ev=>setEditForm(f=>({...f,monto:ev.target.value}))} style={{...S.inp,fontSize:12,...mo}} placeholder="Monto (-10000 = devolución)"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <select value={editForm.tipo} onChange={ev=>setEditForm(f=>({...f,tipo:ev.target.value}))} style={{...S.inp,fontSize:12}}>
                <option value="egreso">Egreso</option>
                <option value="ingreso">Ingreso</option>
                <option value="traspaso">Traspaso</option>
                <option value="inversion">Inversión</option>
              </select>
              <select value={editForm.cuenta_id||""} onChange={ev=>setEditForm(f=>({...f,cuenta_id:ev.target.value}))} style={{...S.inp,fontSize:12}}>
                {cuentas.map(c=><option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input value={editForm.categoria} onChange={ev=>setEditForm(f=>({...f,categoria:ev.target.value}))} style={{...S.inp,fontSize:12}} placeholder="Categoría"/>
              <input value={editForm.subcategoria} onChange={ev=>setEditForm(f=>({...f,subcategoria:ev.target.value}))} style={{...S.inp,fontSize:12}} placeholder="Detalle"/>
            </div>
            <textarea value={editForm.nota||""} onChange={ev=>setEditForm(f=>({...f,nota:ev.target.value}))} placeholder="Nota adicional" rows={2} style={{...S.inp,fontSize:12,resize:"vertical",lineHeight:1.5,marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={saveEdit} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff"}}>Guardar</button>
              <button onClick={cancelEdit} style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#1e293b",color:"var(--text-secondary)"}}>Cancelar</button>
              <button onClick={()=>deleteRow(e.id)} style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#7f1d1d",color:"#f87171"}}>Eliminar</button>
            </div>
          </div>
          :<div key={e.id} style={{display:"flex",alignItems:"center",padding:"10px 12px",borderBottom:i<filtered.length-1?"1px solid rgba(255,255,255,.04)":"none",gap:8,overflow:"hidden"}}>
            <div style={{width:32,height:32,borderRadius:8,background:`${catColor(e.categoria)}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{catIcon(e.categoria)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:"var(--text-primary)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.subcategoria||e.categoria}</div>
              <div style={{fontSize:10,color:"var(--text-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.fecha?.slice(5)||""} · {cuentaNombre(e.cuenta_id)}{e.tc?` · ${e.tc}`:""}</div>
              {e.nota&&<div style={{fontSize:10,color:"#60a5fa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>📝 {e.nota}</div>}
            </div>
            {(()=>{
              const enUSD=isUSDCuenta(e.cuenta_id)
              const devolucion=e.tipo==="egreso"&&e.monto<0
              const col=e.tipo==="ingreso"||devolucion?"#4ade80":e.tipo==="traspaso"?"#60a5fa":"#f87171"
              const sign=e.tipo==="ingreso"||devolucion?"+":e.tipo==="egreso"?"-":"↔"
              return <div style={{fontSize:14,fontWeight:700,color:col,...mo,whiteSpace:"nowrap",flexShrink:0,marginLeft:4}}>{sign}{f$(Math.abs(parseFloat(e.monto)||0),enUSD)}</div>
            })()}
            <button onClick={()=>startEdit(e)} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:2,flexShrink:0}}><Ic d={IC.edit} s={12}/></button>
          </div>
        ))}
      </div>
      {filtered.length>perPage&&<div style={{display:"flex",justifyContent:"center",gap:8,marginTop:16}}>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:"10px 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:page===0?"default":"pointer",background:page===0?"#0f1623":"#1e293b",color:page===0?"#334155":"#94a3b8"}}>← Anterior</button>
        <button onClick={()=>setPage(p=>Math.min(Math.ceil(filtered.length/perPage)-1,p+1))} disabled={(page+1)*perPage>=filtered.length} style={{padding:"10px 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:(page+1)*perPage>=filtered.length?"default":"pointer",background:(page+1)*perPage>=filtered.length?"#0f1623":"#1e293b",color:(page+1)*perPage>=filtered.length?"#334155":"#94a3b8"}}>Siguiente →</button>
      </div>}
    </div>
  )
}

// ══════════════ EXTRACTO (PDF PARSER REAL) ══════════════
function ExtractPage({cuentas,userId,onSaved,egresoCats,egresoSubs}){
  const lsGet=(key,def)=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):def}catch{return def}}
  const[visaItems,setVisaItems]=useState(()=>lsGet("extracto_visa_items",[]))
  const[masterItems,setMasterItems]=useState(()=>lsGet("extracto_master_items",[]))
  const[visaVto,setVisaVto]=useState(()=>lsGet("extracto_visa_vto",""))
  const[masterVto,setMasterVto]=useState(()=>lsGet("extracto_master_vto",""))
  const[visaCuenta,setVisaCuenta]=useState("")
  const[masterCuenta,setMasterCuenta]=useState("")
  const[visaCuentaUSD,setVisaCuentaUSD]=useState("")
  const[masterCuentaUSD,setMasterCuentaUSD]=useState("")
  const[saving,setSaving]=useState("")
  const[done,setDone]=useState("")
  const visaRef=useRef(null)
  const masterRef=useRef(null)

  useEffect(()=>{localStorage.setItem("extracto_visa_items",JSON.stringify(visaItems))},[visaItems])
  useEffect(()=>{localStorage.setItem("extracto_master_items",JSON.stringify(masterItems))},[masterItems])
  useEffect(()=>{localStorage.setItem("extracto_visa_vto",JSON.stringify(visaVto))},[visaVto])
  useEffect(()=>{localStorage.setItem("extracto_master_vto",JSON.stringify(masterVto))},[masterVto])

  const clearExtract=(type)=>{
    localStorage.removeItem(`extracto_${type}_items`)
    localStorage.removeItem(`extracto_${type}_vto`)
    if(type==="visa"){setVisaItems([]);setVisaVto("");setVisaCuenta("");setVisaCuentaUSD("")}
    else{setMasterItems([]);setMasterVto("");setMasterCuenta("");setMasterCuentaUSD("")}
  }

  const MM={"Ene":"01","Feb":"02","Mar":"03","Abr":"04","May":"05","Jun":"06","Jul":"07","Ago":"08","Sep":"09","Oct":"10","Nov":"11","Dic":"12","Enero":"01","Febrero":"02","Marzo":"03","Abril":"04","Mayo":"05","Junio":"06","Julio":"07","Agosto":"08","Septiembre":"09","Octubre":"10","Noviembre":"11","Diciembre":"12","Noviem":"11","Diciem":"12","Setiem":"09"}
  const catMap={"SPOTIFY":"Apps","NETFLIX":"Apps","YOUTUBE":"Apps","GOOGLE":"Apps","APPLE":"Apps","LINKEDIN":"Apps","ADOBE":"Apps","OPENAI":"Apps","CLAUDE":"Apps","EMOVA":"Transporte","SUBTE":"Transporte","AUTOPISTA":"Auto","MAPFRE":"Auto","UBER":"Transporte","DIDI":"Transporte","RAPPI":"Compras","COTO":"Compras","DISCO":"Compras","SUPERMERCADO":"Compras","FARMACITY":"Compras","ZARA":"Compras","GRIMOLDI":"Compras","DEXTER":"Compras","NIKE":"Compras","ADIDAS":"Compras","MC DONALD":"Salidas","BURGER":"Salidas","RESTAURANT":"Salidas","GRILL":"Salidas","SUSHI":"Salidas","BIRRA":"Salidas","ALMIRO":"Salidas","ESTACIONAMIENTO":"Transporte","PARKING":"Transporte","CLUB ATLETICO BO":"Boca Juniors","SPORT CLUB":"Entrenamiento","TELEPEAJ":"Auto","VIALES":"Auto","AUBASA":"Auto","CODERHOUSE":"Estudios","PERSFLOW":"Departamento","URBA":"Auto","FUNDACIO":"Regalos","VIVARIUM":"Salidas"}
  const autoCat=desc=>{const u=desc.toUpperCase();for(const[k,v] of Object.entries(catMap)){if(u.includes(k))return v};return""}

  const parseMC=(text)=>{
    const vtoMatch=text.match(/Vencimiento\s+actual\s*:\s*(\d{2})\s*-\s*(\w+)\s*-\s*(\d{2})/)
    let vto=""
    if(vtoMatch){const[,d,m,y]=vtoMatch;vto=`20${y}-${MM[m]||"01"}-${d}`}
    const results=[];const lines=text.split("\n");let inSection=false
    const parseN=s=>{if(!s)return 0;return parseFloat(s.replace(/\./g,"").replace(",","."))}
    for(const line of lines){
      if(line.includes("COMPRAS DEL MES")||line.includes("DEBITOS AUTOMATICOS")||line.includes("CUOTAS DEL MES")||line.includes("COMPRAS/DEBITOS"))inSection=true
      if(line.includes("TOTAL TITULAR")||line.includes("INFORMACION INSTITUCIONAL"))break
      if(!inSection)continue
      // Try strict format: DD-Mmm-YY description cupon pesos [dolares]
      const m2=line.match(/(\d{2})\s*-\s*(\w{3})\s*-\s*(\d{2})\s+(.+?)\s+(\d{4,5})\s+([\d.,-]+)\s*([\d.,-]+)?/)
      if(m2){
        const desc=m2[4].trim();const pesos=parseN(m2[6]);const usd=parseN(m2[7])
        if(pesos!==0||usd!==0){const monto=Math.abs(pesos||usd);results.push({desc,pesos:pesos||0,usd:usd||0,monto,sub:"",status:"pending",cat:autoCat(desc)})}
        continue
      }
      // Looser format: just look for date + text + number
      const m3=line.match(/(\d{2})\s*-\s*(\w{3})\s*-\s*(\d{2})\s+(.+?)\s+([\d.,-]+)$/)
      if(m3){
        const desc=m3[4].trim();const pesos=parseN(m3[5])
        if(pesos!==0&&Math.abs(pesos)>1){const monto=Math.abs(pesos);results.push({desc,pesos,usd:0,monto,sub:"",status:"pending",cat:autoCat(desc)})}
      }
    }
    return{vto,results}
  }

  const parseVisa=(text)=>{
    const vtoMatch=text.match(/VENCIMIENTO\s+(\d{2})\s+(\w+)\.?\s+(\d{2})/)
    let vto=""
    if(vtoMatch){const[,d,m,y]=vtoMatch;vto=`20${y}-${MM[m]||"01"}-${d}`}
    const results=[];const lines=text.split("\n")
    const parseN=s=>{if(!s)return 0;return parseFloat(s.replace(/\./g,"").replace(",","."))}
    let inCharges=false;let gastosBancarios=0
    for(const line of lines){
      if(line.includes("Plan V:"))break
      // After total line, switch to collecting bank charges only
      if(line.includes("Total Consumos de")||line.includes("Tarjeta 5891")){inCharges=true;continue}
      if(inCharges){
        if(line.includes("IIBB PERCEP")||line.includes("IVA RG")||line.includes("DB.RG")){
          const mBank=line.match(/([\d.]+,\d{2})\s*$/)
          if(mBank)gastosBancarios+=parseN(mBank[1])
        }
        continue
      }
      if(line.includes("SALDO ANTERIOR")||line.includes("SU PAGO")||line.includes("DEV.")||line.includes("CANCEL")||line.includes("INTERESES FINANC"))continue
      // Visa format: YY Month DD comprobante type description [C.nn/nn] pesos [usd]
      const m2=line.match(/(\d{2})\s+(\w+\.?)\s+(\d{2})\s+(\d{5,6})\s+([*KVPU])\s+(.+?)\s+([\d.,-]+)\s*([\d,.]+)?$/)
      if(m2){
        const desc=m2[6].trim().replace(/\s+C\.\d+\/\d+$/,"");const pesos=parseN(m2[7]);const usd=parseN(m2[8])
        if(pesos!==0||usd!==0){const monto=pesos!==0?Math.abs(pesos):Math.abs(usd);results.push({desc,pesos:pesos||0,usd:usd||0,monto,sub:"",status:"pending",cat:autoCat(desc)})}
        continue
      }
      // Looser: YY Month DD comprobante description amount
      const m3=line.match(/(\d{2})\s+(\w+\.?)\s+(\d{2})\s+(\d{5,6})\s+(.+?)\s+([\d.,-]+)$/)
      if(m3){
        const desc=m3[5].trim().replace(/\s+C\.\d+\/\d+$/,"").replace(/^[*KVPU]\s+/,"");const pesos=parseN(m3[6])
        if(pesos!==0&&Math.abs(pesos)>1){const monto=Math.abs(pesos);results.push({desc,pesos,usd:0,monto,sub:"",status:"pending",cat:autoCat(desc)})}
        continue
      }
      // Continuation line: DD NNNNNN [*KVPU] DESCRIPTION AMOUNT [usd] (no year/month prefix)
      const m4=line.match(/^(\d{2})\s+(\d{5,6})\s+([*KVPU])\s+(.+?)\s+([\d.,-]+)(?:\s+([\d,.]+))?$/)
      if(m4){
        const desc=m4[4].trim().replace(/\s+C\.\d+\/\d+$/,"");const pesos=parseN(m4[5]);const usd=parseN(m4[6])
        if(pesos!==0||usd!==0){const monto=pesos!==0?Math.abs(pesos):Math.abs(usd);results.push({desc,pesos:pesos||0,usd:usd||0,monto,sub:"",status:"pending",cat:autoCat(desc)})}
      }
    }
    // Group bank charges as a single item at the end
    if(gastosBancarios>0)results.push({desc:"Impuestos y cargos bancarios",pesos:gastosBancarios,usd:0,monto:gastosBancarios,sub:"Impuestos e intereses",status:"pending",cat:"Gastos Tarjeta"})
    return{vto,results}
  }

  const handleFile=(type)=>async(e)=>{
    const file=e.target.files[0];if(!file)return
    const pdfjsLib=window.pdfjsLib
    if(!pdfjsLib){alert("PDF.js no cargó. Recargá la página e intentá de nuevo.");return}
    try{
      const arrayBuffer=await file.arrayBuffer()
      const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise
      let fullText=""
      for(let i=1;i<=pdf.numPages;i++){
        const pg=await pdf.getPage(i)
        const content=await pg.getTextContent()
        // Reconstruct lines using Y-coordinate - items on same Y = same line
        const lines={}
        content.items.forEach(item=>{
          const y=Math.round(item.transform[5]) // Y position
          if(!lines[y])lines[y]=""
          lines[y]+=item.str+" "
        })
        // Sort by Y descending (top of page = higher Y) and join
        const sorted=Object.entries(lines).sort((a,b)=>Number(b[0])-Number(a[0]))
        fullText+=sorted.map(([,text])=>text.trim()).join("\n")+"\n"
      }
      console.log("PDF extracted text preview:",fullText.substring(0,500))
      if(type==="visa"){const r=parseVisa(fullText);setVisaItems(r.results);setVisaVto(r.vto);if(r.results.length===0)alert("No se encontraron consumos de Visa en este PDF. Verificá que sea un resumen de Visa BAPRO.")}
      else{const r=parseMC(fullText);setMasterItems(r.results);setMasterVto(r.vto);if(r.results.length===0)alert("No se encontraron consumos de Mastercard en este PDF. Verificá que sea un resumen de Mastercard BAPRO.")}
    }catch(err){
      console.error("Error parsing PDF:",err)
      alert("Error al leer el PDF: "+err.message)
    }
    e.target.value=""
  }

  const setStatus=(type,i,s)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],status:s};return n})
  }
  const setCat=(type,i,c)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],cat:c,sub:""};return n})
  }
  const setSub=(type,i,s)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],sub:s};return n})
  }
  const setMonto=(type,i,v)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],monto:parseFloat(v)||0};return n})
  }
  const editDesc=(type,i,d)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],desc:d};return n})
  }

  const doConfirm=async(type,cuentaId,cuentaUSDId)=>{
    setSaving(type)
    const items=type==="visa"?visaItems:masterItems
    const vto=type==="visa"?visaVto:masterVto
    const tc=type==="visa"?"V":"M"
    const accepted=items.filter(p=>p.status==="accepted")
    const isUSD=p=>(p.usd||0)>0&&(p.pesos||0)===0
    const mkRow=(p,cid,enUSD)=>({user_id:userId,fecha:vto||today(),tipo:"egreso",categoria:p.cat||"Otros",subcategoria:p.sub||"",monto:Math.abs(enUSD?p.usd:(p.monto??p.pesos)),cuenta_id:cid,tc})
    const rowsPesos=accepted.filter(p=>!isUSD(p)&&(p.monto||p.pesos)!==0).map(p=>mkRow(p,cuentaId,false))
    const rowsUSD=accepted.filter(p=>isUSD(p)&&cuentaUSDId).map(p=>mkRow(p,cuentaUSDId,true))
    if(rowsPesos.length>0){
      await supabase.from("movimientos").insert(rowsPesos)
      const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",cuentaId).single()
      if(fresh){const delta=rowsPesos.reduce((s,r)=>s-r.monto,0);await supabase.from("cuentas").update({saldo:fresh.saldo+delta}).eq("id",cuentaId)}
    }
    if(rowsUSD.length>0){
      await supabase.from("movimientos").insert(rowsUSD)
      const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",cuentaUSDId).single()
      if(fresh){const delta=rowsUSD.reduce((s,r)=>s-r.monto,0);await supabase.from("cuentas").update({saldo:fresh.saldo+delta}).eq("id",cuentaUSDId)}
    }
    onSaved();setDone(type);setSaving("")
    setTimeout(()=>{setDone("");clearExtract(type)},2000)
  }

  const renderCard=(type,items,vto,setVto,fileRef,cuenta,setCuenta,cuentaUSD,setCuentaUSD)=>{
    const accepted=items.filter(p=>p.status==="accepted")
    const pending=items.filter(p=>p.status==="pending").length
    const isVisa=type==="visa"
    const color=isVisa?"#3b82f6":"#f59e0b"
    const label=isVisa?"VISA":"MASTERCARD"
    const isUSD=p=>(p.usd||0)>0&&(p.pesos||0)===0
    const hasUSDItems=items.some(isUSD)
    const acceptedPesos=accepted.filter(p=>!isUSD(p))
    const acceptedUSD=accepted.filter(isUSD)
    const totalAceptadoPesos=acceptedPesos.reduce((s,p)=>s+(p.monto??Math.abs(p.pesos)),0)
    const totalAceptadoUSD=acceptedUSD.reduce((s,p)=>s+Math.abs(p.usd),0)
    const canImputar=accepted.length>0&&cuenta&&(!acceptedUSD.length||cuentaUSD)

    return(
      <div style={{...S.crdP,marginBottom:20,border:`1px solid ${color}22`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700,color}}>{label}</div>
          {vto&&<div style={{fontSize:12,color:"var(--text-muted)"}}>Vto: {vto}</div>}
        </div>

        {items.length===0?<>
          <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={handleFile(type)} style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} style={{width:"100%",padding:20,borderRadius:14,border:`2px dashed ${color}33`,background:`${color}08`,color,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Ic d={IC.upload} s={20}/> Subir PDF {label}
          </button>
        </>:<>
          {vto&&<div style={{marginBottom:12}}><label style={S.lbl}>Fecha de débito</label><input type="date" value={vto} onChange={e=>setVto(e.target.value)} style={{...S.inp,fontSize:12}}/></div>}

          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1,textAlign:"center",padding:8,borderRadius:10,background:"rgba(245,158,11,.08)"}}>
              <div style={{fontSize:16,fontWeight:700,color:"#f59e0b",...mo}}>{pending}</div>
              <div style={{fontSize:10,color:"var(--text-muted)"}}>Pendientes</div>
            </div>
            <div style={{flex:1,textAlign:"center",padding:8,borderRadius:10,background:"rgba(74,222,128,.08)"}}>
              <div style={{fontSize:16,fontWeight:700,color:"#4ade80",...mo}}>{accepted.length}</div>
              <div style={{fontSize:10,color:"var(--text-muted)"}}>Aceptados</div>
            </div>
          </div>

          <div style={{maxHeight:480,overflowY:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,.04)"}}>
            {items.map((p,i)=>p.status==="rejected"?null:(
              <div key={i} style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.03)",background:p.status==="accepted"?"rgba(74,222,128,.03)":"transparent"}}>
                {/* Row 1: referencia + monto editable */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <input value={p.desc} onChange={e=>editDesc(type,i,e.target.value)} style={{...S.inp,fontSize:12,padding:"6px 10px",flex:1,background:"transparent"}} placeholder="Referencia"/>
                  <div style={{display:"flex",alignItems:"center",gap:2}}>
                    <span style={{fontSize:12,color:"#f87171",fontWeight:700}}>{isUSD(p)?"-USD":"-$"}</span>
                    <input
                      type="number"
                      value={p.monto??((p.usd||0)>0&&(p.pesos||0)===0?Math.abs(p.usd):Math.abs(p.pesos))}
                      onChange={e=>setMonto(type,i,e.target.value)}
                      style={{...S.inp,fontSize:13,fontWeight:700,color:"#f87171",padding:"5px 8px",width:110,textAlign:"right",...mo}}
                    />
                  </div>
                </div>
                {/* Row 2: categoría + subcategoría + botones */}
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <select value={p.cat} onChange={e=>setCat(type,i,e.target.value)} style={{...S.inp,fontSize:11,padding:"4px 8px",flex:1,color:p.cat?"#e2e8f0":"#475569"}}>
                    <option value="">Categoría...</option>
                    {(egresoCats||EGRESO_CATS).map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select value={p.sub||""} onChange={e=>setSub(type,i,e.target.value)} style={{...S.inp,fontSize:11,padding:"4px 8px",flex:1,color:p.sub?"#e2e8f0":"#475569"}}>
                    <option value="">Subcategoría...</option>
                    {((egresoSubs||EGRESO_SUBS)[p.cat]||[]).map(s=><option key={s}>{s}</option>)}
                  </select>
                  {p.status==="pending"?<>
                    <button onClick={()=>setStatus(type,i,"accepted")} style={{padding:"4px 10px",borderRadius:8,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff",flexShrink:0}}>✓</button>
                    <button onClick={()=>setStatus(type,i,"rejected")} style={{padding:"4px 10px",borderRadius:8,border:"none",fontSize:11,cursor:"pointer",background:"#7f1d1d",color:"#f87171",flexShrink:0}}>✗</button>
                  </>:<button onClick={()=>setStatus(type,i,"pending")} style={{padding:"4px 10px",borderRadius:8,border:"none",fontSize:11,cursor:"pointer",background:"#1e293b",color:"var(--text-secondary)",flexShrink:0}}>↩</button>}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: cuenta(s) selector + totales + imputar */}
          <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.06)"}}>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <label style={S.lbl}>Cuenta $ a debitar</label>
                <select value={cuenta} onChange={e=>setCuenta(e.target.value)} style={{...S.inp,fontSize:12,padding:"10px 12px"}}>
                  <option value="">Seleccionar...</option>
                  {cuentas.filter(c=>c.moneda!=="USD").map(c=><option key={c.id} value={c.id}>{c.nombre} (ARS)</option>)}
                </select>
              </div>
              {hasUSDItems&&<div style={{flex:1}}>
                <label style={S.lbl}>Cuenta USD a debitar</label>
                <select value={cuentaUSD} onChange={e=>setCuentaUSD(e.target.value)} style={{...S.inp,fontSize:12,padding:"10px 12px"}}>
                  <option value="">Seleccionar...</option>
                  {cuentas.filter(c=>c.moneda==="USD").map(c=><option key={c.id} value={c.id}>{c.nombre} (USD)</option>)}
                </select>
              </div>}
            </div>
            {accepted.length>0&&<>
              <div style={{borderRadius:10,background:"rgba(255,255,255,.02)",padding:"10px 12px",marginBottom:10}}>
                {acceptedPesos.length>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:acceptedUSD.length>0?6:0}}>
                  <span style={{fontSize:13,color:"var(--text-muted)"}}>{acceptedPesos.length} mov. en pesos</span>
                  <span style={{fontSize:14,fontWeight:700,color:"#f87171",...mo}}>-{f$(totalAceptadoPesos)}</span>
                </div>}
                {acceptedUSD.length>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,color:"var(--text-muted)"}}>{acceptedUSD.length} mov. en USD</span>
                  <span style={{fontSize:14,fontWeight:700,color:"#fb923c",...mo}}>-{f$(totalAceptadoUSD,true)}</span>
                </div>}
              </div>
              <button onClick={()=>doConfirm(type,cuenta,cuentaUSD)} disabled={saving===type||!canImputar} style={{width:"100%",padding:14,borderRadius:12,border:"none",fontSize:14,fontWeight:700,cursor:canImputar?"pointer":"not-allowed",background:done===type?"#16a34a":!canImputar?"#1e293b":`linear-gradient(135deg,${color},${isVisa?"#1d4ed8":"#b45309"})`,color:canImputar?"#fff":"#475569",opacity:saving===type?0.7:1}}>
                {done===type?"✓ Imputado":saving===type?"Guardando...":`Imputar ${accepted.length} movimiento${accepted.length!==1?"s":""}`}
              </button>
            </>}
            <button onClick={()=>clearExtract(type)} style={{marginTop:10,width:"100%",padding:10,borderRadius:10,border:"1px solid rgba(248,113,113,.2)",background:"transparent",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              Borrar extracto cargado
            </button>
          </div>
        </>}
      </div>
    )
  }

  return(
    <div className="page-inner">
      <div style={S.sec}>Importar Extractos de Tarjeta</div>
      <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:20}}>Subí cada PDF por separado. Revisá y aceptá concepto por concepto. Recién al confirmar se impactan en tus movimientos y saldos.</div>
      {renderCard("visa",visaItems,visaVto,setVisaVto,visaRef,visaCuenta,setVisaCuenta,visaCuentaUSD,setVisaCuentaUSD)}
      {renderCard("master",masterItems,masterVto,setMasterVto,masterRef,masterCuenta,setMasterCuenta,masterCuentaUSD,setMasterCuentaUSD)}
    </div>
  )
}

// ══════════════ ALERTAS ══════════════
function AlertasPage({userId,egresoCats,egresoSubs,ingresoCats}){
  const[alertas,setAlertas]=useState([])
  const[form,setForm]=useState({fecha:today(),hora:"09:00",categoria:"",subcategoria:"",importe:"",nota:"",frecuencia:"unica"})
  const[saving,setSaving]=useState(false)
  const[ok,setOk]=useState(false)
  const[editId,setEditId]=useState(null)
  const[editForm,setEditForm]=useState({})
  const[vista,setVista]=useState("inicio") // "inicio" | "crear" | "guardadas"
  const allCats=[...egresoCats,...ingresoCats]
  const subs=egresoSubs[form.categoria]||[]
  const editSubs=egresoSubs[editForm.categoria]||[]

  const load=async()=>{
    const{data}=await supabase.from("alertas").select("*").eq("user_id",userId).order("fecha").order("hora")
    setAlertas(data||[])
  }
  useEffect(()=>{load()},[])

  // Armar el texto de la notificación
  const buildNotifBody=(cat,sub,importe)=>{
    const nombre=sub||cat
    let txt=`Recordá que hoy tenés que hacer un pago: ${nombre}.`
    if(importe)txt+=`\nImporte: ${f$(parseFloat(importe))}.`
    return txt
  }

  // Programar notificación en OneSignal via Edge Function
  const scheduleNotif=async(fecha,hora,cat,sub,importe,frecuencia)=>{
    try{
      const subId=await OneSignal.User.PushSubscription.id
      if(!subId)return
      // send_after: fecha + hora en formato "YYYY-MM-DD HH:MM:SS GMT-0300"
      const horaStr=hora||"09:00"
      const send_after=frecuencia==="unica"?`${fecha} ${horaStr}:00 GMT-0300`:null
      const cuerpo=buildNotifBody(cat,sub,importe)
      await supabase.functions.invoke("onesignal-notify",{
        body:{subscription_id:subId,titulo:"MisGastos — Recordatorio de pago",cuerpo,send_after}
      })
    }catch(e){console.warn("OneSignal schedule error",e)}
  }

  const save=async()=>{
    if(!form.fecha||!form.categoria)return
    setSaving(true)
    // Pedir permiso si no está otorgado
    try{await OneSignal.Notifications.requestPermission()}catch(e){}
    await supabase.from("alertas").insert({
      user_id:userId,fecha:form.fecha,hora:form.hora||null,categoria:form.categoria,
      subcategoria:form.subcategoria||null,importe:form.importe?parseFloat(form.importe):null,
      nota:form.nota||null,frecuencia:form.frecuencia,
      dia_mes:form.frecuencia==="mensual"?parseInt(form.fecha.split("-")[2],10):null,activa:true,
    })
    await scheduleNotif(form.fecha,form.hora,form.categoria,form.subcategoria,form.importe,form.frecuencia)
    setOk(true);await load()
    setTimeout(()=>{setOk(false);setForm(f=>({...f,categoria:"",subcategoria:"",importe:"",nota:"",frecuencia:"unica"}));setVista("guardadas")},1200)
    setSaving(false)
  }

  const del=async(id)=>{
    if(!confirm("¿Eliminar esta alerta?"))return
    await supabase.from("alertas").delete().eq("id",id);load()
  }

  const startEdit=(a)=>{
    setEditId(a.id)
    setEditForm({fecha:a.fecha,hora:a.hora||"09:00",categoria:a.categoria,subcategoria:a.subcategoria||"",importe:a.importe||"",nota:a.nota||"",frecuencia:a.frecuencia||"unica"})
  }
  const saveEdit=async()=>{
    await supabase.from("alertas").update({
      fecha:editForm.fecha,hora:editForm.hora||null,categoria:editForm.categoria,
      subcategoria:editForm.subcategoria||null,importe:editForm.importe?parseFloat(editForm.importe):null,
      nota:editForm.nota||null,frecuencia:editForm.frecuencia,
      dia_mes:editForm.frecuencia==="mensual"?parseInt(editForm.fecha.split("-")[2],10):null,
    }).eq("id",editId)
    setEditId(null);setEditForm({});load()
  }

  const toggleActiva=async(a)=>{
    await supabase.from("alertas").update({activa:!a.activa}).eq("id",a.id);load()
  }

  const FREC={unica:"Una vez",diaria:"Diaria",semanal:"Semanal",mensual:"Mensual",anual:"Anual"}
  const fmtFecha=f=>{if(!f)return"";const[y,m,d]=f.split("-");const ml=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];return`${parseInt(d)} ${ml[parseInt(m)-1]} ${y}`}

  const Volver=()=><button onClick={()=>{setEditId(null);setVista("inicio")}} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#f59e0b",fontSize:13,cursor:"pointer",padding:0,marginBottom:20}}>
    <Ic d={IC.left} s={16}/> Volver
  </button>

  // ── INICIO ──
  if(vista==="inicio") return(
    <div className="page-inner">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <button onClick={()=>setVista("crear")} style={{...S.crdP,border:"none",cursor:"pointer",textAlign:"center",padding:28,display:"flex",flexDirection:"column",alignItems:"center",gap:10,background:"var(--card-bg)",borderRadius:20,border:"1px solid var(--card-border)"}}>
          <span style={{fontSize:32}}>➕</span>
          <span style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>Crear alerta</span>
        </button>
        <button onClick={()=>{load();setVista("guardadas")}} style={{...S.crdP,border:"none",cursor:"pointer",textAlign:"center",padding:28,display:"flex",flexDirection:"column",alignItems:"center",gap:10,background:"var(--card-bg)",borderRadius:20,border:"1px solid var(--card-border)",position:"relative"}}>
          <span style={{fontSize:32}}>🔔</span>
          <span style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>Alertas guardadas</span>
          {alertas.length>0&&<span style={{position:"absolute",top:10,right:10,background:"#f59e0b",color:"#000",borderRadius:20,fontSize:11,fontWeight:700,padding:"2px 8px"}}>{alertas.length}</span>}
        </button>
      </div>
    </div>
  )

  // ── CREAR ──
  if(vista==="crear") return(
    <div className="page-inner">
      <Volver/>
      <div style={{...S.crdP}}>
        <div style={{fontSize:13,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:16,fontWeight:700}}>Nueva Alerta</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{minWidth:0}}>
            <label style={S.lbl}>Fecha</label>
            <input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} style={{...S.inp,padding:"10px 8px",fontSize:13,boxSizing:"border-box",width:"100%",WebkitAppearance:"none"}}/>
          </div>
          <div style={{minWidth:0}}>
            <label style={S.lbl}>Hora</label>
            <input type="time" value={form.hora} onChange={e=>setForm(f=>({...f,hora:e.target.value}))} style={{...S.inp,padding:"10px 8px",fontSize:13,boxSizing:"border-box",width:"100%",WebkitAppearance:"none"}}/>
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <label style={S.lbl}>Recurrencia</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {Object.entries(FREC).map(([v,l])=><button key={v} onClick={()=>setForm(f=>({...f,frecuencia:v}))} style={S.btn(form.frecuencia===v,"#f59e0b")}>{l}</button>)}
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <label style={S.lbl}>Categoría <span style={{color:"#f87171"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {allCats.map(c=><button key={c} onClick={()=>setForm(f=>({...f,categoria:c,subcategoria:""}))} style={S.btn(form.categoria===c,"#f59e0b")}>{c}</button>)}
          </div>
        </div>

        {subs.length>0&&<div style={{marginBottom:12}}>
          <label style={S.lbl}>Subcategoría</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {subs.map(s=><button key={s} onClick={()=>setForm(f=>({...f,subcategoria:s}))} style={S.btn(form.subcategoria===s,"#a78bfa")}>{s}</button>)}
          </div>
        </div>}

        <div style={{marginBottom:12}}>
          <label style={S.lbl}>Importe (opcional)</label>
          <input type="text" inputMode="decimal" value={form.importe} onChange={e=>setForm(f=>({...f,importe:e.target.value}))} placeholder="Ej: 50000" style={{...S.inp,...mo}}/>
        </div>

        <div style={{marginBottom:20}}>
          <label style={S.lbl}>Nota adicional (opcional)</label>
          <textarea value={form.nota} onChange={e=>setForm(f=>({...f,nota:e.target.value}))} placeholder="Ej: Pagar antes de las 18hs" rows={2} style={{...S.inp,resize:"vertical",lineHeight:1.5}}/>
        </div>

        <button onClick={save} disabled={saving||!form.categoria} style={{width:"100%",padding:14,borderRadius:14,border:"none",fontSize:15,fontWeight:700,cursor:"pointer",background:ok?"#16a34a":"linear-gradient(135deg,#f59e0b,#b45309)",color:"#000",opacity:form.categoria?1:.4}}>
          {ok?"✓ Guardada":saving?"Guardando...":"Guardar alerta"}
        </button>
      </div>
    </div>
  )

  // ── GUARDADAS ──
  return(
    <div className="page-inner">
      <Volver/>
      {alertas.length===0&&<div style={{...S.crdP,textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Sin alertas guardadas.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {alertas.map(a=>(
          editId===a.id?
          <div key={a.id} style={{...S.crdP,border:"1px solid rgba(245,158,11,.35)"}}>
            <div style={{fontSize:12,color:"#f59e0b",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Editando alerta</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div style={{minWidth:0}}>
                <label style={S.lbl}>Fecha</label>
                <input type="date" value={editForm.fecha} onChange={e=>setEditForm(f=>({...f,fecha:e.target.value}))} style={{...S.inp,padding:"10px 8px",fontSize:13,boxSizing:"border-box",width:"100%",WebkitAppearance:"none"}}/>
              </div>
              <div style={{minWidth:0}}>
                <label style={S.lbl}>Hora</label>
                <input type="time" value={editForm.hora} onChange={e=>setEditForm(f=>({...f,hora:e.target.value}))} style={{...S.inp,padding:"10px 8px",fontSize:13,boxSizing:"border-box",width:"100%",WebkitAppearance:"none"}}/>
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <label style={S.lbl}>Recurrencia</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {Object.entries(FREC).map(([v,l])=><button key={v} onClick={()=>setEditForm(f=>({...f,frecuencia:v}))} style={S.btn(editForm.frecuencia===v,"#f59e0b")}>{l}</button>)}
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <label style={S.lbl}>Categoría</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {allCats.map(c=><button key={c} onClick={()=>setEditForm(f=>({...f,categoria:c,subcategoria:""}))} style={S.btn(editForm.categoria===c,"#f59e0b")}>{c}</button>)}
              </div>
            </div>
            {editSubs.length>0&&<div style={{marginBottom:10}}>
              <label style={S.lbl}>Subcategoría</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {editSubs.map(s=><button key={s} onClick={()=>setEditForm(f=>({...f,subcategoria:s}))} style={S.btn(editForm.subcategoria===s,"#a78bfa")}>{s}</button>)}
              </div>
            </div>}
            <input type="text" inputMode="decimal" value={editForm.importe} onChange={e=>setEditForm(f=>({...f,importe:e.target.value}))} placeholder="Importe (opcional)" style={{...S.inp,...mo,marginBottom:10}}/>
            <textarea value={editForm.nota||""} onChange={e=>setEditForm(f=>({...f,nota:e.target.value}))} placeholder="Nota adicional" rows={2} style={{...S.inp,resize:"vertical",lineHeight:1.5,marginBottom:14}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={saveEdit} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#f59e0b",color:"#000"}}>Guardar</button>
              <button onClick={()=>setEditId(null)} style={{padding:"10px 16px",borderRadius:10,border:"none",fontSize:13,cursor:"pointer",background:"var(--btn-bg)",color:"var(--text-secondary)"}}>Cancelar</button>
            </div>
          </div>
          :
          <div key={a.id} style={{...S.crdP,opacity:a.activa?1:.5}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{fontSize:24,flexShrink:0,marginTop:2}}>{catIcon(a.categoria)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:2}}>{a.subcategoria||a.categoria}</div>
                {a.subcategoria&&<div style={{fontSize:11,color:"var(--text-muted)",marginBottom:4}}>{a.categoria}</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:12,color:"#f59e0b",fontWeight:600}}>📅 {fmtFecha(a.fecha)}{a.hora?` · ${a.hora.slice(0,5)}`:""}</span>
                  <span style={{fontSize:10,background:"rgba(245,158,11,.15)",color:"#f59e0b",padding:"2px 8px",borderRadius:20,fontWeight:600}}>{FREC[a.frecuencia]||a.frecuencia}</span>
                </div>
                {a.importe&&<div style={{fontSize:13,fontWeight:700,color:"#4ade80",...mo}}>{f$(a.importe)}</div>}
                {a.nota&&<div style={{fontSize:11,color:"#60a5fa",marginTop:4}}>📝 {a.nota}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0,alignItems:"center"}}>
                <button onClick={()=>toggleActiva(a)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",padding:2}}>{a.activa?"🔔":"🔕"}</button>
                <button onClick={()=>startEdit(a)} style={{background:"none",border:"none",color:"#60a5fa",cursor:"pointer",padding:2}}><Ic d={IC.edit} s={16}/></button>
                <button onClick={()=>del(a.id)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:18,padding:2,fontWeight:700,lineHeight:1}}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════ ABM CONFIGURACIÓN ══════════════
function ABMPage({cuentas,userId,onSaved}){
  const[tab,setTab]=useState("cuentas")
  const[catEgreso,setCatEgreso]=useState([])
  const[subEgreso,setSubEgreso]=useState([])
  const[catIngreso,setCatIngreso]=useState([])
  const[tiposInv,setTiposInv]=useState([])
  const[newVal,setNewVal]=useState("")
  const[newSub,setNewSub]=useState("")
  const[selCatId,setSelCatId]=useState("")
  const[newCuenta,setNewCuenta]=useState({nombre:"",tieneARS:true,tieneUSD:false,saldoARS:"",saldoUSD:""})
  const[reasignModal,setReasignModal]=useState(null) // {id, nombre, destino}

  const loadABM=useCallback(async()=>{
    const[{data:ce},{data:se},{data:ci},{data:ti}]=await Promise.all([
      supabase.from("categorias_egreso").select("*").order("nombre"),
      supabase.from("subcategorias_egreso").select("*").order("nombre"),
      supabase.from("categorias_ingreso").select("*").order("nombre"),
      supabase.from("tipos_inversion").select("*").order("nombre"),
    ])
    setCatEgreso(ce||[]);setSubEgreso(se||[]);setCatIngreso(ci||[]);setTiposInv(ti||[])
  },[])

  useEffect(()=>{loadABM()},[loadABM])

  const addCatEgreso=async()=>{if(!newVal.trim())return;await supabase.from("categorias_egreso").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM();onSaved()}
  const delCatEgreso=async(id)=>{await supabase.from("categorias_egreso").delete().eq("id",id);loadABM();onSaved()}
  const addSubEgreso=async()=>{if(!newSub.trim()||!selCatId)return;await supabase.from("subcategorias_egreso").insert({user_id:userId,categoria_id:selCatId,nombre:newSub.trim()});setNewSub("");loadABM();onSaved()}
  const delSubEgreso=async(id)=>{await supabase.from("subcategorias_egreso").delete().eq("id",id);loadABM();onSaved()}
  const toggleFijo=async(id,current)=>{await supabase.from("subcategorias_egreso").update({es_fijo:!current}).eq("id",id);loadABM();onSaved()}
  const addCatIngreso=async()=>{if(!newVal.trim())return;await supabase.from("categorias_ingreso").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM();onSaved()}
  const delCatIngreso=async(id)=>{await supabase.from("categorias_ingreso").delete().eq("id",id);loadABM();onSaved()}
  const addTipoInv=async()=>{if(!newVal.trim())return;await supabase.from("tipos_inversion").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM();onSaved()}
  const delTipoInv=async(id)=>{await supabase.from("tipos_inversion").delete().eq("id",id);loadABM();onSaved()}
  const addCuenta=async()=>{
    const n=newCuenta.nombre.trim();if(!n)return
    if(!newCuenta.tieneARS&&!newCuenta.tieneUSD)return
    const rows=[]
    if(newCuenta.tieneARS)rows.push({user_id:userId,nombre:n,moneda:"ARS",saldo:parseFloat(newCuenta.saldoARS)||0})
    if(newCuenta.tieneUSD)rows.push({user_id:userId,nombre:n,moneda:"USD",saldo:parseFloat(newCuenta.saldoUSD)||0})
    await supabase.from("cuentas").insert(rows)
    setNewCuenta({nombre:"",tieneARS:true,tieneUSD:false,saldoARS:"",saldoUSD:""});onSaved()
  }
  const delCuenta=async(id,nombre)=>{
    if(!confirm("¿Eliminar esta cuenta?"))return
    const{error}=await supabase.from("cuentas").delete().eq("id",id)
    if(error){
      if(error.code==="23503"){
        // tiene movimientos — abrir modal de reasignación
        setReasignModal({id,nombre,destino:""})
      } else alert("Error al eliminar: "+error.message)
      return
    }
    onSaved()
  }
  const doReasign=async()=>{
    if(!reasignModal.destino)return
    // reasignar cuenta_id y cuenta_destino_id en movimientos
    await Promise.all([
      supabase.from("movimientos").update({cuenta_id:reasignModal.destino}).eq("cuenta_id",reasignModal.id),
      supabase.from("movimientos").update({cuenta_destino_id:reasignModal.destino}).eq("cuenta_destino_id",reasignModal.id),
    ])
    // ahora sí eliminar
    const{error}=await supabase.from("cuentas").delete().eq("id",reasignModal.id)
    if(error){alert("Error al eliminar: "+error.message);return}
    setReasignModal(null);onSaved()
  }
  const[editGrp,setEditGrp]=useState(null)
  const startEditGrp=g=>setEditGrp({
    nombre:g.nombre,arsId:g.ars?.id||null,usdId:g.usd?.id||null,
    nombre2:g.nombre,
    tieneARS:!!g.ars,tieneUSD:!!g.usd,
    saldoARS:g.ars?String(g.ars.saldo):"0",
    saldoUSD:g.usd?String(g.usd.saldo):"0"
  })
  const saveEditGrp=async()=>{
    const n=editGrp.nombre2.replace(/[\s\u00A0]+/g," ").trim();if(!n)return
    const ops=[]
    // ARS
    if(editGrp.tieneARS&&editGrp.arsId)
      ops.push(supabase.from("cuentas").update({nombre:n,saldo:parseFloat(editGrp.saldoARS)||0}).eq("id",editGrp.arsId))
    else if(editGrp.tieneARS&&!editGrp.arsId)
      ops.push(supabase.from("cuentas").insert({user_id:userId,nombre:n,moneda:"ARS",saldo:parseFloat(editGrp.saldoARS)||0}))
    else if(!editGrp.tieneARS&&editGrp.arsId)
      ops.push(supabase.from("cuentas").delete().eq("id",editGrp.arsId))
    // USD
    if(editGrp.tieneUSD&&editGrp.usdId)
      ops.push(supabase.from("cuentas").update({nombre:n,saldo:parseFloat(editGrp.saldoUSD)||0}).eq("id",editGrp.usdId))
    else if(editGrp.tieneUSD&&!editGrp.usdId)
      ops.push(supabase.from("cuentas").insert({user_id:userId,nombre:n,moneda:"USD",saldo:parseFloat(editGrp.saldoUSD)||0}))
    else if(!editGrp.tieneUSD&&editGrp.usdId)
      ops.push(supabase.from("cuentas").delete().eq("id",editGrp.usdId))
    await Promise.all(ops)
    setEditGrp(null);onSaved()
  }

  const tabs=[{id:"cuentas",l:"Cuentas"},{id:"egresos",l:"Egresos"},{id:"ingresos",l:"Ingresos"},{id:"inversiones",l:"Inversiones"}]
  const DelBtn=({fn})=><button onClick={fn} style={{background:"none",border:"none",color:"#7f1d1d",cursor:"pointer",padding:4,fontSize:16}}>×</button>

  return(
    <div className="page-inner">
      <div style={S.sec}>Configuración</div>

      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setNewVal("")}} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:tab===t.id?"#3b82f6":"#141c28",color:tab===t.id?"#fff":"#64748b"}}>{t.l}</button>)}
      </div>

      {tab==="cuentas"&&<>
        {/* Edit modal */}
        {editGrp&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#141c28",borderRadius:20,padding:24,width:"100%",maxWidth:360,border:"1px solid rgba(96,165,250,.2)"}}>
            <div style={{fontSize:15,fontWeight:700,color:"#60a5fa",marginBottom:16}}>Editar cuenta</div>
            <label style={S.lbl}>Nombre</label>
            <input value={editGrp.nombre2} onChange={e=>setEditGrp(p=>({...p,nombre2:e.target.value}))} style={{...S.inp,marginBottom:14}}/>
            <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Monedas</div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <label style={{display:"flex",alignItems:"center",gap:8,flex:1,padding:"10px 12px",borderRadius:10,background:editGrp.tieneARS?"rgba(96,165,250,.1)":"rgba(255,255,255,.02)",border:`1px solid ${editGrp.tieneARS?"rgba(96,165,250,.3)":"rgba(255,255,255,.06)"}`,cursor:"pointer"}}>
                <input type="checkbox" checked={editGrp.tieneARS} onChange={e=>setEditGrp(p=>({...p,tieneARS:e.target.checked}))} style={{accentColor:"#60a5fa"}}/>
                <span style={{fontSize:13,color:editGrp.tieneARS?"#60a5fa":"#64748b",fontWeight:600}}>Pesos $</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:8,flex:1,padding:"10px 12px",borderRadius:10,background:editGrp.tieneUSD?"rgba(52,211,153,.1)":"rgba(255,255,255,.02)",border:`1px solid ${editGrp.tieneUSD?"rgba(52,211,153,.3)":"rgba(255,255,255,.06)"}`,cursor:"pointer"}}>
                <input type="checkbox" checked={editGrp.tieneUSD} onChange={e=>setEditGrp(p=>({...p,tieneUSD:e.target.checked}))} style={{accentColor:"#34d399"}}/>
                <span style={{fontSize:13,color:editGrp.tieneUSD?"#34d399":"#64748b",fontWeight:600}}>USD</span>
              </label>
            </div>
            {editGrp.tieneARS&&<><label style={S.lbl}>Saldo $</label><input type="number" value={editGrp.saldoARS} onChange={e=>setEditGrp(p=>({...p,saldoARS:e.target.value}))} style={{...S.inp,...mo,marginBottom:12}}/></>}
            {editGrp.tieneUSD&&<><label style={S.lbl}>Saldo USD</label><input type="number" value={editGrp.saldoUSD} onChange={e=>setEditGrp(p=>({...p,saldoUSD:e.target.value}))} style={{...S.inp,...mo,marginBottom:14}}/></>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditGrp(null)} style={{flex:1,padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"var(--text-secondary)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveEditGrp} disabled={!editGrp.nombre2.trim()||(!editGrp.tieneARS&&!editGrp.tieneUSD)} style={{flex:1,padding:12,borderRadius:10,border:"none",background:"#3b82f6",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",opacity:(!editGrp.nombre2.trim()||(!editGrp.tieneARS&&!editGrp.tieneUSD))?.5:1}}>Guardar</button>
            </div>
          </div>
        </div>}
        <div style={S.crd}>
          {(()=>{
            const grps=[];const seen={}
            cuentas.forEach(c=>{
              const key=c.nombre.toLowerCase()
              if(!(key in seen)){seen[key]=grps.length;grps.push({nombre:c.nombre,ars:null,usd:null,extras:[]})}
              const idx=seen[key]
              if(c.moneda==="USD"){if(!grps[idx].usd)grps[idx].usd=c;else grps[idx].extras.push(c)}
              else{if(!grps[idx].ars)grps[idx].ars=c;else grps[idx].extras.push(c)}
            })
            return grps.map((g,i)=>(
              <div key={g.nombre} style={{borderBottom:i<grps.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px"}}>
                  <div>
                    <div style={{fontSize:15,color:"var(--text-primary)",fontWeight:500}}>{g.nombre}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2,display:"flex",gap:12}}>
                      {g.ars&&<span>{f$(g.ars.saldo)}</span>}
                      {g.usd&&<span style={{color:"#34d399"}}>{f$(g.usd.saldo,true)}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    <button onClick={()=>startEditGrp(g)} style={{background:"none",border:"none",color:"#60a5fa",cursor:"pointer",padding:4,fontSize:13}}>✎</button>
                    {g.ars&&<DelBtn fn={()=>delCuenta(g.ars.id,g.nombre+" $")}/>}
                    {g.usd&&<DelBtn fn={()=>delCuenta(g.usd.id,g.nombre+" USD")}/>}
                  </div>
                </div>
                {g.extras.map(ex=>(
                  <div key={ex.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 16px 6px 32px",background:"rgba(239,68,68,.04)"}}>
                    <span style={{fontSize:11,color:"#f87171"}}>⚠ Duplicado {ex.moneda}: {f$(ex.saldo,ex.moneda==="USD")}</span>
                    <DelBtn fn={()=>delCuenta(ex.id,ex.nombre+" "+ex.moneda+" (duplicado)")}/>
                  </div>
                ))}
              </div>
            ))
          })()}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Nueva Cuenta</div>
          <input value={newCuenta.nombre} onChange={e=>setNewCuenta(p=>({...p,nombre:e.target.value}))} placeholder="Nombre (ej: Banco Provincia)" style={{...S.inp,marginBottom:12}}/>
          <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Monedas</div>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <label style={{display:"flex",alignItems:"center",gap:8,flex:1,padding:"10px 12px",borderRadius:10,background:newCuenta.tieneARS?"rgba(96,165,250,.1)":"rgba(255,255,255,.02)",border:`1px solid ${newCuenta.tieneARS?"rgba(96,165,250,.3)":"rgba(255,255,255,.06)"}`,cursor:"pointer"}}>
              <input type="checkbox" checked={newCuenta.tieneARS} onChange={e=>setNewCuenta(p=>({...p,tieneARS:e.target.checked}))} style={{accentColor:"#60a5fa"}}/>
              <span style={{fontSize:13,color:newCuenta.tieneARS?"#60a5fa":"#64748b",fontWeight:600}}>Pesos $</span>
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,flex:1,padding:"10px 12px",borderRadius:10,background:newCuenta.tieneUSD?"rgba(52,211,153,.1)":"rgba(255,255,255,.02)",border:`1px solid ${newCuenta.tieneUSD?"rgba(52,211,153,.3)":"rgba(255,255,255,.06)"}`,cursor:"pointer"}}>
              <input type="checkbox" checked={newCuenta.tieneUSD} onChange={e=>setNewCuenta(p=>({...p,tieneUSD:e.target.checked}))} style={{accentColor:"#34d399"}}/>
              <span style={{fontSize:13,color:newCuenta.tieneUSD?"#34d399":"#64748b",fontWeight:600}}>USD</span>
            </label>
          </div>
          {newCuenta.tieneARS&&<input type="number" value={newCuenta.saldoARS} onChange={e=>setNewCuenta(p=>({...p,saldoARS:e.target.value}))} placeholder="Saldo inicial $" style={{...S.inp,...mo,marginBottom:8}}/>}
          {newCuenta.tieneUSD&&<input type="number" value={newCuenta.saldoUSD} onChange={e=>setNewCuenta(p=>({...p,saldoUSD:e.target.value}))} placeholder="Saldo inicial USD" style={{...S.inp,...mo,marginBottom:8}}/>}
          <button onClick={addCuenta} disabled={!newCuenta.nombre.trim()||(!newCuenta.tieneARS&&!newCuenta.tieneUSD)} style={{width:"100%",padding:12,borderRadius:10,border:"none",fontSize:14,fontWeight:600,cursor:"pointer",background:"#3b82f6",color:"#fff",opacity:(!newCuenta.nombre.trim()||(!newCuenta.tieneARS&&!newCuenta.tieneUSD))?.5:1}}>Agregar Cuenta</button>
        </div>
      </>}

      {tab==="egresos"&&<>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"10px 12px",borderRadius:10,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.15)"}}>
          <span style={{fontSize:16,flexShrink:0}}>📌</span>
          <span style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.4}}>Tocá el 📌 de una subcategoría para marcarla como <span style={{color:"#fbbf24",fontWeight:600}}>Gasto Fijo</span>. Los gastos fijos aparecen en el Dashboard con proyección mensual.</span>
        </div>
        <div style={S.crd}>
          {catEgreso.map((c,i)=>{
            const subs=subEgreso.filter(s=>s.categoria_id===c.id)
            return(
              <div key={c.id} style={{borderBottom:i<catEgreso.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"}}>
                  <div style={{fontSize:15,color:"var(--text-primary)",fontWeight:600}}>{c.nombre}</div>
                  <DelBtn fn={()=>delCatEgreso(c.id)}/>
                </div>
                {subs.length>0&&<div style={{padding:"0 16px 8px",display:"flex",flexWrap:"wrap",gap:6}}>
                  {subs.map(s=>(
                    <span key={s.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px 4px 6px",borderRadius:12,background:s.es_fijo?"rgba(251,191,36,.1)":"#1e293b",border:`1px solid ${s.es_fijo?"rgba(251,191,36,.3)":"transparent"}`,fontSize:11,color:s.es_fijo?"#fbbf24":"#94a3b8"}}>
                      <button onClick={()=>toggleFijo(s.id,s.es_fijo)} title={s.es_fijo?"Quitar de Gastos Fijos":"Marcar como Gasto Fijo"} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:11,lineHeight:1,color:s.es_fijo?"#fbbf24":"#475569",flexShrink:0}}>📌</button>
                      {s.nombre}
                      <button onClick={()=>delSubEgreso(s.id)} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:12,padding:0,marginLeft:2}}>×</button>
                    </span>
                  ))}
                </div>}
              </div>
            )
          })}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Nueva Categoría</div>
          <div style={{display:"flex",gap:8}}>
            <input value={newVal} onChange={e=>setNewVal(e.target.value)} placeholder="Nombre categoría" style={{...S.inp,flex:1}}/>
            <button onClick={addCatEgreso} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#3b82f6",color:"#fff"}}>+</button>
          </div>
        </div>
        <div style={{...S.crdP,marginTop:12}}>
          <div style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Nueva Subcategoría</div>
          <select value={selCatId} onChange={e=>setSelCatId(e.target.value)} style={{...S.inp,marginBottom:8}}>
            <option value="">Elegir categoría padre...</option>
            {catEgreso.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div style={{display:"flex",gap:8}}>
            <input value={newSub} onChange={e=>setNewSub(e.target.value)} placeholder="Nombre subcategoría" style={{...S.inp,flex:1}}/>
            <button onClick={addSubEgreso} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#8b5cf6",color:"#fff"}}>+</button>
          </div>
        </div>
      </>}

      {tab==="ingresos"&&<>
        <div style={S.crd}>
          {catIngreso.map((c,i)=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:i<catIngreso.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
              <div style={{fontSize:15,color:"var(--text-primary)"}}>{c.nombre}</div>
              <DelBtn fn={()=>delCatIngreso(c.id)}/>
            </div>
          ))}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{display:"flex",gap:8}}>
            <input value={newVal} onChange={e=>setNewVal(e.target.value)} placeholder="Nueva categoría de ingreso" style={{...S.inp,flex:1}}/>
            <button onClick={addCatIngreso} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff"}}>+</button>
          </div>
        </div>
      </>}

      {tab==="inversiones"&&<>
        <div style={S.crd}>
          {tiposInv.map((t,i)=>(
            <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:i<tiposInv.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
              <div style={{fontSize:15,color:"var(--text-primary)"}}>{t.nombre}</div>
              <DelBtn fn={()=>delTipoInv(t.id)}/>
            </div>
          ))}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{display:"flex",gap:8}}>
            <input value={newVal} onChange={e=>setNewVal(e.target.value)} placeholder="Nuevo tipo de inversión" style={{...S.inp,flex:1}}/>
            <button onClick={addTipoInv} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#f59e0b",color:"#000"}}>+</button>
          </div>
        </div>
      </>}

      {/* Modal reasignación de movimientos */}
      {reasignModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:24}}>
          <div style={{...S.crdP,width:"100%",maxWidth:400}}>
            <div style={{fontSize:16,fontWeight:700,color:"var(--text-primary)",marginBottom:8}}>Cuenta con movimientos</div>
            <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16}}>
              <strong style={{color:"#f87171"}}>{reasignModal.nombre}</strong> tiene movimientos asociados.<br/>
              Elegí una cuenta destino para reasignarlos antes de eliminar.
            </p>
            <label style={S.lbl}>Reasignar movimientos a</label>
            <select value={reasignModal.destino} onChange={e=>setReasignModal(p=>({...p,destino:e.target.value}))} style={{...S.inp,marginBottom:20}}>
              <option value="">Elegir cuenta...</option>
              {cuentas.filter(c=>c.id!==reasignModal.id).map(c=>(
                <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>
              ))}
            </select>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setReasignModal(null)} style={{flex:1,padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:14}}>Cancelar</button>
              <button onClick={doReasign} disabled={!reasignModal.destino} style={{flex:1,padding:12,borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600,opacity:reasignModal.destino?1:.4}}>Reasignar y eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════ MAIN APP ══════════════
export default function App(){
  const[user,setUser]=useState(null)
  const[loading,setLoading]=useState(true)
  const[pg,setPg]=useState("home")
  const[menuOpen,setMenuOpen]=useState(false)
  const[darkMode,setDarkMode]=useState(()=>localStorage.getItem("theme")!=="light")
  const toggleTheme=()=>setDarkMode(d=>{localStorage.setItem("theme",d?"light":"dark");return!d})
  const[isMobile,setIsMobile]=useState(()=>window.innerWidth<900)
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<900);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[])

  // Chequeo periódico de alertas para notificaciones
  useEffect(()=>{
    if(!user)return
    const checkAlertas=async()=>{
      if(typeof Notification==="undefined"||Notification.permission!=="granted")return
      const now=new Date()
      const hoy=today()
      const hhmm=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`
      const{data:alertas}=await supabase.from("alertas").select("*").eq("user_id",user.id).eq("activa",true)
      if(!alertas)return
      for(const a of alertas){
        // Calcular si la alerta aplica hoy
        let aplica=false
        if(a.frecuencia==="unica"&&a.fecha===hoy)aplica=true
        else if(a.frecuencia==="diaria")aplica=true
        else if(a.frecuencia==="mensual"&&a.dia_mes===now.getDate())aplica=true
        else if(a.frecuencia==="semanal"){const d=new Date(a.fecha);aplica=d.getDay()===now.getDay()}
        else if(a.frecuencia==="anual"){const d=new Date(a.fecha);aplica=d.getMonth()===now.getMonth()&&d.getDate()===now.getDate()}
        if(!aplica)continue
        // Verificar la hora (dentro de ±1 minuto)
        const alertaHora=a.hora?a.hora.slice(0,5):null
        if(alertaHora&&alertaHora!==hhmm)continue
        // Verificar que no se notificó hoy ya
        if(a.ultima_notificacion){
          const ult=new Date(a.ultima_notificacion)
          if(ult.toDateString()===now.toDateString())continue
        }
        // Disparar notificación
        const titulo="MisGastos — Recordatorio de pago"
        const sub=a.subcategoria||a.categoria
        let cuerpo=`Recordá que hoy tenés que hacer un pago: ${sub}.`
        if(a.importe)cuerpo+=`\nImporte: ${f$(a.importe)}.`
        if(a.nota)cuerpo+=`\n${a.nota}`
        new Notification(titulo,{body:cuerpo,icon:"/icon-192.png"})
        await supabase.from("alertas").update({ultima_notificacion:now.toISOString()}).eq("id",a.id)
      }
    }
    checkAlertas()
    const interval=setInterval(checkAlertas,60000)
    return()=>clearInterval(interval)
  },[user])
  const[cuentas,setCuentas]=useState([])
  const[movimientos,setMovimientos]=useState([])
  const[deuda,setDeuda]=useState([])
  const[detailMonth,setDetailMonth]=useState(null)
  const[detailTipo,setDetailTipo]=useState(null)
  const[catEgreso,setCatEgreso]=useState([])
  const[subEgreso,setSubEgreso]=useState([])
  const[catIngreso,setCatIngreso]=useState([])
  const[tiposInv,setTiposInv]=useState([])

  // Auth listener
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);setLoading(false)})
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setUser(session?.user||null)})
    return()=>subscription.unsubscribe()
  },[])

  // Load data
  const loadData=useCallback(async()=>{
    if(!user)return
    const[{data:c},{data:m},{data:d},{data:ce},{data:se},{data:ci},{data:ti}]=await Promise.all([
      supabase.from("cuentas").select("*").order("nombre"),
      supabase.from("movimientos").select("*").order("fecha",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("deuda_edgardo").select("*").order("fecha",{ascending:true}),
      supabase.from("categorias_egreso").select("*").order("nombre"),
      supabase.from("subcategorias_egreso").select("*").order("nombre"),
      supabase.from("categorias_ingreso").select("*").order("nombre"),
      supabase.from("tipos_inversion").select("*").order("nombre"),
    ])
    const normNombre=s=>(s||"").replace(/[\s\u00A0]+/g," ").trim()
    setCuentas((c||[]).map(a=>({...a,nombre:normNombre(a.nombre)})));setMovimientos(m||[]);setDeuda(d||[])
    setCatEgreso(ce||[]);setSubEgreso(se||[]);setCatIngreso(ci||[]);setTiposInv(ti||[])
  },[user])

  useEffect(()=>{loadData()},[loadData])

  const logout=async()=>{await supabase.auth.signOut();setUser(null)}

  if(loading)return<div data-theme={darkMode?"dark":"light"} style={{minHeight:"100vh",background:"var(--page-bg,#0b1120)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-muted)"}}>Cargando...</div>
  if(!user)return<div data-theme={darkMode?"dark":"light"}><LoginPage darkMode={darkMode}/></div>

  // Build dynamic categories from ABM tables (fallback to hardcoded if empty)
  const dynEgresoCats=catEgreso.length>0?catEgreso.map(c=>c.nombre):EGRESO_CATS
  const dynEgresoSubs=catEgreso.length>0?Object.fromEntries(catEgreso.map(c=>[c.nombre,subEgreso.filter(s=>s.categoria_id===c.id).map(s=>s.nombre)])):EGRESO_SUBS
  const dynIngresoCats=catIngreso.length>0?catIngreso.map(c=>c.nombre):INGRESO_CATS
  const dynInvTypes=tiposInv.length>0?tiposInv.map(t=>t.nombre):INV_TYPES

  const isAdmin=user.email==="juanfmanteca@gmail.com"
  const nav=[{id:"home",ic:IC.home,l:"Inicio"},{id:"add",ic:IC.plus,l:"Cargar"},{id:"mov",ic:IC.list,l:"Movimientos"},{id:"dash",ic:IC.chart,l:"Dashboard"},...(isAdmin?[{id:"debt",ic:IC.debt,l:"Deuda"}]:[]),{id:"ext",ic:IC.upload,l:"Extracto"},{id:"alertas",ic:IC.bell,l:"Alertas"},{id:"abm",ic:IC.settings,l:"Configuración"}]
  const viewMonth=k=>{setDetailMonth(k);setDetailTipo(null);setPg("md")}
  const viewMonthInv=k=>{setDetailMonth(k);setDetailTipo("inversion");setPg("md")}
  const viewMonthIng=k=>{setDetailMonth(k);setDetailTipo("ingreso");setPg("md")}
  const onSaved=()=>loadData()

  let C
  if(pg==="home")C=<HomePage cuentas={cuentas} movimientos={movimientos}/>
  else if(pg==="add")C=<AddPage cuentas={cuentas} movimientos={movimientos} userId={user.id} onSaved={onSaved} egresoCats={dynEgresoCats} egresoSubs={dynEgresoSubs} ingresoCats={dynIngresoCats} invTypes={dynInvTypes}/>
  else if(pg==="mov")C=<MovimientosPage movimientos={movimientos} cuentas={cuentas} userId={user.id} onSaved={onSaved}/>
  else if(pg==="dash")C=<DashboardPage movimientos={movimientos} cuentas={cuentas} onViewMonth={viewMonth} onViewMonthInv={viewMonthInv} onViewMonthIng={viewMonthIng} subEgreso={subEgreso}/>
  else if(pg==="md")C=<MonthDetail monthKey={detailMonth} filterTipo={detailTipo} movimientos={movimientos} cuentas={cuentas} onBack={()=>setPg("dash")}/>
  else if(pg==="debt"&&isAdmin)C=<DebtPage deuda={deuda}/>
  else if(pg==="ext")C=<ExtractPage cuentas={cuentas} userId={user.id} onSaved={onSaved} egresoCats={dynEgresoCats} egresoSubs={dynEgresoSubs}/>
  else if(pg==="alertas")C=<AlertasPage userId={user.id} egresoCats={dynEgresoCats} egresoSubs={dynEgresoSubs} ingresoCats={dynIngresoCats}/>
  else if(pg==="abm")C=<ABMPage cuentas={cuentas} userId={user.id} onSaved={onSaved}/>

  return(
    <div data-theme={darkMode?"dark":"light"} style={{minHeight:"100vh",background:"var(--page-bg)",color:"var(--text-primary)",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* Desktop sidebar — solo se renderiza si NO es mobile */}
      {!isMobile&&<div style={{position:"fixed",left:0,top:0,bottom:0,width:240,background:"var(--sidebar-bg)",borderRight:"1px solid var(--sidebar-border)",display:"flex",flexDirection:"column",zIndex:10,overflowY:"auto"}}>
        <div style={{padding:"28px 20px 24px"}}>
          <h1 style={{fontSize:24,fontWeight:800,margin:0,letterSpacing:-.5,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MisGastos</h1>
          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:6}}>{user.email}</div>
        </div>
        <nav style={{flex:1,padding:"8px 12px"}}>
          {nav.map(n=>{const a=pg===n.id||(pg==="md"&&n.id==="dash");return(
            <button key={n.id} onClick={()=>setPg(n.id)} style={{
              display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",marginBottom:4,
              borderRadius:14,border:"none",cursor:"pointer",transition:"all .15s",
              background:a?"linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.1))":"transparent",
              color:a?"#60a5fa":"var(--text-muted)",
              boxShadow:a?"0 2px 12px rgba(59,130,246,.08)":"none"
            }}>
              <Ic d={n.ic} s={20}/>
              <span style={{fontSize:14,fontWeight:a?600:400}}>{n.l}</span>
            </button>
          )})}
        </nav>
        <div style={{padding:"16px 12px",borderTop:"1px solid var(--card-border)"}}>
          <button onClick={toggleTheme} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"10px 16px",borderRadius:12,border:"none",cursor:"pointer",background:"var(--btn-bg)",color:"var(--text-secondary)",fontSize:13,marginBottom:4}}>
            <Ic d={darkMode?IC.sun:IC.moon} s={16}/>{darkMode?"Modo día":"Modo noche"}
          </button>
          <button onClick={logout} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",borderRadius:12,border:"none",cursor:"pointer",background:"transparent",color:"var(--text-muted)",fontSize:14}}>
            <Ic d={IC.logout} s={18}/> Cerrar sesión
          </button>
        </div>
      </div>}

      {/* Main content */}
      <div className="main-content" style={!isMobile?{marginLeft:240}:{}}>
        {/* Mobile header - solo se renderiza en mobile */}
        {isMobile&&<div className="mobile-header">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setMenuOpen(o=>!o)} style={{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",padding:8,flexShrink:0}}>
              <Ic d={menuOpen?IC.close:IC.menu} s={22}/>
            </button>
            <h1 style={{fontSize:22,fontWeight:800,margin:0,letterSpacing:-.5,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",flex:1}}>MisGastos</h1>
            <button onClick={toggleTheme} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:8,flexShrink:0}}><Ic d={darkMode?IC.sun:IC.moon} s={18}/></button>
            <button onClick={logout} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:8,flexShrink:0}}><Ic d={IC.logout} s={18}/></button>
          </div>
        </div>}

        {/* Hamburger overlay — fixed, no empuja el contenido */}
        {menuOpen&&<>
          <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:40}}/>
          <div style={{position:"fixed",top:0,left:0,bottom:0,width:260,background:"var(--sidebar-bg,#0a1020)",borderRight:"1px solid var(--card-border)",zIndex:41,padding:"52px 12px 20px",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,paddingLeft:8}}>
              <h1 style={{fontSize:20,fontWeight:800,margin:0,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MisGastos</h1>
              <button onClick={()=>setMenuOpen(false)} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:4}}><Ic d={IC.close} s={20}/></button>
            </div>
            {nav.map(n=>{const a=pg===n.id||(pg==="md"&&n.id==="dash");return(
              <button key={n.id} onClick={()=>{setPg(n.id);setMenuOpen(false)}} style={{
                display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",marginBottom:4,
                borderRadius:12,border:"none",cursor:"pointer",
                background:a?"linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.1))":"transparent",
                color:a?"#60a5fa":"var(--text-secondary)"
              }}>
                <Ic d={n.ic} s={20}/>
                <span style={{fontSize:14,fontWeight:a?600:400}}>{n.l}</span>
              </button>
            )})}
          </div>
        </>}

        {/* Desktop header — solo en desktop */}
        {!isMobile&&<div style={{padding:"28px 48px 20px",borderBottom:"1px solid var(--header-border,rgba(255,255,255,.04))"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:"var(--text-primary)",margin:0}}>
            {pg==="home"?"Inicio":pg==="add"?"Cargar Movimiento":pg==="mov"?"Movimientos":pg==="dash"?"Dashboard":pg==="md"?"Detalle Mensual":pg==="debt"?"Deuda Edgardo":pg==="ext"?"Importar Extracto":pg==="alertas"?"Alertas":pg==="abm"?"Configuración":""}
          </h2>
        </div>}

        <div className="page-content">{C}</div>

        {/* FAB: acceso rápido a Cargar desde Inicio */}
        {pg==="home"&&(
          <button onClick={()=>setPg("add")} className="fab-add" style={{
            position:"fixed",bottom:28,right:20,width:56,height:56,borderRadius:"50%",
            background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",border:"none",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
            boxShadow:"0 6px 24px rgba(59,130,246,.45)",zIndex:50
          }}>
            <Ic d={IC.plus} s={26}/>
          </button>
        )}

      </div>

      <style>{`
        *{box-sizing:border-box}

        /* ── DARK THEME (default) ── */
        [data-theme="dark"]{
          --page-bg:linear-gradient(180deg,#070b14 0%,#0b1120 30%,#0d1525 60%,#091018 100%);
          --card-bg:linear-gradient(145deg,#131a2b,#0f1623);
          --card-border:rgba(255,255,255,.06);
          --card-shadow:0 4px 24px rgba(0,0,0,.2);
          --text-primary:#e2e8f0;
          --text-secondary:#94a3b8;
          --text-muted:#64748b;
          --inp-bg:rgba(255,255,255,.03);
          --inp-border:rgba(255,255,255,.1);
          --btn-bg:rgba(255,255,255,.04);
          --sidebar-bg:linear-gradient(180deg,#080d18,#0a1020);
          --sidebar-border:rgba(255,255,255,.06);
          --header-border:rgba(255,255,255,.04);
        }

        /* ── LIGHT THEME ── */
        [data-theme="light"]{
          --page-bg:#f0f4f8;
          --card-bg:#ffffff;
          --card-border:rgba(0,0,0,.09);
          --card-shadow:0 2px 12px rgba(0,0,0,.07);
          --text-primary:#0f172a;
          --text-secondary:#1e293b;
          --text-muted:#475569;
          --inp-bg:rgba(0,0,0,.03);
          --inp-border:rgba(0,0,0,.14);
          --btn-bg:rgba(0,0,0,.05);
          --sidebar-bg:#ffffff;
          --sidebar-border:rgba(0,0,0,.08);
          --header-border:rgba(0,0,0,.06);
        }
        /* ── Modo día ── */
        [data-theme="light"] button { color: #1e293b }
        [data-theme="light"] input,
        [data-theme="light"] select,
        [data-theme="light"] textarea { color: #0f172a !important }
        [data-theme="light"] select { background-color:#fff!important;color:#0f172a!important }
        [data-theme="light"] select option { background:#fff;color:#0f172a }
        [data-theme="light"] input[type="date"]::-webkit-calendar-picker-indicator { filter:none }
        [data-theme="light"] ::-webkit-scrollbar-thumb { background:#cbd5e1 }
        [data-theme="light"] input::placeholder { color: #94a3b8 !important }

        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.7)}
        select{appearance:auto;background-color:#131a2b;color:#e2e8f0;border:1px solid rgba(255,255,255,.1)}
        select option{background:#131a2b;color:#e2e8f0}
        [data-theme="dark"] select{appearance:auto;background-color:#131a2b!important;color:#e2e8f0}
        [data-theme="dark"] select option{background:#131a2b;color:#e2e8f0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:5px}
        input:focus,select:focus,textarea:focus{border-color:rgba(59,130,246,.4)!important;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
        button:active{transform:scale(.97)}

        *,*::before,*::after{box-sizing:border-box}
        html,body{overflow-x:hidden;width:100%;margin:0;padding:0}

        .page-inner{padding:0 0 40px}
        .patrimonio-grid{grid-template-columns:1fr!important}
        .mobile-header{
          padding:14px 24px 12px;
          padding-top:calc(14px + env(safe-area-inset-top));
          border-bottom:1px solid var(--header-border,rgba(255,255,255,.04))
        }
        .main-content{width:100%;max-width:100%;overflow-x:hidden;position:relative}
        .page-content{padding:20px 24px 40px}

        @media(min-width:900px){
          .patrimonio-grid{grid-template-columns:1fr 1fr!important}
          .main-content{margin-left:240px;max-width:none;padding-bottom:32px}
          .page-content{padding:24px 48px 40px;max-width:960px}
          .page-inner{padding:0 8px}
        }

        @media(min-width:1200px){
          .page-content{max-width:1000px;padding:28px 48px 48px}
        }
      `}</style>
    </div>
  )
}
